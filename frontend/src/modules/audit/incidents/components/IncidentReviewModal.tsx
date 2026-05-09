import {
  X,
  MapPin,
  Calendar,
  User,
  FileText,
  Save,
  ExternalLink,
} from "lucide-react";
import { Incident } from "../types/incident.types";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { formatToLocalDateTime } from "../../../../utils/dateHelpers";

interface Props {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

const mapContainerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "0.5rem",
};

export const IncidentReviewModal = ({
  incident,
  onClose,
  onUpdateStatus,
}: Props) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Sincronizar el estado seleccionado cuando se abre el modal
  useEffect(() => {
    if (incident) {
      setSelectedStatus(incident.estado);
    }
  }, [incident]);

  // Cargador de Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  if (!incident) return null;

  const handleStatusChange = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(incident.id, selectedStatus);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  const center = {
    lat: Number(incident.lat) || 0,
    lng: Number(incident.lng) || 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 capitalize">
              Revisión de Incidencia: {incident.tipo || "General"}
            </h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              Categoría: {incident.categoria} | Estado actual:{" "}
              <span className="font-semibold">{incident.estado}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Datos y Mapa */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <User size={18} className="text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {incident.choferNombre || "Chofer no asignado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {incident.choferCorreo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar size={18} className="text-blue-500" />
                  <p>{formatToLocalDateTime(incident.createdAt)}</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <FileText
                    size={18}
                    className="text-blue-500 shrink-0 mt-0.5"
                  />
                  <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 w-full">
                    {incident.descripcion || "Sin descripción proporcionada."}
                  </p>
                </div>
              </div>

              {/* Mapa */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin size={16} className="text-red-500" />
                    Ubicación del Incidente
                  </div>

                  {/* BOTÓN NUEVO: Abrir en Google Maps */}
                  {incident.lat && incident.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${incident.lat},${incident.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                    >
                      <ExternalLink size={14} />
                      Abrir en Maps
                    </a>
                  )}
                </div>

                {incident.lat && incident.lng ? (
                  isLoaded ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={15}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                      >
                        <MarkerF position={center} />
                      </GoogleMap>
                    </div>
                  ) : (
                    <div className="h-[250px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      Cargando mapa...
                    </div>
                  )
                ) : (
                  <div className="h-[100px] bg-gray-50 rounded-lg border border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-sm">
                    No hay coordenadas registradas
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Foto */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Evidencia Fotográfica
              </div>
              {incident.fotoUrlFirmada ? (
                <a
                  href={incident.fotoUrlFirmada}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={incident.fotoUrlFirmada}
                    alt="Evidencia del incidente"
                    className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                    style={{ maxHeight: "400px" }}
                  />
                </a>
              ) : (
                <div className="w-full h-[300px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                  <FileText size={40} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">Sin fotografía adjunta</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer / Acciones */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            disabled={isUpdating}
          >
            Cerrar
          </button>

          {/* Selector de Estado Dinámico */}
          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={isUpdating}
            >
              <option value="abierta">Abierta</option>
              <option value="urgente">Urgente</option>
              <option value="resuelta">Resuelta</option>
            </select>

            <button
              onClick={handleStatusChange}
              disabled={isUpdating || selectedStatus === incident.estado}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isUpdating ? "Guardando..." : "Actualizar Estado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
