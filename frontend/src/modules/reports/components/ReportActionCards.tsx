// src/components/reports/ReportActionCards.tsx
import { ReportPeriod } from '../types/report';

interface Props {
  onGenerate: (period: ReportPeriod) => void;
}

export const ReportActionCards = ({ onGenerate }: Props) => {
  const cards = [
    {
      id: 'last-week' as ReportPeriod,
      title: 'Semana Pasada',
      description: 'Análisis completo del lunes al domingo anterior.',
      color: 'border-amber-500',
      bgColor: 'hover:bg-amber-50',
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8M8 11h8M8 15h8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'this-week' as ReportPeriod,
      title: 'Esta Semana',
      description: 'Resumen actual de lunes a domingo con detalle diario.',
      color: 'border-emerald-500',
      bgColor: 'hover:bg-emerald-50',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      id: 'two-weeks' as ReportPeriod,
      title: 'Últimas 2 Semanas',
      description: 'Tendencias de rendimiento y logística de los últimos 14 días.',
      color: 'border-blue-500',
      bgColor: 'hover:bg-blue-50',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'this-month' as ReportPeriod,
      title: 'Mes Actual',
      description: 'Estado operativo desde el día 1 hasta la fecha de hoy.',
      color: 'border-red-500',
      bgColor: 'hover:bg-red-50',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onGenerate(card.id)}
          className={`group relative p-6 bg-white border-l-4 ${card.color} ${card.bgColor} rounded-xl shadow-sm border border-slate-200 transition-all duration-300 text-left hover:shadow-md hover:-translate-y-1`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
              {card.icon}
            </div>
            <span className="text-slate-300 group-hover:text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-1">{card.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {card.description}
          </p>
          
          <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600">
            Generar Ahora
          </div>
        </button>
      ))}

      {/* Botón para Reporte Personalizado (Opcional por ahora) */}
      <button
        onClick={() => alert("Próximamente: Selector de fechas personalizado")}
        className="md:col-span-3 p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-slate-400 hover:bg-slate-50 transition-all"
      >
        + Definir rango de fechas personalizado
      </button>
    </div>
  );
};