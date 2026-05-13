import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import axios from 'node_modules/axios/index.cjs';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

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
      enTransito:
        pedidosStats.find((p) => p.estado_pedido === 'en_transito')?._count || 0,
    };

    return {
      rutasActivas: rutasActivas || 0,
      pedidos: {
        totales: counts.totales,
        entregados: counts.entregados,
        cancelados: counts.cancelados,
        fallidos: counts.fallidos,
        enRuta: counts.enTransito,
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

  async getWeeklyStats() {
    const last7Days: any[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Generamos los últimos 7 días para asegurar que la gráfica no tenga huecos
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push({
        fecha: date.toISOString().split('T')[0],
        nombreDia: date.toLocaleDateString('es-MX', { weekday: 'short' }),
        entregados: 0,
        fallidos: 0
      });
    }

    const startOfRange = new Date(today);
    startOfRange.setDate(startOfRange.getDate() - 6);

    // Consultamos la DB para obtener los conteos agrupados por día
    const stats = await this.prisma.pedidos.groupBy({
      by: ['created_at', 'estado_pedido'],
      where: {
        created_at: { gte: startOfRange }
      },
      _count: true
    });

    // Mapeamos los resultados de Prisma a nuestro array de 7 días
    stats.forEach(stat => {
      const dateStr = stat.created_at.toISOString().split('T')[0];
      const dayEntry = last7Days.find(d => d.fecha === dateStr);

      if (dayEntry) {
        if (stat.estado_pedido === 'entregado') {
          dayEntry.entregados += stat._count;
        } else if (['fallido', 'cancelado'].includes(stat.estado_pedido)) {
          dayEntry.fallidos += stat._count;
        }
      }
    });

    return last7Days;
  }

  async getTopPerformers() { // Este método es para obtener los mejores choferes, unidades o incidencias más comunes de la semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [topIncidencia, topRuta] = await Promise.all([
      // Buscamos la incidencia más repetida
      this.prisma.incidencias.groupBy({
        by: ['descripcion'],
        where: { created_at: { gte: sevenDaysAgo } },
        _count: { descripcion: true },
        orderBy: { _count: { descripcion: 'desc' } },
        take: 1
      }),
      // Buscamos la ruta con mejor desempeño (puedes ajustar esto a choferes)
      this.prisma.rutas.findFirst({
        where: { created_at: { gte: sevenDaysAgo } },
        include: { choferes: true, vehiculos: true },
        // Aquí se puede añadir lógica de conteo de pedidos entregados
      })
    ]);

    return {
      bestChofer: topRuta?.choferes?.nombre || "Sin datos",
      bestUnit: topRuta?.vehiculos?.placas || "N/A",
      commonIssue: topIncidencia[0]?.descripcion || "Ninguna"
    };
  }
}
