import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDailyStats() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [rutasActivas, pedidosStats, rawIncidencias] = await Promise.all([
      this.prisma.rutas.count({
        where: {
          updated_at: { gte: today },
          estatus_ruta: 'en_proceso',
        },
      }),
      this.prisma.pedidos.groupBy({
        by: ['estado_pedido'],
        where: { updated_at: { gte: today } },
        _count: true,
      }),
      this.prisma.incidencias.findMany({
        where: { updated_at: { gte: today } },
        orderBy: { updated_at: 'desc' }, // VITAL: Muestra lo más nuevo primero
        include: {
          rutas: { include: { vehiculos: true } },
        },
      }),
    ]);

    const counts = {
      totales: pedidosStats.reduce((acc, p) => acc + p._count, 0) || 0,
      entregados:
        pedidosStats.find((p) => p.estado_pedido === 'entregado')?._count || 0,
      cancelados:
        pedidosStats.find((p) => p.estado_pedido === 'cancelado')?._count || 0,
      fallidos:
        pedidosStats.find((p) => p.estado_pedido === 'fallido')?._count || 0,
    };

    return {
      rutasActivas: rutasActivas || 0,
      pedidos: {
        ...counts,
        enRuta: Math.max(
          0,
          counts.totales -
            (counts.entregados + counts.cancelados + counts.fallidos),
        ),
      },
      incidenciasHoy: rawIncidencias.length || 0,
      monitorIncidencias: {
        camino: rawIncidencias.filter((i) => i.categoria === 'camino') || [],
        entrega: rawIncidencias.filter((i) => i.categoria === 'entrega') || [],
        tiempo: rawIncidencias.filter((i) => i.categoria === 'tiempo') || [],
      },
    };
  }

  async getActiveOperations() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rutas = await this.prisma.rutas.findMany({
      where: {
        updated_at: { gte: today },
        estatus_ruta: 'en_proceso',
      },
      include: {
        vehiculos: true,
        choferes: true,
        detalles_ruta: { include: { pedidos: true } },
      },
    });

    return rutas.map((ruta) => {
      const totalPedidos = ruta.detalles_ruta.length;
      const entregados = ruta.detalles_ruta.filter(
        (d) => d.pedidos?.estado_pedido === 'entregado',
      ).length;
      const fallidos = ruta.detalles_ruta.filter((d) =>
        ['fallido', 'cancelado'].includes(d.pedidos?.estado_pedido),
      ).length;

      return {
        id_ruta: ruta.id,
        unidad: `${ruta.vehiculos?.modelo || 'S/M'} - ${ruta.vehiculos?.placas || 'S/P'}`,
        chofer: ruta.choferes?.nombre || 'Sin asignar',
        progreso:
          totalPedidos > 0 ? Math.round((entregados / totalPedidos) * 100) : 0,
        estatus: 'en_movimiento',
      };
    });
  }
}
