// src/modules/management/vehicles/hooks/useVehiclesPage.ts

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Vehicle } from "../types";
import { VehicleService } from "../vehicles.service";

/**
 * Hook de gestión para la página de vehículos.
 * Centraliza la lógica de carga de datos, estados de modales (CRUD)
 * y operaciones de persistencia.
 */
export const useVehiclesPage = () => {
  // Estado de datos y carga global
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el flujo de Formulario (Creación / Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Estados para el flujo de Eliminación Segura
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Obtiene la lista actualizada de vehículos desde el servicio.
   * Memorizado con useCallback para evitar re-renderizados infinitos en el useEffect.
   */
  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await VehicleService.getAll();
      setVehicles(data);
    } catch (error: any) {
      toast.error(error.message || "Hubo un problema al cargar los vehículos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // --- Lógica de Control de Formulario ---

  /** Prepara el modal para registrar un nuevo vehículo */
  const openNewModal = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  /** Prepara el modal para editar un vehículo existente */
  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  /** Cierra el modal de formulario */
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // --- Lógica de Control de Eliminación ---

  /** Dispara el modal de confirmación antes de proceder con el borrado */
  const confirmDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsConfirmOpen(true);
  };

  /** Cierra el modal de confirmación y limpia la selección tras la animación de salida */
  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    // Delay para preservar los datos en el UI durante la transición de cierre del modal
    setTimeout(() => setVehicleToDelete(null), 200);
  };

  /** Ejecuta la eliminación definitiva en el servidor */
  const executeDelete = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    try {
      await VehicleService.delete(vehicleToDelete.id);
      toast.success(`Unidad ${vehicleToDelete.placas} eliminada correctamente`);

      // Sincronización de la lista local tras el cambio en el servidor
      await fetchVehicles();
      closeConfirmModal();
    } catch (error: any) {
      // El mensaje de error es procesado por el interceptor global de Axios
      toast.error(error.message || "Error al eliminar la unidad");
    } finally {
      // --- FIX: Reseteo de estado garantizado ---
      setIsDeleting(false);
    }
  };

  return {
    // Datos y carga
    vehicles,
    isLoading,
    fetchVehicles,

    // Gestión de Formulario
    isModalOpen,
    selectedVehicle,
    openNewModal,
    openEditModal,
    closeModal,

    // Gestión de Eliminación
    isConfirmOpen,
    vehicleToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  };
};
