// frontend/src/modules/logistic/vehicles/VehiclesPage.tsx
import React from "react";
import { VehicleForm } from "./VehiclesForm";
import { useVehiclesPage } from "./hooks/useVehiclesPage";
import { ConfirmModal } from "../../../components/ui/ConfirmModal"; // Ajusta esta ruta a donde guardaste el modal genérico

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
    // Propiedades del modal de confirmación
    isConfirmOpen,
    vehicleToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  } = useVehiclesPage();

  return (
    <div className="p-4 lg:p-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Panel de Administrador
          </h1>
          <p className="text-slate-500 text-sm">Gestión de flota y unidades</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[#123a5d] hover:bg-[#0e2d4a] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
        >
          + Nuevo Vehículo
        </button>
      </div>

      {/* Estado de Carga */}
      {isLoading ? (
        <div className="text-center text-slate-500 py-10">
          Cargando vehículos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Listado de Vehículos */}
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-xl text-2xl">🚗</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg uppercase">
                      {v.modelo}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium">
                      Vehículo de carga
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${v.estatus === "disponible" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                >
                  {v.estatus === "disponible" ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="space-y-3 border-b border-slate-100 pb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Marca:</span>
                  <span className="font-semibold text-slate-700">
                    {v.marca}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Placa:</span>
                  <span className="font-bold text-slate-700">{v.placas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rendimiento:</span>
                  <span className="font-semibold text-slate-700">
                    {v.rendimiento_combustible} km/L
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => openEditModal(v)}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => confirmDelete(v)}
                  className="px-4 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 py-2.5 rounded-xl transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {/* Estado Vacío */}
          {!isLoading && vehicles.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No hay vehículos registrados en la flota.
            </div>
          )}
        </div>
      )}

      {/* Modal del Formulario (Crear/Editar) */}
      {isModalOpen && (
        <VehicleForm
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={fetchVehicles}
          vehicle={selectedVehicle}
        />
      )}

      {/* Modal de Confirmación Global (Eliminar) */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Eliminar Vehículo"
        message={
          <>
            ¿Estás seguro de que deseas eliminar la unidad con placas{" "}
            <strong className="text-slate-700">
              {vehicleToDelete?.placas}
            </strong>
            ? Esta acción no se puede deshacer.
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
