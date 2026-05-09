// src/modules/dashboard/components/DailyOrdersCard.tsx
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';

export const DailyOrdersCard = ({ pedidos }: any) => {
  const { totales = 0, entregados = 0, enRuta = 0, fallidos = 0 } = pedidos || {};
  
  // Cálculo de porcentajes para la barra segmentada
  const pEntregados = totales > 0 ? (entregados / totales) * 100 : 0;
  const pEnRuta = totales > 0 ? (enRuta / totales) * 100 : 0;
  const pFallidos = totales > 0 ? (fallidos / totales) * 100 : 0;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100/50 border border-gray-50 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="text-blue-600" size={24} />
          <h2 className="text-xl font-black text-gray-950 uppercase tracking-tighter">Pedidos del Día</h2>
        </div>
        <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-black">
          TOTAL: {totales}
        </span>
      </div>

      {/* Barra de Progreso Multi-color */}
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-8">
        <div style={{ width: `${pEntregados}%` }} className="bg-green-500 transition-all duration-500" />
        <div style={{ width: `${pEnRuta}%` }} className="bg-blue-500 transition-all duration-500" />
        <div style={{ width: `${pFallidos}%` }} className="bg-red-500 transition-all duration-500" />
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <MetricBox label="Entregados" value={entregados} color="text-green-600" icon={<CheckCircle size={14}/>} />
        <MetricBox label="En Ruta" value={enRuta} color="text-blue-600" icon={<Clock size={14}/>} />
        <MetricBox label="Fallidos" value={fallidos} color="text-red-600" icon={<XCircle size={14}/>} />
        <div className="flex flex-col p-4 bg-slate-50 rounded-2xl justify-center items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase">Eficiencia</p>
            <p className="text-2xl font-black text-gray-950">{Math.round(pEntregados)}%</p>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color, icon }: any) => (
  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
    <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-2xl font-black text-gray-950">{value}</p>
  </div>
);