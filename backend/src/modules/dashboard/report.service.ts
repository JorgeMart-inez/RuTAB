// backend/src/modules/dashboard/report.service.ts
import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { DashboardService } from './dashboard.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
    constructor(private dashboardService: DashboardService) { }

    async generateDailyPDF(res: any, customData?: { stats?: any, topData?: any, weekly?: any }) {
        const [stats, topData, weekly] = customData ? [
            customData.stats || await this.dashboardService.getDailyStats(),
            customData.topData || await this.dashboardService.getTopPerformers(),
            customData.weekly || await this.dashboardService.getWeeklyStats()
        ] : await Promise.all([
            this.dashboardService.getDailyStats(),
            this.dashboardService.getTopPerformers(),
            this.dashboardService.getWeeklyStats()
        ]);

        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        doc.pipe(res);

        // --- 1. CARGA DEL LOGO DESDE ARCHIVO LOCAL ---
        const logoPaths = [
            path.resolve(process.cwd(), '..', 'frontend', 'src', 'assets', 'logo_admin_layout.png'),
            path.resolve(__dirname, '../../../../frontend/src/assets/logo_admin_layout.png'),
            path.resolve(__dirname, '../../../../../frontend/src/assets/logo_admin_layout.png'),
        ];

        const logoPath = logoPaths.find((filePath) => fs.existsSync(filePath));
        if (logoPath) {
            try {
                const logoBuffer = await fs.promises.readFile(logoPath);
                doc.image(logoBuffer, 40, 40, { width: 50 });
            } catch (error) {
                console.error('No se pudo cargar el logo localmente', error);
            }
        } else {
            console.warn('Logo no encontrado en las rutas esperadas:', logoPaths);
        }

        const headerTop = 40;
        doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text('RuTAB', 100, headerTop);
        doc.fontSize(10).fillColor('#64748b').font('Helvetica').text('LOGÍSTICA Y MONITOREO EN TIEMPO REAL', 100, headerTop + 25);

        doc.fillColor('#0f172a').fontSize(8);
        doc.text(`ID Reporte: ${Date.now()}`, 400, headerTop, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 400, headerTop + 12, { align: 'right' });
        
        // Línea divisoria sutil
        doc.moveTo(80, headerTop + 50).lineTo(550, headerTop + 50).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // --- 3. KPIs COMPACTOS ---
        const kpiY = 100;
        const cardWidth = 160;

        [0, 1, 2].forEach(i => {
            const x = 40 + (i * (cardWidth + 15));
            doc.rect(x, kpiY, cardWidth, 40).fill('#f8fafc');
            const colors = ['#eab308', '#3b82f6', '#ef4444'];
            doc.rect(x, kpiY, 2, 40).fill(colors[i]);
        });

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold');
        doc.text('MVP CHOFER', 50, kpiY + 8);
        doc.text('UNIDAD LÍDER', 225, kpiY + 8);
        doc.text('ALERTA FRECUENTE', 400, kpiY + 8);

        doc.fillColor('#0f172a').fontSize(9);
        doc.text(topData?.bestChofer || 'Sin actividad', 50, kpiY + 20, { width: cardWidth - 20 });
        doc.text(topData?.bestUnit || 'N/A', 225, kpiY + 20);
        doc.text(topData?.commonIssue || 'Ninguna', 400, kpiY + 20, { width: cardWidth - 20 });

        // --- 4. TABLA DE OPERACIONES (Subida para ahorrar espacio) ---
        const tableTop = 160;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Detalle de Operaciones por Día', 40, tableTop);
        
        const tableHeadY = tableTop + 20;
        doc.rect(40, tableHeadY, 515, 20).fill('#0f172a');

        doc.fillColor('#ffffff').fontSize(8).text('Día', 55, tableHeadY + 6);
        doc.text('Fecha', 140, tableHeadY + 6);
        doc.text('Entregas', 320, tableHeadY + 6);
        doc.text('Incidencias', 450, tableHeadY + 6);

        let currentY = tableHeadY + 20;
        weekly.forEach((day: any, i: number) => {
            if (i % 2 !== 0) doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
            doc.fillColor('#334155').fontSize(8);
            doc.text(day.nombreDia, 55, currentY + 6);
            doc.text(day.fecha, 140, currentY + 6);
            doc.text(day.entregados?.toString() || '0', 335, currentY + 6);
            doc.text(day.fallidos?.toString() || '0', 475, currentY + 6);
            currentY += 20;
        });

        // --- 5. GRÁFICA DE BARRAS GENERADA EN EL BACKEND ---
        const chartTitleY = currentY + 20;
        if (chartTitleY + 220 > 750) doc.addPage();

        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Rendimiento Semanal', 40, chartTitleY);

        const chartX = 40;
        const chartY = chartTitleY + 35;
        const chartWidth = 515;
        const chartHeight = 150;
        const maxValue = Math.max(...weekly.map((day: any) => (day.entregados || 0) + (day.fallidos || 0)), 1);
        const groupWidth = Math.min(45, chartWidth / weekly.length - 8);
        const barWidth = Math.min(16, (groupWidth - 4) / 2);

        doc.strokeColor('#cbd5e1').lineWidth(0.5);
        const horizontalLines = 4;
        for (let i = 0; i <= horizontalLines; i++) {
            const y = chartY + (chartHeight / horizontalLines) * i;
            doc.moveTo(chartX, y).lineTo(chartX + chartWidth, y).stroke();
            const valueLabel = Math.round(maxValue - (maxValue / horizontalLines) * i);
            doc.fillColor('#475569').fontSize(8).text(valueLabel.toString(), chartX - 28, y - 5, { width: 24, align: 'right' });
        }

        weekly.forEach((day: any, index: number) => {
            const baseX = chartX + index * (chartWidth / weekly.length) + ((chartWidth / weekly.length) - groupWidth) / 2;
            const entregadosHeight = Math.round(((day.entregados || 0) / maxValue) * chartHeight);
            const fallidosHeight = Math.round(((day.fallidos || 0) / maxValue) * chartHeight);

            doc.fillColor('#22c55e').rect(baseX, chartY + chartHeight - entregadosHeight, barWidth, entregadosHeight).fill();
            doc.fillColor('#ef4444').rect(baseX + barWidth + 4, chartY + chartHeight - fallidosHeight, barWidth, fallidosHeight).fill();

            doc.fillColor('#475569').fontSize(7).text(day.nombreDia.toUpperCase(), baseX - 4, chartY + chartHeight + 8, { width: groupWidth + 8, align: 'center' });
        });

        doc.fillColor('#475569').fontSize(8).text('Entregados', chartX + chartWidth - 140, chartY + chartHeight + 40);
        doc.fillColor('#22c55e').rect(chartX + chartWidth - 70, chartY + chartHeight + 42, 8, 8).fill();
        doc.fillColor('#475569').text('   Fallidos', chartX + chartWidth - 55, chartY + chartHeight + 40);
        doc.fillColor('#ef4444').rect(chartX + chartWidth - 25, chartY + chartHeight + 42, 8, 8).fill();

        doc.end();
    }

    async generateReportPDF(res: any, reportData: any[], start: Date, end: Date) {
        const stats = await this.dashboardService.getStatsForRange(start, end);
        const topData = await this.dashboardService.getTopPerformersForRange(start, end);
        const weekly = reportData;

        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        doc.pipe(res);

        // --- 1. CARGA DEL LOGO DESDE ARCHIVO LOCAL ---
        const logoPaths = [
            path.resolve(process.cwd(), '..', 'frontend', 'src', 'assets', 'logo_admin_layout.png'),
            path.resolve(__dirname, '../../../../frontend/src/assets/logo_admin_layout.png'),
            path.resolve(__dirname, '../../../../../frontend/src/assets/logo_admin_layout.png'),
        ];

        const logoPath = logoPaths.find((filePath) => fs.existsSync(filePath));
        if (logoPath) {
            try {
                const logoBuffer = await fs.promises.readFile(logoPath);
                doc.image(logoBuffer, 40, 40, { width: 50 });
            } catch (error) {
                console.error('No se pudo cargar el logo localmente', error);
            }
        } else {
            console.warn('Logo no encontrado en las rutas esperadas:', logoPaths);
        }

        const headerTop = 40;
        doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text('RuTAB', 100, headerTop);
        doc.fontSize(10).fillColor('#64748b').font('Helvetica').text('LOGÍSTICA Y MONITOREO EN TIEMPO REAL', 100, headerTop + 25);

        doc.fillColor('#0f172a').fontSize(8);
        doc.text(`ID Reporte: ${Date.now()}`, 400, headerTop, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 400, headerTop + 12, { align: 'right' });
        doc.text(`Periodo: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 400, headerTop + 24, { align: 'right' });
        
        // Línea divisoria sutil
        doc.moveTo(80, headerTop + 50).lineTo(550, headerTop + 50).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // --- 3. KPIs COMPACTOS ---
        const kpiY = 100;
        const cardWidth = 160;

        [0, 1, 2].forEach(i => {
            const x = 40 + (i * (cardWidth + 15));
            doc.rect(x, kpiY, cardWidth, 40).fill('#f8fafc');
            const colors = ['#eab308', '#3b82f6', '#ef4444'];
            doc.rect(x, kpiY, 2, 40).fill(colors[i]);
        });

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold');
        doc.text('MVP CHOFER', 50, kpiY + 8);
        doc.text('UNIDAD LÍDER', 225, kpiY + 8);
        doc.text('ALERTA FRECUENTE', 400, kpiY + 8);

        doc.fillColor('#0f172a').fontSize(9);
        doc.text(topData?.bestChofer || 'Sin actividad', 50, kpiY + 20, { width: cardWidth - 20 });
        doc.text(topData?.bestUnit || 'N/A', 225, kpiY + 20);
        doc.text(topData?.commonIssue || 'Ninguna', 400, kpiY + 20, { width: cardWidth - 20 });

        const totalEntregados = weekly.reduce((sum: number, day: any) => sum + (day.entregados || 0), 0);
        const totalFallidos = weekly.reduce((sum: number, day: any) => sum + (day.fallidos || 0), 0);
        const totalIncidencias = weekly.reduce((sum: number, day: any) => sum + (day.incidencias || 0), 0);

        const summaryY = 150;
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Resumen del periodo', 40, summaryY);
        doc.fillColor('#475569').fontSize(9);
        doc.text(`Entregados: ${totalEntregados}`, 40, summaryY + 16, { width: 160 });
        doc.text(`Fallidos: ${totalFallidos}`, 220, summaryY + 16, { width: 160 });
        doc.text(`Incidencias: ${totalIncidencias}`, 400, summaryY + 16, { width: 160 });
        doc.text(`Pedidos totales: ${stats.pedidos.totales}`, 40, summaryY + 34, { width: 220 });
        doc.text(`Unidades en ruta: ${stats.rutasActivas}`, 260, summaryY + 34, { width: 220 });

        // --- 4. TABLA DE OPERACIONES (Subida para ahorrar espacio) ---
        const tableTop = summaryY + 80;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Detalle de Operaciones por Día', 40, tableTop);
        
        const tableHeadY = tableTop + 20;
        doc.rect(40, tableHeadY, 515, 20).fill('#0f172a');

        doc.fillColor('#ffffff').fontSize(8).text('Día', 50, tableHeadY + 6);
        doc.text('Fecha', 120, tableHeadY + 6);
        doc.text('Entregas', 260, tableHeadY + 6);
        doc.text('Fallidos', 350, tableHeadY + 6);
        doc.text('Incidencias', 440, tableHeadY + 6);

        let currentY = tableHeadY + 20;
        weekly.forEach((day: any, i: number) => {
            if (i % 2 !== 0) doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
            doc.fillColor('#334155').fontSize(8);
            doc.text(day.nombreDia, 50, currentY + 6);
            doc.text(day.fecha, 120, currentY + 6);
            doc.text((day.entregados || 0).toString(), 280, currentY + 6);
            doc.text((day.fallidos || 0).toString(), 365, currentY + 6);
            doc.text((day.incidencias || 0).toString(), 450, currentY + 6);
            currentY += 20;
        });

        // --- 5. GRÁFICA DE BARRAS GENERADA EN EL BACKEND ---
        const chartTitleY = currentY + 20;
        if (chartTitleY + 220 > 750) {
            doc.addPage();
        }

        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Rendimiento Semanal', 40, chartTitleY);

        const chartX = 40;
        const chartY = chartTitleY + 35;
        const chartWidth = 515;
        const chartHeight = 150;
        const maxValue = Math.max(...weekly.map((day: any) => Math.max(day.entregados || 0, day.fallidos || 0)), 1);
        const tickCount = 4;
        const tickStep = Math.max(1, Math.ceil(maxValue / tickCount));
        const chartMax = tickStep * tickCount;
        const groupWidth = Math.min(50, chartWidth / Math.max(1, weekly.length) - 8);
        const barWidth = Math.min(18, (groupWidth - 4) / 2);

        doc.strokeColor('#cbd5e1').lineWidth(0.5);
        for (let i = 0; i <= tickCount; i++) {
            const y = chartY + (chartHeight / tickCount) * i;
            doc.moveTo(chartX, y).lineTo(chartX + chartWidth, y).stroke();
            const valueLabel = chartMax - tickStep * i;
            doc.fillColor('#475569').fontSize(8).text(valueLabel.toString(), chartX - 28, y - 5, { width: 24, align: 'right' });
        }

        weekly.forEach((day: any, index: number) => {
            const sectionWidth = chartWidth / Math.max(1, weekly.length);
            const baseX = chartX + index * sectionWidth + (sectionWidth - groupWidth) / 2;
            const entregadosHeight = Math.round(((day.entregados || 0) / chartMax) * chartHeight);
            const fallidosHeight = Math.round(((day.fallidos || 0) / chartMax) * chartHeight);

            doc.fillColor('#22c55e').rect(baseX, chartY + chartHeight - entregadosHeight, barWidth, entregadosHeight).fill();
            doc.fillColor('#ef4444').rect(baseX + barWidth + 4, chartY + chartHeight - fallidosHeight, barWidth, fallidosHeight).fill();

            doc.fillColor('#475569').fontSize(7).text(day.nombreDia.toUpperCase(), baseX - 4, chartY + chartHeight + 8, { width: groupWidth + 8, align: 'center' });
        });

        doc.fillColor('#475569').fontSize(8).text('Entregados', chartX + chartWidth - 140, chartY + chartHeight + 40);
        doc.fillColor('#22c55e').rect(chartX + chartWidth - 70, chartY + chartHeight + 42, 8, 8).fill();
        doc.fillColor('#475569').text('   Fallidos', chartX + chartWidth - 55, chartY + chartHeight + 40);
        doc.fillColor('#ef4444').rect(chartX + chartWidth - 25, chartY + chartHeight + 42, 8, 8).fill();

        doc.end();
    }
}
