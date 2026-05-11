import React from "react";
import { DriverProps } from "./types";
import { useDriverForm } from "./hooks/useDriversForm";
import { Camera, User } from "lucide-react";
import { ImageCropperModal } from "../../../components/ui/ImageCropperModal";

export const DriversForm: React.FC<DriverProps> = ({
  isOpen,
  onClose,
  onSuccess,
  driver,
}) => {
  const {
    formData,
    isLoading,
    handleChange,
    handleSubmit,
    previewUrl,
    handleFileSelect,
    isCropModalOpen,
    setIsCropModalOpen,
    handleCropComplete,
    selectedFile,
  } = useDriverForm(driver, isOpen, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Encabezado */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {driver ? "Editar Conductor" : "Nuevo Conductor"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              &times;
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Foto de Perfil */}
            <div className="flex justify-center mb-6">
              <label className="relative cursor-pointer group">
                <div className="h-24 w-24 rounded-full border-4 border-slate-50 overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar chofer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                {/* Overlay de Hover */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isLoading}
                />
              </label>
            </div>

            {/* Información Personal */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Nombre Completo
              </label>
              <input
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej. Juan Pérez"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  required
                  type="email"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  placeholder="juan@ejemplo.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Teléfono
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="9933..."
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Tipo de Licencia
                </label>
                <input
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.licencia}
                  onChange={(e) => handleChange("licencia", e.target.value)}
                  placeholder="Ej. A3"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Contraseña
                </label>
                <input
                  required={!driver}
                  type="password"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={driver ? "Dejar en blanco..." : "*******"}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading
                  ? "Guardando..."
                  : driver
                    ? "Actualizar Chofer"
                    : "Guardar Chofer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Recorte de Imagen */}
      {selectedFile && (
        <ImageCropperModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // Avatar cuadrado/circular
        />
      )}
    </>
  );
};
