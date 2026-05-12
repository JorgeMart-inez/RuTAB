import React, { useMemo, useState } from "react";
import { DriversForm } from "./DriversForm";
import { useDriverPage } from "./hooks/useDriversPage";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Search, Plus,
         Edit2, Trash2, Phone, Mail, User, Award } from "lucide-react";


/**
 * Componente de página principal para la gestión de conductores (RuTAB).
 * Mantiene la coherencia visual con el panel de administración general.
 */
export const DriversPage: React.FC = () => {
  // Desacoplamiento de lógica mediante tu hook especializado
  const {
    drivers,
    isLoading,
    isModalOpen,
    selectedDriver,
    fetchDrivers,
    openNewModal,
    openEditModal,
    closeModal,
    // Flujo de eliminación segura
    isConfirmOpen,
    driverToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  } = useDriverPage();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredDrivers = useMemo(
    () => {
      const normalizedTerm = searchTerm.trim().toLowerCase();
      if (!normalizedTerm) return drivers;

      return drivers.filter((driver) => {
        const matchesName = driver.nombre.toLowerCase().includes(normalizedTerm);
        const matchesEmail = driver.correo.toLowerCase().includes(normalizedTerm);
        const matchesId = driver.id.toLowerCase().includes(normalizedTerm);

        return matchesName || matchesEmail || matchesId;
      });
    },
    [drivers, searchTerm],
  );

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header: Acción principal y Título */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Gestión de Conductores
          </h1>
          <p className="text-slate-500 text-sm">Administra tu equipo de conductores</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[#123a5d] hover:bg-[#0e2d4a] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Agregar Conductor
        </button>
      </div>

      {/* Buscador  */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, ID o email..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
        />
      </div>

      {/* Grid de Contenido */}
      {isLoading ? (
        <div className="text-center text-slate-500 py-10">
          Cargando equipo de conductores...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Card Header: Avatar y Estatus */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden">
                    {d.foto_perfil_url ? (
                      <img src={d.foto_perfil_url} alt={d.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {d.nombre}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                      ID: {d.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Activo
                </span>
              </div>

              {/* Información de Contacto y Licencia */}
              <div className="space-y-3 border-b border-slate-100 pb-6 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{d.telefono || "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{d.correo}</span>
                </div>
                <div className="flex items-center justify-between mt-2 bg-slate-50 p-2 rounded-lg">
                   <div className="flex items-center gap-2">
                     <Award size={16} className="text-blue-500" />
                     <span className="text-xs font-bold text-slate-500 uppercase">Licencia</span>
                   </div>
                   <span className="font-bold text-slate-700">{d.licencia}</span>
                </div>
              </div>

              {/* Acciones de Tarjeta */}
              <div className="flex border-t border-gray-100 bg-gray-50/50 rounded-b-xl overflow-hidden">
                <button
                  onClick={() => openEditModal(d)}
                  className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors border-r border-gray-100"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => confirmDelete(d)}
                  className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && drivers.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              No hay conductores registrados actualmente.
            </div>
          )}
        </div>
      )}

      {/* Modal de Formulario */}
      {isModalOpen && (
        <DriversForm
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={fetchDrivers}
          driver={selectedDriver}
        />
      )}

      {/* Modal de Confirmación Global */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Eliminar Conductor"
        message={
          <>
            ¿Estás seguro de que deseas eliminar a{" "}
            <strong className="text-slate-700">{driverToDelete?.nombre}</strong>?
            Esta acción revocará su acceso a la plataforma de inmediato.
          </>
        }
        confirmText="Eliminar permanentemente"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};