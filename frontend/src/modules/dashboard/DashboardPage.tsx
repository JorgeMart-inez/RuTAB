import React from 'react';
import { useDashboard } from './hooks/useDashboard';
import { StatsGrid } from './components/StatsGrid';
import { ActiveOperationTable } from './components/ActiveOperationTable';
import { IncidentMonitor } from './components/IncidentMonitor';
import { DailyOrdersCard } from './components/DailyOrdersCard';
import { FileText, Table } from 'lucide-react';
import { exportDashboardCSV, exportDashboardPDF } from './services/dashboardService';
import { WeeklyPerformance } from './components/WeeklyPerformance';
import { MiniStats } from './components/MiniStats';

export const DashboardPage: React.FC = () => {
  const { stats, operations, isLoading, weeklyData } = useDashboard();

  if (isLoading) return <div>Cargando centro de mando...</div>;

  return (
    <div className="p-10 bg-slate-50 min-h-screen">

      <header className="flex justify-between items-end mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Centro de Mando</h1>
          <p className="text-gray-400 text-lg">Monitoreo de operación logística en tiempo real</p>
        </div>

        <div className="flex gap-3">
          {/* Botón para exportar PDF */}
          <button
            onClick={exportDashboardPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={16} className="text-red-500" />
            Exportar PDF
          </button>
          {/* Botón para exportar CSV */}
          <button
            onClick={() => exportDashboardCSV(stats)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Table size={16} className="text-green-600" />
            CSV
          </button>
        </div>
      </header>

      {/* Fila de Estadísticas (KPIs) */}
      <StatsGrid stats={stats} />

      <div className="mt-8">
        <IncidentMonitor data={stats?.monitorIncidencias} />
        <br></br>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* COLUMNA IZQUIERDA: Operación Activa */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100/50 border border-gray-50 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-950 uppercase tracking-tighter">Operación Activa</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
              {operations.length} Unidades en calle
            </span>
          </div>
          {/* Asegúrate de que la tabla no tenga un ancho fijo que rompa el grid */}
          <div className="flex-1">
            <ActiveOperationTable operations={operations} />
          </div>
        </div>

        {/* COLUMNA DERECHA: Pedidos del Día */}
        <div className="flex flex-col">
          <DailyOrdersCard pedidos={stats?.pedidos.enRuta} />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        {/* Gráfica Semanal - Ocupa 3/4 del espacio */}
        <div className="lg:col-span-3">
          <WeeklyPerformance data={weeklyData} />
        </div>

        {/* Mini KPIs - Ocupa 1/4 del espacio */}
        <div className="lg:col-span-1">
          <MiniStats stats={stats} />
        </div>
      </div>

    </div>
  );
};