// /backend/src/modules/optimization/optimization.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { GoogleMapsService } from './google-maps.service';
import {
  PuntoPedido,
  PublicarRutaDto,
  DetalleRutaOrdenado,
} from './dto/optimization.dto';

@Injectable()
export class OptimizacionService {
  /** Coordenadas geográficas del centro de despacho definidas en variables de entorno */
  private readonly baseEmpresa = {
    lat: parseFloat(process.env.ORIGEN_LAT || '0'),
    lng: parseFloat(process.env.ORIGEN_LNG || '0'),
  };

  constructor(
    private prisma: PrismaService,
    private googleService: GoogleMapsService,
  ) {}

  /**
   * Recupera pedidos de una ruta específica y los agrupa geográficamente.
   * Utiliza PostGIS para extraer coordenadas directamente desde la base de datos.
   */
  async generarSugerenciaClusters(vehiculoId: string, fecha: string) {
    const pedidos = await this.prisma.$queryRaw<PuntoPedido[]>`
      SELECT 
        p.id, 
        c.nombre as cliente,
        p.codigo_rastreo as "codigoRastreo", 
        ST_Y(c.coordenadas::geometry) as lat, 
        ST_X(c.coordenadas::geometry) as lng
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      JOIN detalles_ruta dr ON p.id = dr.pedido_id
      JOIN rutas r ON dr.ruta_id = r.id
      WHERE r.vehiculo_id = ${vehiculoId}::uuid AND r.fecha_programada = ${fecha}::date
    `;

    if (pedidos.length === 0) return [];

    /** Calcula la cantidad de grupos necesarios asumiendo un máximo de 20 paradas por ruta */
    return this.ejecutarKMeans(pedidos, Math.ceil(pedidos.length / 20));
  }

  /**
   * Ordena los grupos de pedidos utilizando el algoritmo de "Vecino más cercano".
   * Calcula la secuencia lógica de visita entre centroides sin costo de API externa.
   */
  ordenarClustersLocalmente(
    centroides: { clusterId: number; lat: number; lng: number }[],
  ): number[] {
    const resultado: number[] = [];
    const pendientes = [...centroides];
    let puntoActual = { lat: this.baseEmpresa.lat, lng: this.baseEmpresa.lng };

    while (pendientes.length > 0) {
      let indiceCercano = 0;
      let distanciaMinima = Infinity;

      for (let i = 0; i < pendientes.length; i++) {
        /** Cálculo de distancia euclidiana simple para determinar proximidad */
        const d = Math.sqrt(
          Math.pow(pendientes[i].lat - puntoActual.lat, 2) +
            Math.pow(pendientes[i].lng - puntoActual.lng, 2),
        );

        if (d < distanciaMinima) {
          distanciaMinima = d;
          indiceCercano = i;
        }
      }

      const proximo = pendientes.splice(indiceCercano, 1)[0];
      resultado.push(proximo.clusterId);
      puntoActual = { lat: proximo.lat, lng: proximo.lng };
    }

    return resultado;
  }

  /**
   * Delega la optimización fina de waypoints al servicio de Google Maps.
   * Permite definir puntos de transición para encadenar múltiples grupos en una sola jornada.
   */
  async optimizarPuntos(
    puntos: PuntoPedido[],
    inicio?: { lat: number; lng: number },
    fin?: { lat: number; lng: number },
  ): Promise<DetalleRutaOrdenado> {
    return await this.googleService.obtenerOrdenOptimo(puntos, inicio, fin);
  }

