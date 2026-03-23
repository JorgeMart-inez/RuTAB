// VehicleForm.tsx
import React from 'react';
import { VehicleFormProps } from './types';
import { useVehiclesForm } from './hooks/useVehiclesForm';

export const VehicleForm: React.FC<VehicleFormProps> = ({ isOpen, onClose, onSuccess, vehicle }) => {
  const { formData, isLoading, handleChange, handleSubmit } = useVehiclesForm(
    vehicle,
    isOpen,
    onSuccess,
    onClose
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Placas (AAA-000-A)</label>
            <input
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.placas}
              onChange={e => handleChange('placas', e.target.value)}
              placeholder="TAB-123-A"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Marca</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.marca}
                onChange={e => handleChange('marca', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Modelo</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.modelo}
                onChange={e => handleChange('modelo', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estatus</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.estatus}
                onChange={e => handleChange('estatus', e.target.value)}
                disabled={isLoading}
              >
                <option value="disponible">Disponible / Activo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="fuera_servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rendimiento: (km/L)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.rendimiento_combustible}
                onChange={e => handleChange('rendimiento_combustible', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

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
              {isLoading ? 'Guardando...' : 'Guardar Unidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};