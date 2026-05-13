import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports.api';
import { GeneratedReport, ReportPeriod } from '../types/report';
import { ReportActionCards } from '../components/ReportActionCards';
import { ReportHistoryTable } from '../components/ReportHistoryTable';

export const ReportPage = () => {
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await reportsApi.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error cargando historial de reportes:', error);
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async (period: ReportPeriod) => {
    setLoading(true);
    try {
      const blob = await reportsApi.generate(period, `Reporte ${period}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RuTAB_${period}_${Date.now()}.pdf`;
      a.click();
      
      // Refrescar historial tras generar
      loadHistory();
    } catch (err) {
      alert("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Auditoría de Operaciones</h1>
          <p className="text-slate-600">Genera y consulta reportes históricos de RuTAB</p>
        </header>

        {loading && <p className="text-blue-600 font-bold mb-4">Generando documento, por favor espera...</p>}

        <ReportActionCards onGenerate={handleGenerate} />
        
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <ReportHistoryTable history={history} onDownload={reportsApi.downloadExisting} />
        </div>
      </div>
    </div>
  );
};