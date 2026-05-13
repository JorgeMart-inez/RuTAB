import { GeneratedReport } from '../types/report';

interface Props {
  history: GeneratedReport[];
  onDownload: (url: string) => void;
}

export const ReportHistoryTable = ({ history, onDownload }: Props) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <th className="p-4 font-semibold">Reporte</th>
            <th className="p-4 font-semibold">Periodo Analizado</th>
            <th className="p-4 font-semibold">Fecha de Creación</th>
            <th className="p-4 font-semibold text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {history.map((report) => (
            <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="p-4">
                <p className="font-medium text-slate-800">{report.title}</p>
                <p className="text-xs text-slate-400">ID: {report.id.substring(0, 8)}</p>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                  {/* r.type es el mapeado, r.periods es el crudo de la DB */}
                  {report.type || (report as any).periods || 'N/A'}
                </span>
              </td>
              <td className="p-4 text-slate-600 text-sm">
                {/* Verificamos si existe alguna de las dos variantes antes de crear la fecha */}
                {report.createdAt || (report as any).createdat
                  ? new Date(report.createdAt || (report as any).createdat).toLocaleString()
                  : 'Fecha no disponible'}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onDownload(report.fileUrl)}
                  className="text-amber-600 hover:text-amber-700 font-bold text-sm"
                >
                  Descargar PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};