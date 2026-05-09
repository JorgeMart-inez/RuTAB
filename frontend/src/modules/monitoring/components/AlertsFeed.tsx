// monitoring/src/components/AlertsFeed.tsx
import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatToLocalDateTime } from '../../../utils/dateHelpers';

interface Props {
    incidencias: any[];
}

export const AlertsFeed: React.FC<Props> = ({ incidencias }) => {

    // Normalizamos para evitar errores de mayúsculas/minúsculas
    const urgentes = incidencias.filter(i => {
        const cat = i.categoria?.toLowerCase();
        const est = i.estado_incidencia?.toLowerCase();
        // Si es de 'camino' SIEMPRE es urgente para nosotros en monitoreo
        return cat === 'camino' || est === 'urgente';
    });

    const abiertas = incidencias.filter(i => {
        const cat = i.categoria?.toLowerCase();
        const est = i.estado_incidencia?.toLowerCase();
        // Incidencias de entrega/tiempo que siguen abiertas
        return est === 'abierta' && cat !== 'camino';
    });

    const resueltas = incidencias.filter(i => i.estado_incidencia?.toLowerCase() === 'resuelta');

    const CardIncidencia = ({ item, colorClass }: { item: any, colorClass: string }) => (
        <div className={`mb-3 p-3 rounded-lg border-l-4 bg-white shadow-sm ${colorClass}`}>
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100">
                    {item.categoria}
                </span>
                
                <span className="text-[10px] text-slate-400">
                    {formatToLocalDateTime(item.created_at)}
                </span>
            </div>
            <p className="text-sm font-bold text-slate-800">{item.tipo}</p>
            <p className="text-xs text-slate-600 line-clamp-2">{item.descripcion}</p>
            <div className="mt-2 text-[10px] text-slate-400 font-medium italic">
                Unidad: {item.rutas?.vehiculos?.placas || 'S/P'}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">

            {/* SECCIÓN URGENTE (ROJO) */}
            <section>
                <div className="flex items-center gap-2 mb-3 text-red-600">
                    <AlertCircle size={18} />
                    <h2 className="text-xs font-black uppercase tracking-wider">Atención Inmediata ({urgentes.length})</h2>
                </div>
                {urgentes.length === 0 && <p className="text-xs text-slate-400 italic ml-7">Sin alertas críticas</p>}
                {urgentes.map(i => <CardIncidencia key={i.id} item={i} colorClass="border-red-500" />)}
            </section>

            {/* SECCIÓN ABIERTAS (NARANJA) */}
            <section>
                <div className="flex items-center gap-2 mb-3 text-amber-500">
                    <Clock size={18} />
                    <h2 className="text-xs font-black uppercase tracking-wider">Pendientes de Gestión ({abiertas.length})</h2>
                </div>
                {abiertas.map(i => <CardIncidencia key={i.id} item={i} colorClass="border-amber-400" />)}
            </section>

            {/* SECCIÓN RESUELTAS (VERDE) */}
            <section>
                <div className="flex items-center gap-2 mb-3 text-emerald-500">
                    <CheckCircle2 size={18} />
                    <h2 className="text-xs font-black uppercase tracking-wider">Historial Reciente</h2>
                </div>
                {resueltas.map(i => <CardIncidencia key={i.id} item={i} colorClass="border-emerald-400 opacity-75" />)}
            </section>

        </div>
    );
};