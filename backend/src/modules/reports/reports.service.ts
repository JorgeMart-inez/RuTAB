// src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { startOfMonth, endOfMonth, subWeeks, startOfWeek, endOfWeek, endOfDay } from 'date-fns';
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
        const dailyRange: Array<{ fecha: string; nombreDia: string }> = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            dailyRange.push({
                fecha: currentDate.toISOString().split('T')[0],
                nombreDia: currentDate.toLocaleDateString('es-MX', { weekday: 'short' }),
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const pedidosResult = await this.prisma.$queryRaw`
            SELECT
                date(created_at) AS fecha,
                count(*) FILTER (WHERE lower(estado_pedido) = 'entregado') AS "entregados",
                count(*) FILTER (WHERE lower(estado_pedido) IN ('fallido', 'cancelado')) AS "fallidos"
            FROM pedidos
            WHERE created_at BETWEEN ${start} AND ${end}
            GROUP BY 1
            ORDER BY 1 ASC
        `;

        const incidenciasResult = await this.prisma.$queryRaw`
            SELECT
                date(created_at) as fecha,
                count(*) as "incidencias"
            FROM incidencias
            WHERE created_at BETWEEN ${start} AND ${end}
            GROUP BY 1
            ORDER BY 1 ASC
        `;

        const pedidosMap = (pedidosResult as any[]).reduce((acc, item) => {
            const fechaKey = item.fecha instanceof Date ? item.fecha.toISOString().split('T')[0] : item.fecha;
            acc[fechaKey] = item;
            return acc;
        }, {} as Record<string, any>);

        const incidenciasMap = (incidenciasResult as any[]).reduce((acc, item) => {
            const fechaKey = item.fecha instanceof Date ? item.fecha.toISOString().split('T')[0] : item.fecha;
            acc[fechaKey] = Number(item.incidencias || 0);
            return acc;
        }, {} as Record<string, number>);

        return dailyRange.map((day) => {
            const raw = pedidosMap[day.fecha] || {};
            return {
                fecha: day.fecha,
                nombreDia: day.nombreDia,
                entregados: Number(raw.entregados || 0),
                fallidos: Number(raw.fallidos || 0),
                incidencias: incidenciasMap[day.fecha] || 0,
            };
        });
    }

    private calculateRange(period: string, start?: string, end?: string) {
        const now = new Date();
        switch (period) {
            case 'last-week':
                const lw = subWeeks(now, 1);
                return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
            case 'this-week':
                return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
            case 'two-weeks':
                return { start: subWeeks(now, 2), end: now };
            case 'this-month':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'custom':
                return { start: new Date(start!), end: endOfDay(new Date(end!)) };
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