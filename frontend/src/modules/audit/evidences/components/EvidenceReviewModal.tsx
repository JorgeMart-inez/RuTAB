// src/modules/management/evidences/components/EvidenceReviewModal.tsx
import {
  X,
  MapPin,
  CheckCircle,
  ShieldAlert,
  Mail,
  Fingerprint,
} from "lucide-react";
import { Evidence } from "../types/evidence.types";

interface Props {
  evidence: Evidence | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
}

export const EvidenceReviewModal = ({
  evidence,
  onClose,
  onApprove,
}: Props) => {
  if (!evidence) return null;

  const handleApprove = async () => {
    await onApprove(evidence.id);
    onClose();
  };

  // Formateo de distancia para lectura humana
  const formatDistance = (m: number) => {
    return m > 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} metros`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Revisión de Evidencia de Alerta
              </h3>
              <p className="text-xs text-gray-500">
                Pedido ID: {evidence.pedidoId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Detalles e Información */}
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Información del Chofer
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {evidence.choferNombre?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {evidence.choferNombre}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail size={12} /> {evidence.choferCorreo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                    <Fingerprint size={12} /> ID Chofer: {evidence.choferId}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Análisis de Ubicación
                </h4>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-orange-800 font-medium">
                        Distancia de Desvío
                      </p>
                      <p className="text-2xl font-black text-orange-600">
                        {formatDistance(evidence.distanciaMetros)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    * El chofer capturó la evidencia fuera del rango permitido
                    del cliente.
                  </p>
                </div>
              </section>
            </div>

            {/* Columna Derecha: Multimedia */}
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Foto del Paquete
                </h4>
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={evidence.fotoUrl}
                    alt="Evidencia"
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Firma del Cliente
                </h4>
                <div className="h-32 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-4">
                  <img
                    src={evidence.firmaUrl}
                    alt="Firma"
                    className="max-h-full object-contain"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer Acciones */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
          >
            CERRAR REVISIÓN
          </button>
          <button
            onClick={handleApprove}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-100 flex items-center gap-2 transition-all"
          >
            <CheckCircle size={18} />
            APROBAR EVIDENCIA
          </button>
        </div>
      </div>
    </div>
  );
};
