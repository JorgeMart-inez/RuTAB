import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class RouteLoaderService {
  constructor(private prisma: PrismaService) {}

  async processNewRoutes(rows: any[], adminId: string) {
    return await this.prisma.$transaction(async (tx) => {
      for (const [index, row] of rows.entries()) {
        const filaNum = index + 2; // Para reportar errores al usuario

        // --- VALIDACIÓN DE CAMPOS ---
        if (!row.placas_vehiculo) {
          throw new BadRequestException(
            `Fila ${filaNum}: La columna 'placas_vehiculo' está vacía o no se reconoce.`,
          );
        }
        if (!row.correo_chofer) {
          throw new BadRequestException(
            `Fila ${filaNum}: La columna 'correo_chofer' está vacía.`,
          );
        }

        // 1. Validar existencia de Vehículo
        const vehiculo = await tx.vehiculos.findUnique({
          where: { placas: row.placas_vehiculo },
        });

        if (!vehiculo) {
          throw new NotFoundException(
            `Fila ${filaNum}: Vehículo con placas '${row.placas_vehiculo}' no registrado en el sistema.`,
          );
        }

        // 2. Validar Chofer
        const chofer = await tx.choferes.findUnique({
          where: { correo: row.correo_chofer },
        });

        if (!chofer) {
          throw new NotFoundException(
            `Fila ${filaNum}: Chofer con correo '${row.correo_chofer}' no encontrado.`,
          );
        }

        // 2. Manejo de Cliente con Geography (SQL Raw por limitación de Prisma)
        // Buscamos si el cliente existe por correo
        let cliente = await tx.clientes.findUnique({
          where: { correo: row.correo_cliente },
        });

        if (!cliente) {
          const lat = row.latitud_cliente?.trim();
          const lng = row.longitud_cliente?.trim();

          // Validación robusta de presencia
          if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
            throw new BadRequestException(
              `Fila ${filaNum}: Coordenadas inválidas para el cliente ${row.nombre_cliente}. Se esperaba latitud y longitud numérica.`,
            );
          }

          const wktPoint = `POINT(${lng} ${lat})`;

          try {
            await tx.$executeRawUnsafe(
              `
      INSERT INTO public.clientes (nombre, telefono, direccion, correo, coordenadas, codigo, contacto)
      VALUES ($1, $2, $3, $4, ST_GeographyFromText('SRID=4326;${wktPoint}'), $5, $6)
      `,
              row.nombre_cliente,
              row.telefono_cliente,
              row.direccion_cliente,
              row.correo_cliente,
              row.codigo_cliente,
              row.contacto_cliente,
            );
          } catch (dbError) {
            throw new BadRequestException(
              `Fila ${filaNum}: Error de base de datos al crear cliente. Verifica que el correo sea único.`,
            );
          }

          cliente = await tx.clientes.findUnique({
            where: { correo: row.correo_cliente },
          });
        }

        // 3. Crear o Vincular Ruta
        let ruta = await tx.rutas.findUnique({
          where: { codigo_rastreo: row.codigo_ruta },
        });
        if (!ruta) {
          ruta = await tx.rutas.create({
            data: {
              codigo_rastreo: row.codigo_ruta,
              vehiculo_id: vehiculo.id,
              chofer_id: chofer.id,
              creado_por: adminId,
              fecha_programada: new Date(row.fecha),
              estatus_ruta: 'borrador',
            },
          });
        }

        // 4. Crear Pedido
        const pedido = await tx.pedidos.create({
          data: {
            codigo_rastreo: row.codigo_pedido,
            descripcion_carga: row.descripcion_pedido,
            cliente_id: cliente.id,
            estado_pedido: 'pendiente',
          },
        });

        // 5. Crear Detalle de Ruta
        await tx.detalles_ruta.create({
          data: {
            ruta_id: ruta.id,
            pedido_id: pedido.id,
            estado_intento: 'pendiente',
          },
        });
      }
      return { success: true, count: rows.length };
    });
  }

  async processUpdateFailed(rows: any[]) {
    return await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        // 1. Buscar pedido con estado específico
        const pedido = await tx.pedidos.findFirst({
          where: {
            codigo_rastreo: row.codigo_pedido,
            estado_pedido: 'extraido_fallido',
          },
        });

        if (!pedido) {
          throw new BadRequestException(
            `Pedido ${row.codigo_pedido} no encontrado o no está marcado como extraido_fallido.`,
          );
        }

        // 2. Buscar Ruta
        const ruta = await tx.rutas.findUnique({
          where: { codigo_rastreo: row.codigo_ruta },
        });
        if (!ruta)
          throw new NotFoundException(`Ruta ${row.codigo_ruta} no encontrada.`);

        // 3. Actualizar Pedido a pendiente
        await tx.pedidos.update({
          where: { id: pedido.id },
          data: { estado_pedido: 'pendiente' },
        });

        // 4. Crear nuevo detalle de ruta
        await tx.detalles_ruta.create({
          data: {
            ruta_id: ruta.id,
            pedido_id: pedido.id,
            estado_intento: 'pendiente',
          },
        });
      }
      return { success: true, count: rows.length };
    });
  }
}
