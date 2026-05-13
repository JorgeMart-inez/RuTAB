// src/modules/reports/reports.controller.ts
import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Response } from 'express';

@Controller('auditoria/reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post('generate')
    async generate(@Body() dto: CreateReportDto, @Res() res: Response) {
        // Configuramos las cabeceras para que el navegador sepa que es un PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_rutab.pdf`);

        return this.reportsService.orchestrateReport(dto, res);
    }

    @Get('history')
    async getHistory(@Query() filters: any) {
        return this.reportsService.getHistory(filters);
    }
}