// /backend/src/mobile-app/evidence/evidence.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { MonitoringGateway } from '../../modules/monitoring/gateways/monitoring.gateway';
import { DashboardGateway } from '../../modules/dashboard/dashboard.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class EvidenceService {
  private supabase;
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MonitoringGateway))
    private readonly monitoringGateway: MonitoringGateway,
    @Inject(forwardRef(() => DashboardGateway))
    private readonly dashboardGateway: DashboardGateway,
    private readonly redis: RedisService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  /**
   * Helper genérico para subir un Buffer al Storage de Supabase
   */
  private async uploadBufferToSupabase(
    buffer: Buffer,
    path: string,
    mimetype: string,
  ) {
    const { data, error } = await this.supabase.storage
      .from('evidencias')
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Error al subir a Supabase [${path}]: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Error de almacenamiento: ${error.message}`,
      );
    }
    return data.path;
  }

  /**
   * Helper para eliminar archivos de Supabase en caso de rollback manual
   */
  private async deleteFromSupabase(paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await this.supabase.storage
      .from('evidencias')
      .remove(paths);
    if (error) {
      this.logger.error(
        `Fallo al limpiar archivos tras error en DB: ${error.message}`,
      );
    }
  }

  async saveEvidence(dto: CreateEvidenceDto, photoFile: Express.Multer.File) {
    const { pedidoId, firmaBase64, latitude, longitude } = dto;
    const UMBRAL_METROS = 100;
    const uploadedPaths: string[] = [];

    // 1. Verificación previa de existencia y estado
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id: pedidoId },
      select: { estado_pedido: true },
    });

    if (!pedido)
      throw new NotFoundException(`El pedido con ID ${pedidoId} no existe.`);
    if (pedido.estado_pedido === 'entregado') {
      throw new ConflictException(
        'Este pedido ya ha sido registrado como entregado.',
      );
    }

    try {
      // 2. Procesar Fotografía
      const fotoFileName = `foto_${pedidoId}_${Date.now()}.jpg`;
      const fotoPath = await this.uploadBufferToSupabase(
        photoFile.buffer,
        `pedidos/fotos/${fotoFileName}`,
        photoFile.mimetype,
      );
      uploadedPaths.push(fotoPath);

      // 3. Procesar Firma
      const base64Data = firmaBase64.replace(/^data:image\/\w+;base64,/, '');
      const firmaBuffer = Buffer.from(base64Data, 'base64');
      const firmaFileName = `firma_${pedidoId}_${Date.now()}.png`;
      const firmaPath = await this.uploadBufferToSupabase(
        firmaBuffer,
        `pedidos/firmas/${firmaFileName}`,
        'image/png',
      );
      uploadedPaths.push(firmaPath);

      // 4. Persistencia transaccional
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          WITH info_cliente AS (
            SELECT c.coordenadas 
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.id = ${pedidoId}::uuid
            LIMIT 1
          )
          INSERT INTO evidencias (
            pedido_id, foto_url, firma_url, coordenadas_entrega, estado_evidencia
          ) 
          SELECT 
            ${pedidoId}::uuid, 
            ${fotoPath}, 
            ${firmaPath}, 
            ST_SetSRID(ST_MakePoint(${+longitude}, ${+latitude}), 4326)::geography,
            CASE 
              WHEN ST_Distance(
                ST_SetSRID(ST_MakePoint(${+longitude}, ${+latitude}), 4326)::geography, 
                (SELECT coordenadas FROM info_cliente)
              ) <= ${UMBRAL_METROS} THEN 'auto aprobada'
              ELSE 'alerta'
            END
          FROM info_cliente;
        `;

        await tx.pedidos.update({
          where: { id: pedidoId },
          data: {
            estado_pedido: 'entregado',
            updated_at: new Date(),
          },
        });

        await tx.detalles_ruta.updateMany({
          where: {
            pedido_id: pedidoId,
            rutas: { estatus_ruta: 'en_proceso' },
          },
          data: { estado_intento: 'entregado' },
        });

        return {
          success: true,
          message: 'Evidencia procesada correctamente',
        };
      });

      this.monitoringGateway.server.emit('fleetListUpdated');
      await this.dashboardGateway.emitUpdate();
      return result;
    } catch (error) {
      // Rollback manual de archivos en Supabase si la DB falla
      await this.deleteFromSupabase(uploadedPaths);

      this.logger.error(
        `Error crítico en saveEvidence para pedido ${pedidoId}: ${error.message}`,
      );
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        'No se pudo completar el registro de la entrega.',
      );
    }
  }

  private async executeInsertIncident(
    tx: any,
    dto: CreateIncidentDto,
    fotoUrl: string | null,
  ) {
    const {
      pedidoId,
      rutaId,
      tipo,
      descripcion,
      latitude,
      longitude,
      estado_incidencia,
      categoria,
    } = dto;

    try {
      const queryResult = await tx.$executeRaw`
        INSERT INTO incidencias (
          ruta_id, pedido_id, tipo, descripcion, foto_url, coordenadas_incidente, estado_incidencia, categoria, updated_at
        ) VALUES (
          ${rutaId}::uuid, 
          ${pedidoId ? pedidoId : null}::uuid, 
          ${tipo}, 
          ${descripcion}, 
          ${fotoUrl},
          ST_SetSRID(ST_MakePoint(${+longitude}, ${+latitude}), 4326)::geography,
          ${estado_incidencia || 'abierta'},
          ${categoria || 'camino'},
          NOW()
        )
      `;

      this.monitoringGateway.server.emit('newIncidentAlert', {
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        rutaId: dto.rutaId,
        categoria: dto.categoria || 'camino',
        coordenadas: { lat: dto.latitude, lng: dto.longitude },
        fecha: new Date(),
      });

      return queryResult;
    } catch (error) {
      this.logger.error(`Error en executeInsertIncident: ${error.message}`);
      throw new InternalServerErrorException(
        'Error al insertar el registro de incidencia.',
      );
    }
  }

  async saveIncident(dto: CreateIncidentDto, file?: Express.Multer.File) {
    const rutaId = dto.rutaId;
    const ruta = await this.prisma.rutas.findUnique({ where: { id: rutaId } });
    if (!ruta) throw new NotFoundException('La ruta especificada no existe.');

    let fotoUrl = null;
    try {
      dto.categoria = 'camino';
      if (file) {
        const fileName = `incidente_${Date.now()}.jpg`;
        fotoUrl = await this.uploadBufferToSupabase(
          file.buffer,
          `incidentes/${fileName}`,
          file.mimetype,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await this.executeInsertIncident(tx, dto, fotoUrl);
        return { success: true, message: 'Incidente registrado.' };
      });

      await this.dashboardGateway.emitUpdate();
      return result;
    } catch (error) {
      if (fotoUrl) await this.deleteFromSupabase([fotoUrl]);
      this.logger.error(`Error en saveIncident: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo guardar el incidente.',
      );
    }
  }

  async saveFailedDelivery(dto: CreateIncidentDto, file?: Express.Multer.File) {
    const { pedidoId, rutaId } = dto;

    // 1. Verificación de existencia del pedido
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id: pedidoId },
    });
    if (!pedido) throw new NotFoundException('El pedido no existe.');

    // 2. Verificación de existencia de la relación en la ruta
    const detalleRuta = await this.prisma.detalles_ruta.findFirst({
      where: {
        pedido_id: pedidoId,
        ruta_id: rutaId,
      },
    });
    if (!detalleRuta) {
      throw new NotFoundException(
        'El pedido no pertenece a la ruta especificada.',
      );
    }

    let fotoUrl = null;
    try {
      dto.categoria = 'entrega';

      // 3. Subida de evidencia a Supabase
      if (file) {
        const fileName = `fallido_${pedidoId}_${Date.now()}.jpg`;
        fotoUrl = await this.uploadBufferToSupabase(
          file.buffer,
          `incidentes/fallidos/${fileName}`,
          file.mimetype,
        );
      }

      // 4. Transacción de Base de Datos
      const result = await this.prisma.$transaction(async (tx) => {
        // Registrar la incidencia detallada
        await this.executeInsertIncident(tx, dto, fotoUrl);

        // Actualizar el estado global del pedido
        await tx.pedidos.update({
          where: { id: pedidoId },
          data: {
            estado_pedido: 'fallido',
            updated_at: new Date(),
          },
        });

        // ACTUALIZACIÓN SOLICITADA: Marcar el intento específico en la ruta como fallido
        await tx.detalles_ruta.updateMany({
          where: {
            pedido_id: pedidoId,
            ruta_id: rutaId,
          },
          data: {
            estado_intento: 'fallido',
          },
        });

        return {
          success: true,
          message:
            'Pedido y detalle de ruta marcados como fallidos correctamente.',
        };
      });

      this.monitoringGateway.server.emit('fleetListUpdated');
      await this.dashboardGateway.emitUpdate();
      return result;
    } catch (error) {
      // Rollback de imagen si la DB falla
      if (fotoUrl) await this.deleteFromSupabase([fotoUrl]);

      this.logger.error(`Error en saveFailedDelivery: ${error.message}`);
      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        'Error al procesar el fallo de entrega en el sistema.',
      );
    }
  }

  async saveFailedRoute(dto: CreateIncidentDto) {
    try {
      dto.categoria = 'tiempo';
      dto.tipo = 'ruta fallida';
      dto.descripcion =
        'El dia no fue suficiente para entregar todos los pedidos';
      dto.pedidoId = undefined;

      const ruta = await this.prisma.rutas.findUnique({
        where: { id: dto.rutaId },
      });

      if (!ruta) throw new NotFoundException('Ruta no encontrada');
      if (ruta.estatus_ruta === 'finalizada') {
        throw new BadRequestException('Esta ruta ya se encuentra finalizada.');
      }

      const redisStartTime = await this.redis.getStartTime(dto.rutaId);
      const fechaInicioFinal = redisStartTime || ruta.created_at.toISOString();
      const rawPoints = await this.redis.getRoutePoints(dto.rutaId);

      const points = rawPoints
        .map((p: any) => {
          if (typeof p === 'string') {
            try {
              return JSON.parse(p);
            } catch {
              return null;
            }
          }
          return p;
        })
        .filter(
          (p) => p !== null && p.lng !== undefined && p.lat !== undefined,
        );

      let lineStringWKT = null;
      if (points.length >= 2) {
        const wktPoints = points.map((p) => `${p.lng} ${p.lat}`).join(', ');
        lineStringWKT = `LINESTRING(${wktPoints})`;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Registrar la incidencia de la ruta
        await this.executeInsertIncident(tx, dto, null);

        // 2. Actualizar pedidos (Estado Global)
        // Solo afectamos los que no se lograron entregar
        await tx.pedidos.updateMany({
          where: {
            detalles_ruta: { some: { ruta_id: dto.rutaId } },
            estado_pedido: { in: ['pendiente', 'en_transito'] },
          },
          data: {
            estado_pedido: 'fallido',
            updated_at: new Date(),
          },
        });

        // 3. NUEVO: Actualizar detalles_ruta (Estado del Intento)
        // Marcamos como fallidos todos los pedidos de esta ruta que quedaron a medias
        await tx.detalles_ruta.updateMany({
          where: {
            ruta_id: dto.rutaId,
            estado_intento: 'en_transito', // O cualquier estado que no sea 'completado'/'entregado'
          },
          data: { estado_intento: 'fallido' },
        });

        if (lineStringWKT) {
          const yaExiste =
            await tx.$queryRaw`SELECT 1 FROM trayectos_finalizados WHERE ruta_id = ${dto.rutaId}::uuid`;
          if ((yaExiste as any[]).length === 0) {
            await tx.$executeRawUnsafe(`
              INSERT INTO trayectos_finalizados (ruta_id, geometria_ruta, distancia_total_km, fecha_inicio)
              VALUES (
                '${dto.rutaId}'::uuid,
                ST_GeogFromText('${lineStringWKT}'),
                ST_Length(ST_GeogFromText('${lineStringWKT}')) / 1000,
                '${fechaInicioFinal}'
              )
            `);
          }
        }

        await tx.rutas.update({
          where: { id: dto.rutaId },
          data: {
            estatus_ruta: 'finalizada',
            updated_at: new Date(),
          },
        });

        await tx.ubicacion_actual.deleteMany({
          where: { ruta_id: dto.rutaId },
        });
        await this.redis.clearRouteData(dto.rutaId);

        return {
          success: true,
          message: 'Jornada finalizada y pedidos marcados como fallidos.',
        };
      });

      this.monitoringGateway.server.emit('fleetListUpdated');
      await this.dashboardGateway.emitUpdate();
      return result;
    } catch (error) {
      this.logger.error(`Error en saveFailedRoute: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Error al finalizar la ruta por tiempo.',
      );
    }
  }

  async getIncidentsByChofer(choferId: string) {
    try {
      const incidents: any[] = await this.prisma.$queryRaw`
        SELECT 
          i.id, i.tipo, i.descripcion, i.estado_incidencia as "estado",
          i.foto_url as "fotoUrl", i.pedido_id as "pedidoId",
          i.ruta_id as "rutaId", i.created_at as "createdAt",
          i.categoria,
          ST_X(i.coordenadas_incidente::geometry) as "longitude",
          ST_Y(i.coordenadas_incidente::geometry) as "latitude",
          p.codigo_rastreo as "codigoPedido"
        FROM incidencias i
        JOIN rutas r ON i.ruta_id = r.id
        LEFT JOIN pedidos p ON i.pedido_id = p.id
        WHERE r.chofer_id = ${choferId}::uuid
          AND i.categoria = 'camino' 
        ORDER BY i.created_at DESC
      `;

      if (incidents.length === 0) return [];

      const paths = incidents.map((i) => i.fotoUrl).filter(Boolean);
      if (paths.length > 0) {
        const { data: signedUrls, error } = await this.supabase.storage
          .from('evidencias')
          .createSignedUrls(paths, 3600);

        if (error) {
          this.logger.error(
            `Error al firmar URLs de Supabase: ${error.message}`,
          );
        } else {
          return incidents.map((incident) => {
            const signed = signedUrls.find((s) => s.path === incident.fotoUrl);
            return {
              ...incident,
              fotoUrl: signed ? signed.signedUrl : null,
            };
          });
        }
      }

      return incidents;
    } catch (error) {
      this.logger.error(`Error en getIncidentsByChofer: ${error.message}`);
      throw new InternalServerErrorException(
        'Error al consultar el historial de incidencias.',
      );
    }
  }

  async updateIncident(id: string, dto: UpdateIncidentDto) {
    try {
      const incidencia = await this.prisma.incidencias.findUnique({
        where: { id },
      });
      if (!incidencia) throw new NotFoundException('La incidencia no existe.');

      const updated = await this.prisma.incidencias.update({
        where: { id },
        data: {
          ...(dto.estado_incidencia && {
            estado_incidencia: dto.estado_incidencia,
          }),
          ...(dto.descripcion && { descripcion: dto.descripcion }),
          ...(dto.tipo && { tipo: dto.tipo }),
          updated_at: new Date(),
        },
      });

      this.monitoringGateway.server.emit('fleetListUpdated');
      await this.dashboardGateway.emitUpdate();
      return { success: true, message: 'Incidente actualizado correctamente.' };
    } catch (error) {
      this.logger.error(`Error en updateIncident ${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'No se pudo actualizar la incidencia.',
      );
    }
  }

  async deleteIncident(id: string) {
    try {
      const incident = await this.prisma.incidencias.findUnique({
        where: { id },
        select: { foto_url: true },
      });

      if (!incident) throw new NotFoundException('La incidencia no existe.');

      if (incident.foto_url) {
        await this.deleteFromSupabase([incident.foto_url]);
      }

      await this.prisma.incidencias.delete({ where: { id } });
      this.monitoringGateway.server.emit('fleetListUpdated');
      await this.dashboardGateway.emitUpdate();

      return { success: true, message: 'Incidencia eliminada correctamente.' };
    } catch (error) {
      this.logger.error(`Error en deleteIncident ${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'No se pudo eliminar la incidencia.',
      );
    }
  }
}
