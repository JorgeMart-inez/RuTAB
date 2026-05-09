// src/modules/dashboard/components/StatsGrid.tsx
import React from 'react';
import { Truck, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { DashboardStats } from '../types';

export const StatsGrid: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
      <StatCard 
        icon={<Truck size={24} />} 
        label="Rutas Activas" 
        value={stats?.rutasActivas || 0} 
        color="blue" 
      />
      <StatCard 
        icon={<Package size={24} />} 
        label="En Ruta" 
        value={stats?.pedidos.enRuta || 0} 
        subValue={`de ${stats?.pedidos.totales || 0} totales`}
        color="amber" 
      />
      <StatCard 
        icon={<CheckCircle size={24} />} 
        label="Entregas Exitosas" 
        value={stats?.pedidos.entregados || 0} 
        color="green" 
      />
      <StatCard 
        icon={<AlertTriangle size={24} />} 
        label="Incidencias" 
        value={stats?.incidenciasHoy || 0} 
        color="red" 
        isAlert={Number(stats?.incidenciasHoy) > 0}
      />
    </div>
  );
};

// Sub-componente interno para la tarjeta
const StatCard = ({ icon, label, value, subValue, color, isAlert }: any) => {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className={`bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 transition-all ${isAlert ? 'ring-2 ring-red-500 ring-offset-2 animate-pulse' : ''}`}>
      <div className={`p-4 rounded-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        {subValue && <div className="text-[10px] text-slate-400 mt-1 font-medium">{subValue}</div>}
      </div>
    </div>
  );
};