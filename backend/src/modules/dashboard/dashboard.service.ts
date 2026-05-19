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
        where: { created_at: { gte: today } },
        orderBy: { created_at: 'desc' }, // VITAL: Muestra lo más nuevo primero
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
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const weekday = todayUtc.getUTCDay();
    const mondayOffset = (weekday + 6) % 7; // 0 => Sunday -> 6, 1 => Monday -> 0
    const weekStart = new Date(todayUtc);
    weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const last7Days: any[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + i);
      last7Days.push({
        fecha: date.toISOString().split('T')[0],
        nombreDia: date.toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' }),
        entregados: 0,
        fallidos: 0,
      });
    }

    // Consultamos la DB para obtener los conteos agrupados por día
    const stats = await this.prisma.pedidos.groupBy({
      by: ['created_at', 'estado_pedido'],
      where: {
        created_at: { gte: weekStart, lt: weekEnd },
      },
      _count: true,
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

  async getWeeklyStatsForRange(start: Date, end: Date) {
    const range: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      range.push({
        fecha: current.toISOString().split('T')[0],
        nombreDia: current.toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' }),
        entregados: 0,
        fallidos: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    const stats = await this.prisma.$queryRaw`
      SELECT
        date(created_at) as fecha,
        to_char(created_at, 'Dy') as "nombreDia",
        count(*) filter (where estado_pedido = 'entregado') as entregados,
        count(*) filter (where estado_pedido in ('fallido', 'cancelado')) as fallidos
      FROM pedidos
      WHERE created_at BETWEEN ${start} AND ${end}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const statsMap = (stats as any[]).reduce((acc, item) => {
      const fechaKey = item.fecha instanceof Date ? item.fecha.toISOString().split('T')[0] : item.fecha;
      acc[fechaKey] = item;
      return acc;
    }, {} as Record<string, any>);

    return range.map((day) => {
      const raw = statsMap[day.fecha] || {};
      return {
        fecha: day.fecha,
        nombreDia: raw.nombreDia || day.nombreDia,
        entregados: Number(raw.entregados || 0),
        fallidos: Number(raw.fallidos || 0),
      };
    });
  }

  async getStatsForRange(start: Date, end: Date) {
    const [rutasActivas, pedidosStats, rawIncidencias] = await Promise.all([
      this.prisma.rutas.count({
        where: {
          updated_at: { gte: start, lte: end },
          estatus_ruta: 'en_proceso',
        },
      }),
      this.prisma.pedidos.groupBy({
        by: ['estado_pedido'],
        where: { updated_at: { gte: start, lte: end } },
        _count: true,
      }),
      this.prisma.incidencias.findMany({
        where: { created_at: { gte: start, lte: end } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const counts = {
      totales: pedidosStats.reduce((acc, p) => acc + p._count, 0) || 0,
      entregados: pedidosStats.find((p) => p.estado_pedido === 'entregado')?._count || 0,
      cancelados: pedidosStats.find((p) => p.estado_pedido === 'cancelado')?._count || 0,
      fallidos: pedidosStats.find((p) => p.estado_pedido === 'fallido')?._count || 0,
      enTransito: pedidosStats.find((p) => p.estado_pedido === 'en_transito')?._count || 0,
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

  async getTopPerformersForRange(start: Date, end: Date) {
    const detalles = await this.prisma.detalles_ruta.findMany({
      where: {
        pedidos: {
          created_at: { gte: start, lte: end },
          estado_pedido: 'entregado',
        },
      },
      include: {
        rutas: { include: { choferes: true, vehiculos: true } },
        pedidos: true,
      },
    });

    const choferCounts: Record<string, { name: string; count: number }> = {};
    const unitCounts: Record<string, { placas: string; count: number }> = {};

    detalles.forEach((d) => {
      const ruta = d.rutas;
      if (ruta?.choferes) {
        const id = ruta.choferes.id;
        choferCounts[id] = choferCounts[id] || { name: ruta.choferes.nombre, count: 0 };
        choferCounts[id].count++;
      }

      if (ruta?.vehiculos) {
        const id = ruta.vehiculos.id;
        unitCounts[id] = unitCounts[id] || { placas: ruta.vehiculos.placas, count: 0 };
        unitCounts[id].count++;
      }
    });

    const incidencias = await this.prisma.incidencias.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { categoria: true },
    });

    const incCounts: Record<string, number> = {};
    incidencias.forEach((i) => {
      const key = i.categoria || 'Sin categoría';
      incCounts[key] = (incCounts[key] || 0) + 1;
    });

    const bestChoferEntry = Object.values(choferCounts).sort((a, b) => b.count - a.count)[0];
    const bestUnitEntry = Object.values(unitCounts).sort((a, b) => b.count - a.count)[0];
    const commonIssueEntry = Object.keys(incCounts).sort((a, b) => incCounts[b] - incCounts[a])[0];

    return {
      bestChofer: bestChoferEntry?.name || 'Sin datos',
      bestUnit: bestUnitEntry?.placas || 'N/A',
      commonIssue: commonIssueEntry || 'Ninguna',
    };
  }

  async getTopPerformers() { // Este método es para obtener los mejores choferes, unidades o incidencias más comunes de la semana
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const weekday = todayUtc.getUTCDay();
    const mondayOffset = (weekday + 6) % 7;
    const weekStart = new Date(todayUtc);
    weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);

    // Traemos los detalles de rutas asociados a pedidos entregados creados en la semana actual (UTC)
    const detalles = await this.prisma.detalles_ruta.findMany({
      where: {
        pedidos: {
          created_at: { gte: weekStart },
          estado_pedido: 'entregado',
        },
      },
      include: {
        rutas: { include: { choferes: true, vehiculos: true } },
        pedidos: true,
      },
    });

    const choferCounts: Record<string, { name: string; count: number }> = {};
    const unitCounts: Record<string, { placas: string; count: number }> = {};

    detalles.forEach((d) => {
      const ruta = d.rutas;
      if (ruta?.choferes) {
        const id = ruta.choferes.id;
        choferCounts[id] = choferCounts[id] || { name: ruta.choferes.nombre, count: 0 };
        choferCounts[id].count++;
      }

      if (ruta?.vehiculos) {
        const id = ruta.vehiculos.id;
        unitCounts[id] = unitCounts[id] || { placas: ruta.vehiculos.placas, count: 0 };
        unitCounts[id].count++;
      }
    });

    // Elegimos el chofer y la unidad con mayor conteo
    const bestChoferEntry = Object.values(choferCounts).sort((a, b) => b.count - a.count)[0];
    const bestUnitEntry = Object.values(unitCounts).sort((a, b) => b.count - a.count)[0];

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    // Calculamos la incidencia más frecuente en la semana actual (UTC)
    const incidencias = await this.prisma.incidencias.findMany({
      where: { created_at: { gte: weekStart, lt: weekEnd } },
      select: { categoria: true },
    });

    const incCounts: Record<string, number> = {};
    incidencias.forEach((i) => {
      const key = i.categoria || 'Sin categoría';
      incCounts[key] = (incCounts[key] || 0) + 1;
    });

    const commonIssueEntry = Object.keys(incCounts).sort((a, b) => incCounts[b] - incCounts[a])[0];

    return {
      bestChofer: bestChoferEntry?.name || 'Sin datos',
      bestUnit: bestUnitEntry?.placas || 'N/A',
      commonIssue: commonIssueEntry || 'Ninguna',
    };
  }
}
