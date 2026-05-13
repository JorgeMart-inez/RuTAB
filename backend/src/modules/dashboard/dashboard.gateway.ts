// src/modules/dashboard/dashboard.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { forwardRef, Inject } from '@nestjs/common';
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // Puerto del frontend
    methods: ['GET', 'POST'],
    credentials: true,
    transport: ['websocket'],
  },
  namespace: 'dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;


  constructor(
    @Inject(forwardRef(() => DashboardService)) private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService
  ) { }

  @SubscribeMessage('getInitialData')
  async handleInitialData(client: Socket) {
    const [stats, operacion, weekly, topData] = await Promise.all([
      this.dashboardService.getDailyStats(),
      this.dashboardService.getActiveOperations(),
      this.dashboardService.getWeeklyStats(),
      this.dashboardService.getTopPerformers(),
    ]);

    client.emit('dashboard:initialData', {
      stats,
      operacion,
      weekly,
      topData,
    });

    await this.emitDashboardUpdate();
  }

  // Cuando un administrador se conecta, le enviamos la carga inicial
  async handleConnection(client: Socket) {
    console.log(`Admin conectado al Dashboard: ${client.id}`);
    await this.emitDashboardUpdate();
  }

  handleDisconnect(client: Socket) {
    console.log(`Admin desconectado: ${client.id}`);
  }

  /**
   * Método centralizado para emitir actualizaciones.
   * Se llama cada vez que algo cambia en la base de datos (pedidos, rutas, incidencias).
   */
  async emitDashboardUpdate() {
    const incidencias = await this.prisma.incidencias.findMany({
      where: {
        rutas: {
          estatus_ruta: 'en_proceso',
        },
      },
      include: {
        rutas: {
          include: {
            vehiculos: true,
            administradores: true,
            choferes: true,
          }
        }
      }
    });

    const [stats, operacion, weekly, topData] = await Promise.all([
      this.dashboardService.getDailyStats(),
      this.dashboardService.getActiveOperations(),
      this.dashboardService.getWeeklyStats(),
      this.dashboardService.getTopPerformers(),
    ]);

    this.server.emit('dashboard:update', {
      stats: {
        urgentes: incidencias.filter(i => i.estado_incidencia === 'urgente').length,
        fallidos: incidencias.filter(i => i.categoria === 'entrega' || i.categoria === 'tiempo').length,
        alertasCriticas: incidencias.filter(i => i.categoria === 'camino').length,
        ...stats,
      },
      operacion,
      weekly,
      topData,
      rawIncidencias: incidencias, // Enviamos las incidencias sin procesar para que el frontend las clasifique
      timestamp: new Date(),
    });
  }

  async emitUpdate() {
    const incidencias = await this.prisma.incidencias.findMany({
      where: {
        rutas: {
          estatus_ruta: 'en_proceso',
        },
      },
      include: {
        rutas: {
          include: {
            vehiculos: true,
            administradores: true,
            choferes: true,
          }
        }
      }
    });

    const stats = {
      urgentes: incidencias.filter(i => i.estado_incidencia === 'urgente').length,
      fallidos: incidencias.filter(i => i.categoria === 'entrega' || i.categoria === 'tiempo').length,
      alertasCriticas: incidencias.filter(i => i.categoria === 'camino').length,
      ...(await this.dashboardService.getDailyStats()),
    };

    const [operacion, weekly, topData] = await Promise.all([
      this.dashboardService.getActiveOperations(),
      this.dashboardService.getWeeklyStats(),
      this.dashboardService.getTopPerformers()
    ]);

    this.server.emit('dashboard:update', {
      stats,
      operacion,
      weekly,
      topData,
      rawIncidencias: incidencias,
      timestamp: new Date(),
    });
  }
}