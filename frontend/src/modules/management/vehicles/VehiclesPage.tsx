import React, { useState, useMemo } from "react";
import {
  Truck,
  Search,
  Plus,
  Pencil,
  Trash2,
  Hash,
  Gauge,
  Tag,
  Loader2,
} from "lucide-react";
import { VehicleForm } from "./VehiclesForm";
import { useVehiclesPage } from "./hooks/useVehiclesPage";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";

export const VehiclesPage: React.FC = () => {
  const {
    vehicles,
    isLoading,
    isModalOpen,
    selectedVehicle,
    fetchVehicles,
    openNewModal,
    openEditModal,
    closeModal,
    isConfirmOpen,
    vehicleToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  } = useVehiclesPage();

  const [searchTerm, setSearchTerm] = useState("");

  // Lógica de filtrado dinámico para la barra de búsqueda
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.marca.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, vehicles]);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      {/* Header con estilo unificado */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gestión de Vehículos
          </h1>
          <p className="text-slate-500 text-base mt-1">
            Control de unidades y rendimiento de RuTAB
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#123a5d] hover:bg-[#0e2d4a] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 cursor-pointer"
        >
          <Plus size={20} />
          Nuevo Vehículo
        </button>
      </div>

      {/* Barra de Búsqueda Minimalista */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10">
        <div className="relative max-w-2xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por placas, modelo o marca..."
            className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Vehículos con estilo de Cards Compactas e Interactivas */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-slate-500 font-medium tracking-wide">
            Sincronizando flota de unidades...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="p-7 pb-5">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    {/* ─── CONTENEDOR MULTIMEDIA DE LA UNIDAD ─── */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-blue-50 text-blue-500 group-hover:bg-[#123a5d] group-hover:text-white transition-all duration-300 flex-shrink-0 shadow-inner">
                      {v.foto_unidad_url ? (
                        <img
                          src={v.foto_unidad_url}
                          alt={`Fotografía de ${v.modelo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <Truck size={26} />
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate max-w-[160px] sm:max-w-none">
                        {v.modelo}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                        Vehículo de carga
                      </p>
                    </div>
                  </div>

                  {/* Badge Dinámico multi-estatus adaptado a tu esquema */}
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      v.estatus === "disponible"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : v.estatus === "mantenimiento"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {v.estatus === "disponible"
                      ? "Activo"
                      : v.estatus === "mantenimiento"
                        ? "Taller"
                        : "Inactivo"}
                  </span>
                </div>

                {/* Detalles Técnicos Agrupados */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 mb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Tag size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Marca
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700 truncate">
                      {v.marca || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Hash size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Placas
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {v.placas}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Gauge size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Rendimiento
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {v.rendimiento_combustible} km/L
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción integrados en la base */}
              <div className="flex border-t border-slate-50 mt-auto">
                <button
                  onClick={() => openEditModal(v)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:text-blue-600 transition-all border-r border-slate-50 cursor-pointer"
                >
                  <Pencil size={16} />
                  Editar Unidad
                </button>
                <button
                  onClick={() => confirmDelete(v)}
                  className="px-8 flex items-center justify-center py-4 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales de Gestión */}
      {isModalOpen && (
        <VehicleForm
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={fetchVehicles}
          vehicle={selectedVehicle}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Eliminar Vehículo"
        message={
          <>
            ¿Deseas eliminar la unidad con placas{" "}
            <strong className="text-slate-900">
              {vehicleToDelete?.placas}
            </strong>
            ?
          </>
        }
        confirmText="Sí, eliminar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};
