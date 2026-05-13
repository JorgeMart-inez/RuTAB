// src/modules/dashboard/dashboard.controller.ts
import { Controller, Get, Res, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Response } from 'express';
import { ReportService } from './report.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly reportService: ReportService
  ) { }

  @Get('stats')
  async getStats() {
    return await this.dashboardService.getDailyStats();
  }

  @Get('operacion-activa')
  async getActiveOperation() {
    return await this.dashboardService.getActiveOperations();
  }

  @Get('export/pdf')
  async exportPDF(@Res() res: Response) {
    try {
      // Definimos los headers para que el navegador sepa que es un PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=reporte_rutab.pdf',
      });

      await this.reportService.generateDailyPDF(res);
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).send('Error interno al generar el reporte');
    }
  }
}