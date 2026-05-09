// src/modules/management/evidences/components/EvidenceTable.tsx
import { FileImage, PenTool, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Evidence, EstadoEvidencia } from "../types/evidence.types";
import { formatToLocalDateTime } from "../../../../utils/dateHelpers";

interface Props {
  evidences: Evidence[];
  onReview: (evidence: Evidence) => void;
}

export const EvidenceTable = ({ evidences, onReview }: Props) => {
  const getStatusStyle = (estado: EstadoEvidencia) => {
    switch (estado) {
      case "alerta":
        return "bg-red-100 text-red-700 border-red-200";
      case "auto aprobada":
        return "bg-green-100 text-green-700 border-green-200";
      case "aprobada":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pedido / Cliente
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Chofer
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Evidencias
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {evidences.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                  #{item.codigoRastreo}
                </div>
                <div className="text-sm text-gray-500">
                  {item.clienteNombre}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-700">
                  {item.choferNombre || "Sin asignar"}
                </div>
                <div className="text-xs text-gray-400">{item.choferCorreo}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatToLocalDateTime(item.fechaHora)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.estado)}`}
                >
                  {item.estado.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <a
                    href={item.fotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Ver Foto"
                  >
                    <FileImage size={18} />
                  </a>
                  <a
                    href={item.firmaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Ver Firma"
                  >
                    <PenTool size={18} />
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                {item.estado === "alerta" ? (
                  <button
                    onClick={() => onReview(item)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-shadow shadow-md shadow-red-200"
                  >
                    <AlertTriangle size={16} />
                    REVISAR
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 text-green-600 text-sm font-medium pr-4">
                    <CheckCircle2 size={16} />
                    Validado
                  </div>
                )}
              </td>
            </tr>
          ))}

          {evidences.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                No se encontraron evidencias con los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
