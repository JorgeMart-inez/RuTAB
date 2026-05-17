// frontend/src/modules/management/customers/CustomersForm.tsx
import React from "react";
import { X, MapPin } from "lucide-react";
import { CustomerFormProps } from "./types";
import { useCustomersForm } from "./hooks/useCustomersForm";

export const CustomersForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
}) => {
  const { formData, isLoading, handleChange, handleSubmit } = useCustomersForm(
    customer,
    isOpen,
    onSuccess,
    onClose,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 overflow-y-auto">
          <form
            id="customer-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Nombre de la Empresa / Cliente */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre del Cliente / Razón Social{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej. Comercial Los Andes"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Código (Autogenerado) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Código de Cliente
              </label>
              <input
                type="text"
                value={
                  customer
                    ? customer.codigo || ""
                    : "Se generará automáticamente"
                }
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium cursor-not-allowed outline-none"
              />
            </div>

            {/* Estatus */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Estatus
              </label>
              <select
                value={formData.estatus}
                onChange={(e) =>
                  handleChange(
                    "estatus",
                    e.target.value as "Activo" | "Inactivo",
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Contacto Principal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre del Contacto
              </label>
              <input
                type="text"
                value={formData.contacto}
                onChange={(e) => handleChange("contacto", e.target.value)}
                placeholder="Ej. Roberto Sánchez"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                placeholder="Ej. +56 9 1111 2222"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Correo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                placeholder="Ej. contacto@empresa.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dirección Completa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={formData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Ej. Av. Principal #123, Ciudad"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Coordenadas - Latitud (Reforzado con min/max) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Latitud <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="-90"
                max="90"
                value={formData.latitude ?? ""}
                onChange={(e) =>
                  handleChange(
                    "latitude",
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
                placeholder="Ej. -33.4489"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Coordenadas - Longitud (Reforzado con min/max) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Longitud <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="-180"
                max="180"
                value={formData.longitude ?? ""}
                onChange={(e) =>
                  handleChange(
                    "longitude",
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
                placeholder="Ej. -70.6693"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="customer-form"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cliente"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
