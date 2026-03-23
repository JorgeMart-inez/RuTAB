// /src/modules/clientes/CustomersForm.tsx
import React from 'react';
import { X } from 'lucide-react';
import { CustomerFormProps } from './types';
import { useCustomersForm } from './hooks/useCustomersForm';

export const CustomersForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer
}) => {
  // Conectamos la vista con el "cerebro" (el hook)
  const { formData, isLoading, handleChange, handleSubmit } = useCustomersForm(
    customer,
    isOpen,
    onSuccess,
    onClose
  );

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">

      {/* Contenedor del Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
          <form id="customer-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Nombre de la Empresa / Cliente */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre del Cliente / Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej. Comercial Los Andes"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Código */}
            {/* Código (Autogenerado por el sistema) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Cliente</label>
              <input
                type="text"
                value={customer ? formData.codigo : 'Se generará automáticamente'}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium cursor-not-allowed outline-none"
              />
            </div>

            {/* Estatus */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estatus</label>
              <select
                name='estatus'
                value={formData.estatus}
                onChange={(e) => handleChange('estatus', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Contacto Principal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Contacto</label>
              <input
                type="text"
                value={formData.contacto}
                onChange={(e) => handleChange('contacto', e.target.value)}
                placeholder="Ej. Roberto Sánchez"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Ej. +56 9 1111 2222"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Correo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => handleChange('correo', e.target.value)}
                placeholder="Ej. contacto@empresa.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección Completa</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Ej. Av. Principal #123, Ciudad"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

          </form>
        </div>

        {/* Footer (Botones de acción) */}
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
              'Guardar Cliente'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};