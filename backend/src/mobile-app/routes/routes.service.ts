// /backend/src/mobile-app/routes/routes.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { MonitoringGateway } from '../../modules/monitoring/gateways/monitoring.gateway';
import { DashboardGateway } from '../../modules/dashboard/dashboard.gateway';
@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @Inject(forwardRef(() => MonitoringGateway))
    private readonly monitoringGateway: MonitoringGateway,
    @Inject(forwardRef(() => DashboardGateway))
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async getActiveRoute(choferId: string) {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const ruta = await this.prisma.rutas.findFirst({
        where: {
          chofer_id: choferId,
          estatus_ruta: { in: ['programada', 'en_proceso'] },
          fecha_programada: hoy,
        },
        select: {
          id: true,
          fecha_programada: true,
          estatus_ruta: true,
          vehiculos: {
            select: { placas: true, marca: true, modelo: true },
          },
          created_at: true,
        },
      });

      if (!ruta) {
        throw new NotFoundException(
          'No tienes ninguna ruta asignada para hoy.',
        );
      }

      const pedidos = await this.prisma.$queryRaw<any[]>`
        SELECT 
          dr.id as "detalleId",
          dr.orden_entrega as "orden",
          p.id as "pedidoId",
          p.descripcion_carga as "descripcion",
          p.estado_pedido as "estado",
          c.nombre as "cliente",
          c.direccion as "direccion",
          ST_X(c.coordenadas::geometry) as "longitude",
          ST_Y(c.coordenadas::geometry) as "latitude"
        FROM detalles_ruta dr
        INNER JOIN pedidos p ON dr.pedido_id = p.id
        INNER JOIN clientes c ON p.cliente_id = c.id
        WHERE dr.ruta_id = ${ruta.id}::uuid
          AND p.estado_pedido IN ('pendiente', 'en_transito')
        ORDER BY dr.orden_entrega ASC
      `;

      return { ...ruta, pedidos };
    } catch (error) {
      this.logger.error(`Error al obtener ruta activa: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al consultar la ruta asignada.',
      );
    }
  }

  async startRoute(rutaId: string, choferId: string) {
    const ruta = await this.prisma.rutas.findFirst({
      where: { id: rutaId, chofer_id: choferId },
      include: { detalles_ruta: true },
    });

    if (!ruta) throw new NotFoundException('La ruta no existe.');
    if (ruta.estatus_ruta === 'en_proceso')
      throw new ConflictException('La ruta ya se encuentra en proceso.');
    if (ruta.estatus_ruta === 'finalizada')
      throw new BadRequestException(
        'No se puede iniciar una ruta que ya ha finalizado.',
      );
    if (ruta.detalles_ruta.length === 0)
      throw new BadRequestException(
        'No puedes iniciar una ruta sin pedidos asignados.',
      );

    try {
      // 1. Registro de tiempo en Redis (Cache crítico para analytics)
      await this.redis.setStartTime(rutaId);

      // 2. Transacción de base de datos
      const result = await this.prisma.$transaction(async (tx) => {
        const rutaActualizada = await tx.rutas.update({
          where: { id: rutaId },
          data: {
            estatus_ruta: 'en_proceso',
            updated_at: new Date(),
          },
        });

        await tx.pedidos.updateMany({
          where: {
            detalles_ruta: { some: { ruta_id: rutaId } },
            estado_pedido: 'pendiente',
          },
          data: { estado_pedido: 'en_transito', updated_at: new Date() },
        });

        await tx.detalles_ruta.updateMany({
          where: {
            ruta_id: rutaId,
            estado_intento: 'pendiente',
          },
          data: { estado_intento: 'en_transito' },
        });

        return rutaActualizada;
      });

      this.monitoringGateway.server.emit('fleetListUpdated');
      this.logger.log(`Ruta ${rutaId} iniciada por chofer ${choferId}`);

      return result;
    } catch (error) {
      this.logger.error(`Fallo al iniciar ruta ${rutaId}: ${error.message}`);
      throw new InternalServerErrorException(
        'Error interno al iniciar la jornada.',
      );
    }
  }

  async updateLocation(dto: UpdateLocationDto, choferId: string) {
    try {
      const ruta = await this.prisma.rutas.findFirst({
        where: {
          id: dto.rutaId,
          chofer_id: choferId,
          estatus_ruta: 'en_proceso',
        },
      });

      if (!ruta)
        throw new BadRequestException(
          'Reporte de ubicación rechazado: ruta no válida o cerrada.',
        );

      const lastPoints = await this.redis.getRoutePoints(dto.rutaId);
      let shouldPushToHistory = true;

      if (lastPoints && lastPoints.length > 0) {
        const lastPoint =
          typeof lastPoints[0] === 'string'
            ? JSON.parse(lastPoints[0])
            : lastPoints[0];

        // Cálculo de distancia (Haversine) para filtrar ruido de GPS
        const R = 6371e3;
        const dLat = ((dto.latitude - lastPoint.lat) * Math.PI) / 180;
        const dLon = ((dto.longitude - lastPoint.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lastPoint.lat * Math.PI) / 180) *
            Math.cos((dto.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (R * c < 2) shouldPushToHistory = false; // Ignorar si el movimiento es menor a 2 metros
      }

      if (shouldPushToHistory) {
        await this.redis
          .pushLocation(dto.rutaId, dto)
          .catch((e) =>
            this.logger.warn(
              `Redis inalcanzable al guardar puntos: ${e.message}`,
            ),
          );
      }

      await this.prisma.$executeRaw`
        INSERT INTO ubicacion_actual (ruta_id, ultima_coordenada, velocidad_kmh, nivel_bateria, fecha_actualizacion)
        VALUES (
          ${dto.rutaId}::uuid, 
          ST_SetSRID(ST_MakePoint(${+dto.longitude}, ${+dto.latitude}), 4326)::geography, 
          ${dto.velocidad || 0}, 
          ${dto.bateria || 0}, 
          NOW()
        )
        ON CONFLICT (ruta_id) 
        DO UPDATE SET 
          ultima_coordenada = EXCLUDED.ultima_coordenada,
          velocidad_kmh = EXCLUDED.velocidad_kmh,
          nivel_bateria = EXCLUDED.nivel_bateria,
          fecha_actualizacion = NOW();
      `;

      return { success: true };
    } catch (error) {
      this.logger.error(`Error de ubicación: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error al actualizar coordenadas.',
      );
    }
  }

  async finishRoute(rutaId: string, choferId: string) {
    try {
      const ruta = await this.prisma.rutas.findFirst({
        where: { id: rutaId, chofer_id: choferId, estatus_ruta: 'en_proceso' },
      });

      if (!ruta)
        throw new NotFoundException(
          'No se puede finalizar: la ruta no existe o ya está cerrada.',
        );

      const redisStartTime = await this.redis.getStartTime(rutaId);
      const fechaInicioFinal = redisStartTime || ruta.created_at.toISOString();
      const rawPoints = await this.redis.getRoutePoints(rutaId);

      // Si no hay trayectoria, finalizamos solo el estatus
      if (!rawPoints || rawPoints.length < 2) {
        await this.prisma.rutas.update({
          where: { id: rutaId },
          data: { estatus_ruta: 'finalizada', updated_at: new Date() },
        });
        await this.prisma.ubicacion_actual.deleteMany({
          where: { ruta_id: rutaId },
        });
        this.monitoringGateway.server.emit('fleetListUpdated');
        return { message: 'Ruta finalizada sin trayectoria disponible.' };
      }

      const points = rawPoints
        .map((p: any) => {
          try {
            return typeof p === 'string' ? JSON.parse(p) : p;
          } catch {
            return null;
          }
        })
        .filter(
          (p) => p !== null && p.lng !== undefined && p.lat !== undefined,
        );

      if (points.length < 2)
        throw new BadRequestException(
          'Trayectoria insuficiente para procesar mapa.',
        );

      const wktPoints = points.map((p) => `${p.lng} ${p.lat}`).join(', ');
      const lineStringWKT = `LINESTRING(${wktPoints})`;

      await this.prisma.$transaction(async (tx) => {
        // Evitar duplicados en trayectos
        const yaExiste =
          await tx.$queryRaw`SELECT 1 FROM trayectos_finalizados WHERE ruta_id = ${rutaId}::uuid`;

        if ((yaExiste as any[]).length === 0) {
          await tx.$executeRawUnsafe(`
            INSERT INTO trayectos_finalizados (ruta_id, geometria_ruta, distancia_total_km, fecha_inicio)
            VALUES (
              '${rutaId}'::uuid,
              ST_GeogFromText('${lineStringWKT}'),
              ST_Length(ST_GeogFromText('${lineStringWKT}')) / 1000,
              '${fechaInicioFinal}'
            )
          `);
        }

        await tx.rutas.update({
          where: { id: rutaId },
          data: { estatus_ruta: 'finalizada', updated_at: new Date() },
        });

        await tx.ubicacion_actual.deleteMany({ where: { ruta_id: rutaId } });
      });

      await this.redis.clearRouteData(rutaId);
      this.monitoringGateway.server.emit('fleetListUpdated');

      return {
        success: true,
        message: 'Ruta finalizada y trayectoria guardada.',
      };
    } catch (error) {
      this.logger.error(`Error al finalizar ruta ${rutaId}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Error al procesar el cierre de ruta.',
      );
    }
  }

  async updatePedidoStatus(pedidoId: string, nuevoEstado: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Actualizar el pedido global
        const pedido = await tx.pedidos.update({
          where: { id: pedidoId },
          data: {
            estado_pedido: nuevoEstado,
            updated_at: new Date(),
          },
        });

        // 2. NUEVO: Actualizar el estado_intento en la ruta activa
        // Buscamos el detalle de ruta donde la ruta asociada NO esté finalizada
        await tx.detalles_ruta.updateMany({
          where: {
            pedido_id: pedidoId,
            rutas: {
              estatus_ruta: 'en_proceso',
            },
          },
          data: {
            estado_intento: nuevoEstado, // Ej: 'entregado'
          },
        });

        this.monitoringGateway.server.emit('fleetListUpdated');
        this.dashboardGateway.emitUpdate();
        return pedido;
      });
    } catch (error) {
      this.logger.error(
        `Error actualizando pedido ${pedidoId}: ${error.message}`,
      );
      throw new NotFoundException(
        'No se pudo actualizar el pedido. Verifique que el ID sea correcto.',
      );
    }
  }
}
