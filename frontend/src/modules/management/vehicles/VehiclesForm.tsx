import React from "react";
import { VehicleFormProps } from "./types";
import { useVehiclesForm } from "./hooks/useVehiclesForm";

/**
 * Componente de interfaz para la gestión (creación/edición) de vehículos.
 * Integra alertas visuales controladas por los errores de validación de Zod.
 */
export const VehicleForm: React.FC<VehicleFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
}) => {
  // Desestructuramos 'errors' desde nuestro hook blindado
  const { formData, isLoading, errors, handleChange, handleSubmit } =
    useVehiclesForm(vehicle, isOpen, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {vehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Identificación de la unidad */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Placas (AAA-000-A) *
            </label>
            <input
              type="text"
              className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all ${
                errors.placas
                  ? "border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 focus:ring-2 focus:ring-blue-500"
              }`}
              value={formData.placas}
              onChange={(e) =>
                handleChange("placas", e.target.value.toUpperCase())
              } // Forzamos mayúsculas para cumplir el Regex
              placeholder="TAB-123-A"
              disabled={isLoading}
            />
            {errors.placas && (
              <p className="text-red-500 text-xs font-medium mt-1 animate-fade-in">
                {errors.placas}
              </p>
            )}
          </div>

          {/* Atributos del fabricante */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Marca
              </label>
              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all ${
                  errors.marca
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                }`}
                value={formData.marca}
                onChange={(e) => handleChange("marca", e.target.value)}
                placeholder="Ej. Nissan"
                disabled={isLoading}
              />
              {errors.marca && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  {errors.marca}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Modelo
              </label>
              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all ${
                  errors.modelo
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                }`}
                value={formData.modelo}
                onChange={(e) => handleChange("modelo", e.target.value)}
                placeholder="Ej. NP300"
                disabled={isLoading}
              />
              {errors.modelo && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  {errors.modelo}
                </p>
              )}
            </div>
          </div>

          {/* Configuración operativa y eficiencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Estatus
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.estatus}
                onChange={(e) => handleChange("estatus", e.target.value)}
                disabled={isLoading}
              >
                <option value="disponible">Disponible / Activo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="fuera_servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Rendimiento (km/L) *
              </label>
              <input
                type="number"
                step="0.01"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all ${
                  errors.rendimiento_combustible
                    ? "border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                }`}
                value={formData.rendimiento_combustible}
                onChange={(e) =>
                  handleChange("rendimiento_combustible", e.target.value)
                }
                placeholder="Ej. 12.5"
                disabled={isLoading}
              />
              {errors.rendimiento_combustible && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  {errors.rendimiento_combustible}
                </p>
              )}
            </div>
          </div>

          {/* Acciones del formulario */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex justify-center items-center cursor-pointer"
            >
              {isLoading ? "Guardando..." : "Guardar Unidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
