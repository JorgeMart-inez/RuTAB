// /backend/src/modules/optimization/optimization.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { OptimizacionService } from './optimization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ClusteringRequestDto,
  PuntoPedido,
  OrdenClustersRequest,
  PublicarRutaDto,
} from './dto/optimization.dto';

/**
 * Controlador que gestiona el flujo de optimización de rutas logísticas.
 * Restringe el acceso mediante JWT y roles específicos de administración y logística.
 */
@Controller('optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OptimizacionController {
  constructor(private readonly optimizacionService: OptimizacionService) {}

  /**
   * Fase 1: Ejecuta el agrupamiento inicial de pedidos basado en su ubicación geográfica.
   * Divide la carga total en subgrupos manejables para el vehículo.
   */
  @Post('suggest-clusters')
  @Roles('superAdmin', 'logístico')
  async sugerirClusters(@Body() dto: ClusteringRequestDto) {
    return await this.optimizacionService.generarSugerenciaClusters(
      dto.vehiculoId,
      dto.fechaProgramada,
    );
  }

  /**
   * Fase 2: Calcula la secuencia óptima de entrega para un grupo específico.
   * Utiliza la API de Google para resolver el orden de paradas más eficiente.
   */
  @Post('sort-cluster')
  @Roles('superAdmin', 'logístico')
  async ordenarCluster(
    @Body()
    body: {
      pedidos: PuntoPedido[];
      inicio?: { lat: number; lng: number };
      fin?: { lat: number; lng: number };
    },
  ) {
    return await this.optimizacionService.optimizarPuntos(
      body.pedidos,
      body.inicio,
      body.fin,
    );
  }

  /**
   * Fase 3: Determina el orden lógico de visita entre los diferentes grupos creados.
   * Procesa la información localmente para evitar costos adicionales de servicios externos.
   */
  @Post('propose-clusters-order')
  @Roles('superAdmin', 'logístico')
  async proponerOrdenClusters(@Body() dto: OrdenClustersRequest) {
    return this.optimizacionService.ordenarClustersLocalmente(dto.centroides);
  }

  /**
   * Fase 4: Finaliza el proceso persistiendo el orden y las métricas en la base de datos.
   * Cambia el estado de la ruta a "programada".
   */
  @Patch('publish')
  @Roles('superAdmin', 'logístico')
  async publicar(@Body() dto: PublicarRutaDto) {
    return await this.optimizacionService.publicarRuta(dto);
  }

  /**
   * Recupera el listado de rutas que aún no han sido procesadas.
   * Permite filtrar los resultados por texto (placa/ID) o por una fecha específica.
   */
  @Get('pending-routes')
  @Roles('superAdmin', 'logístico', 'auditor')
  async obtenerRutasPendientes(
    @Query('busqueda') busqueda?: string,
    @Query('fecha') fecha?: string,
  ) {
    return await this.optimizacionService.obtenerRutasPendientes(
      busqueda,
      fecha,
    );
  }
}
