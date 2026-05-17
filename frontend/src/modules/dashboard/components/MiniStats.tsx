// src/modules/dashboard/components/MiniStats.tsx
import { Trophy, Truck, AlertTriangle } from 'lucide-react';

export const MiniStats = ({ topData }: any) => {
  const items = [
    {
      label: 'MVP de la Semana',
      value: topData?.bestChofer || 'S/C',
      icon: <Trophy size={16} className="text-yellow-600" />,
      color: 'bg-yellow-50',
      detail: 'Chofer con más entregas'
    },
    {
      label: 'Unidad de Carga',
      value: topData?.bestUnit || 'S/N',
      icon: <Truck size={16} className="text-blue-600" />,
      color: 'bg-blue-50',
      detail: 'Mayor volumen semanal'
    },
    {
      label: 'Alerta Crítica',
      value: topData?.commonIssue || 'N/A',
      icon: <AlertTriangle size={16} className="text-red-600" />,
      color: 'bg-red-50',
      detail: 'Incidencia más frecuente'
    }
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 flex-1">
          <div className={`p-4 rounded-2xl ${item.color}`}>
            {item.icon}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-sm font-black text-gray-950 truncate max-w-[150px]">{item.value}</p>
            <p className="text-[9px] text-gray-500 font-medium">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
};