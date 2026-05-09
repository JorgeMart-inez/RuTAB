import { FileImage, AlertTriangle, CheckCircle2, ImageOff } from "lucide-react";
import { Incident, EstadoIncidencia } from "../types/incident.types";
import { formatToLocalDateTime } from "../../../../utils/dateHelpers";

interface Props {
  incidents: Incident[];
  onReview: (incident: Incident) => void;
}

export const IncidentTable = ({ incidents, onReview }: Props) => {
  const getStatusStyle = (estado: EstadoIncidencia) => {
    switch (estado.toLowerCase()) {
      case "urgente":
        return "bg-red-100 text-red-700 border-red-200";
      case "abierta":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "resuelta":
        return "bg-green-100 text-green-700 border-green-200";
      default: // pendiente
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tipo / Categoría
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
              Foto
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map((item) => {
            const requiresReview =
              item.estado === "abierta" || item.estado === "urgente";

            return (
              <tr
                key={item.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 capitalize">
                    {item.tipo || "Sin tipo"}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {item.categoria}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700">
                    {item.choferNombre || "Sin asignar"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.choferCorreo}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatToLocalDateTime(item.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.estado)}`}
                  >
                    {item.estado.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {item.fotoUrlFirmada ? (
                    <a
                      href={item.fotoUrlFirmada}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Ver Foto de Incidencia"
                    >
                      <FileImage size={18} />
                    </a>
                  ) : (
                    <span
                      className="inline-flex p-2 text-gray-300"
                      title="Sin foto"
                    >
                      <ImageOff size={18} />
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {requiresReview ? (
                    <button
                      onClick={() => onReview(item)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-shadow shadow-md shadow-orange-200"
                    >
                      <AlertTriangle size={16} />
                      REVISAR
                    </button>
                  ) : (
                    <button
                      onClick={() => onReview(item)}
                      className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm font-medium pr-4 transition-colors"
                    >
                      <CheckCircle2 size={16} />
                      Ver Detalles
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {incidents.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                No se encontraron incidencias con los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
