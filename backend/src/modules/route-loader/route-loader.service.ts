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
    // 1. Pre-validación: Evitar duplicados dentro del mismo archivo CSV
    const pedidosEnArchivo = new Set();
    for (const [index, row] of rows.entries()) {
      const fila = index + 2;
      if (!row.codigo_pedido) {
        throw new BadRequestException(
          `Fila ${fila}: El código de pedido es obligatorio.`,
        );
      }
      if (pedidosEnArchivo.has(row.codigo_pedido)) {
        throw new BadRequestException(
          `Fila ${fila}: El código de pedido '${row.codigo_pedido}' está duplicado en el archivo.`,
        );
      }
      pedidosEnArchivo.add(row.codigo_pedido);
    }

    // 2. Inicio de Transacción Atómica
    return await this.prisma.$transaction(async (tx) => {
      for (const [index, row] of rows.entries()) {
        const filaNum = index + 2;

        try {
          // --- VALIDACIÓN DE REQUISITOS PREVIOS ---
          const [vehiculo, chofer] = await Promise.all([
            tx.vehiculos.findUnique({ where: { placas: row.placas_vehiculo } }),
            tx.choferes.findUnique({ where: { correo: row.correo_chofer } }),
          ]);

          if (!vehiculo)
            throw new Error(`Vehículo '${row.placas_vehiculo}' no encontrado.`);
          if (!chofer)
            throw new Error(`Chofer '${row.correo_chofer}' no encontrado.`);

          // --- MANEJO DE CLIENTE ---
          let cliente = await tx.clientes.findUnique({
            where: { correo: row.correo_cliente },
          });

          if (!cliente) {
            const lat = row.latitud_cliente?.trim();
            const lng = row.longitud_cliente?.trim();

            if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
              throw new Error(
                `Coordenadas inválidas para ${row.nombre_cliente}. Se requiere latitud y longitud numérica.`,
              );
            }

            const wktPoint = `POINT(${lng} ${lat})`;

            await tx.$executeRawUnsafe(
              `INSERT INTO public.clientes (nombre, telefono, direccion, correo, coordenadas, codigo, contacto)
             VALUES ($1, $2, $3, $4, ST_GeographyFromText('SRID=4326;${wktPoint}'), $5, $6)`,
              row.nombre_cliente,
              row.telefono_cliente,
              row.direccion_cliente,
              row.correo_cliente,
              row.codigo_cliente,
              row.contacto_cliente,
            );

            cliente = await tx.clientes.findUnique({
              where: { correo: row.correo_cliente },
            });
          }

          // --- MANEJO DE RUTA ---
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

          // --- VALIDACIÓN DE PEDIDO EXISTENTE EN BD ---
          const pedidoExistente = await tx.pedidos.findFirst({
            where: { codigo_rastreo: row.codigo_pedido },
          });

          if (pedidoExistente) {
            throw new Error(
              `El pedido '${row.codigo_pedido}' ya está registrado en el sistema.`,
            );
          }

          // --- CREACIÓN DE PEDIDO Y VÍNCULO ---
          const pedido = await tx.pedidos.create({
            data: {
              codigo_rastreo: row.codigo_pedido,
              descripcion_carga: row.descripcion_pedido,
              cliente_id: cliente.id,
              estado_pedido: 'pendiente',
            },
          });

          await tx.detalles_ruta.create({
            data: {
              ruta_id: ruta.id,
              pedido_id: pedido.id,
              estado_intento: 'pendiente',
            },
          });
        } catch (error) {
          // Relanzamos el error con el contexto de la fila para el usuario
          throw new BadRequestException(`Fila ${filaNum}: ${error.message}`);
        }
      }
      return { success: true, count: rows.length };
    });
  }

  async processUpdateFailed(rows: any[]) {
    return await this.prisma.$transaction(async (tx) => {
      for (const [index, row] of rows.entries()) {
        const filaNum = index + 2; // +2 por el encabezado y el índice 0

        // 1. Buscar pedido con estado estricto
        const pedido = await tx.pedidos.findFirst({
          where: {
            codigo_rastreo: row.codigo_pedido,
            estado_pedido: 'extraido_fallido',
          },
        });

        if (!pedido) {
          throw new BadRequestException(
            `Fila ${filaNum}: El pedido '${row.codigo_pedido}' no existe en el sistema o no tiene el estado 'extraido_fallido'.`,
          );
        }

        // 2. Buscar Ruta
        const ruta = await tx.rutas.findUnique({
          where: { codigo_rastreo: row.codigo_ruta },
        });

        if (!ruta) {
          throw new BadRequestException(
            `Fila ${filaNum}: La ruta destino '${row.codigo_ruta}' no existe.`,
          );
        }

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