  /**
   * Persiste la configuración final de la ruta optimizada.
   * Actualiza estatus, métricas totales y la secuencia exacta de cada entrega en una transacción.
   */
  async publicarRuta(dto: PublicarRutaDto) {
    return await this.prisma.$transaction(async (tx) => {
      const rutaActual = await tx.rutas.findUnique({
        where: { id: dto.rutaId },
      });

      const tiempoEstimado = new Date(rutaActual.fecha_programada);
      tiempoEstimado.setSeconds(
        tiempoEstimado.getSeconds() + dto.duracionTotalSegundos,
      );

      /** Actualiza el encabezado de la ruta con los resultados de la optimización */
      await tx.rutas.update({
        where: { id: dto.rutaId },
        data: {
          estatus_ruta: 'programada',
          distancia_total_estimada: dto.distanciaTotalMetros / 1000,
          tiempo_estimado_entrega: tiempoEstimado,
          updated_at: new Date(),
        },
      });

      /** Registra el orden de visita secuencial para cada pedido vinculado */
      for (let i = 0; i < dto.ordenFinalPedidos.length; i++) {
        await tx.detalles_ruta.updateMany({
          where: { ruta_id: dto.rutaId, pedido_id: dto.ordenFinalPedidos[i] },
          data: { orden_entrega: i + 1 },
        });
      }

      return { success: true };
    });
  }

  /**
   * Implementación del algoritmo K-Means para agrupar pedidos por densidad geográfica.
   * Ejecuta 20 iteraciones para estabilizar los centroides y equilibrar los grupos.
   */
  private ejecutarKMeans(puntos: PuntoPedido[], k: number) {
    let centroides = puntos
      .sort(() => 0.5 - Math.random())
      .slice(0, k)
      .map((p) => ({ lat: p.lat, lng: p.lng }));
    let clusters = [];

    for (let i = 0; i < 20; i++) {
      clusters = centroides.map((c, idx) => ({
        clusterId: idx,
        centroide: c,
        pedidos: [],
      }));

      puntos.forEach((p) => {
        let dMin = Infinity,
          idx = 0;
        centroides.forEach((c, cIdx) => {
          const d = Math.sqrt((p.lat - c.lat) ** 2 + (p.lng - c.lng) ** 2);
          if (d < dMin) {
            dMin = d;
            idx = cIdx;
          }
        });
        clusters[idx].pedidos.push(p);
      });

      /** Reposiciona el centroide al promedio geográfico de sus pedidos asignados */
      centroides = clusters.map((c) => {
        if (c.pedidos.length === 0) return c.centroide;
        return {
          lat: c.pedidos.reduce((a, b) => a + b.lat, 0) / c.pedidos.length,
          lng: c.pedidos.reduce((a, b) => a + b.lng, 0) / c.pedidos.length,
        };
      });
    }
    return clusters;
  }

  /**
   * Obtiene rutas en estado borrador permitiendo búsqueda por placa o ID exacto.
   * Incluye filtros opcionales de fecha y valida el formato UUID para evitar errores de BD.
   */
  async obtenerRutasPendientes(busqueda?: string, fecha?: string) {
    const where: any = {
      estatus_ruta: 'borrador',
    };

    if (fecha) {
      where.fecha_programada = new Date(fecha);
    }

    if (busqueda) {
      /** Validación estricta de UUID para prevenir fallos al consultar la columna ID */
      const esUuid =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          busqueda,
        );

      where.OR = [
        {
          vehiculos: {
            placas: { contains: busqueda, mode: 'insensitive' },
          },
        },
      ];

      if (esUuid) {
        where.OR.push({ id: busqueda });
      }
    }

    const rutasBorrador = await this.prisma.rutas.findMany({
      where,
      include: {
        vehiculos: {
          select: { placas: true, modelo: true },
        },
        _count: {
          select: { detalles_ruta: true },
        },
      },
      orderBy: {
        fecha_programada: 'asc',
      },
    });

    return rutasBorrador.map((ruta) => ({
      rutaId: ruta.id,
      vehiculoId: ruta.vehiculo_id,
      placas: ruta.vehiculos?.placas || 'Sin Placa',
      modelo: ruta.vehiculos?.modelo || 'Desconocido',
      fechaProgramada: ruta.fecha_programada
        ? ruta.fecha_programada.toISOString().split('T')[0]
        : '',
      pedidosAsignados: ruta._count.detalles_ruta,
    }));
  }
}
