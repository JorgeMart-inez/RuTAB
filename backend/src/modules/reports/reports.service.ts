// src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { startOfMonth, endOfMonth, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ReportService as PdfService } from '../dashboard/report.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private pdfGenerator: PdfService
    ) { }

    public async orchestrateReport(dto: any, res: any) { // Añadimos 'res' para el stream del PDF
        const { start, end } = this.calculateRange(dto.period, dto.startDate, dto.endDate);
        const reportName = `report_${Date.now()}.pdf`;
        const folderPath = path.join(process.cwd(), 'uploads', 'reports');

        // Asegurar que la carpeta existe
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const filePath = path.join(folderPath, reportName);

        // Obtener datos de RuTAB
        const reportData = await this.getDataForReport(start, end);

        // Generar el PDF directamente al stream de respuesta
        await this.pdfGenerator.generateReportPDF(res, reportData, start, end);

        // Guardar en la tabla de auditoría 
        return this.prisma.reportes.create({
            data: {
                title: dto.title || `Reporte RuTAB - ${dto.period}`,
                periods: dto.period.toUpperCase(),
                startdate: start,
                enddate: end,
                fileurl: `uploads/reports/${reportName}`,
                createdbyid: 'sistema_admin'
            }
        });
    }

    private async getDataForReport(start: Date, end: Date) {
        const result = await this.prisma.$queryRaw`
            SELECT 
                to_char(created_at, 'Dy') as "nombreDia",
                date(created_at) as "fecha",
                count(*) filter (where estado_pedido = 'ENTREGADO') as "entregados",
                count(*) filter (where estado_pedido = 'FALLIDO') as "fallidos"
            FROM pedidos
            WHERE created_at BETWEEN ${start} AND ${end}
            GROUP BY 1, 2
            ORDER BY 2 ASC
        `;
        return (result as any[]) || [];
    }

    private calculateRange(period: string, start?: string, end?: string) {
        const now = new Date();
        switch (period) {
            case 'last-week':
                const lw = subWeeks(now, 1);
                return { start: startOfWeek(lw), end: endOfWeek(lw) };
            case 'two-weeks':
                return { start: subWeeks(now, 2), end: now };
            case 'this-month':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'custom':
                return { start: new Date(start!), end: new Date(end!) };
            default:
                return { start: now, end: now };
        }
    }

    async getHistory(filters: any) {
        const reports = await this.prisma.reportes.findMany({
            orderBy: { createdat: 'desc' },
            where: filters
        });

        // Mapeamos aquí para que el Frontend reciba cammelCase
        return reports.map(r => ({
            id: r.id,
            title: r.title,
            type: r.periods,      // Convertimos 'periods' a 'type'
            createdAt: r.createdat, // Convertimos 'createdat' a 'createdAt'
            fileUrl: r.fileurl,
            startDate: r.startdate,
            endDate: r.enddate
        }));
    }
}