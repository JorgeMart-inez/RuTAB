import { AlertCircle, Truck, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatToLocalTime } from '../../../utils/dateHelpers';

export const IncidentMonitor = ({ data }: any) => {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'camino',
            label: 'Atención Inmediata',
            icon: <AlertCircle className="text-red-500" />,
            bg: 'bg-red-50',
            border: 'border-red-100',
            items: data?.camino || []
        },
        {
            id: 'entrega',
            label: 'Gestión de Entregas',
            icon: <Truck className="text-orange-500" />,
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            items: data?.entrega || []
        },
        {
            id: 'tiempo',
            label: 'Logística de Tiempo',
            icon: <Clock className="text-blue-500" />,
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            items: data?.tiempo || []
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {categories.map((cat) => (
                <div key={cat.id} className={`bg-white rounded-3xl p-6 shadow-sm border ${cat.border} flex flex-col h-[400px]`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${cat.bg}`}>{cat.icon}</div>
                            <h3 className="font-black text-gray-950 uppercase text-xs tracking-tighter">{cat.label}</h3>
                        </div>
                        <span className="text-2xl font-black text-gray-900">{cat.items.length}</span>
                    </div>

                    {/* Contenedor con SCROLL: Muestra todas, pero mantiene el tamaño de la card */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar">
                        {cat.items.length > 0 ? (
                            cat.items.map((item: any) => (
                                <div key={item.id} className="text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-bold text-gray-800 flex-1">{item.descripcion}</p>
                                        <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap">
                                            {formatToLocalTime(item.created_at)}
                                            
                                        </span>
                                    </div>
                                    <p className="text-blue-600 mt-2 uppercase font-black tracking-widest text-[9px]">
                                        Unidad: {item.rutas?.vehiculos?.placas || 'N/A'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-center text-gray-300 text-xs italic">Sin incidencias pendientes</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/panel/auditoria/incidencias', { state: { category: cat.id } })}
                        disabled={cat.items.length === 0}
                        className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm ${cat.items.length > 0
                                ? cat.id === 'camino' ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100' :
                                    cat.id === 'entrega' ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100' :
                                        'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-100'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {cat.items.length > 0 ? 'Gestionar Evidencias' : 'Sin Pendientes'}
                        <ExternalLink size={12} className={cat.items.length > 0 ? 'animate-pulse' : ''} />
                    </button>
                </div>
            ))}
        </div>
    );
};