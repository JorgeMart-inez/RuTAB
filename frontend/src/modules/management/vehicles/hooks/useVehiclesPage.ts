// frontend/src/modules/management/vehicles/hooks/useVehiclesPage.ts

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Vehicle } from "../types";
import { VehicleService } from "../vehicles.service";

/**
 * Hook personalizado para la gestión de la página principal de vehículos.
 * Controla la carga de datos, estados de modales y operaciones CRUD.
 */
export const useVehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Obtiene la lista de vehículos desde el servicio.
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

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /**
   * Inicializa el estado para registrar un nuevo vehículo.
   */
  const openNewModal = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  /**
   * Inicializa el estado para la edición de un vehículo existente.
   */
  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  /**
   * Cierra el modal del formulario.
   */
  const closeModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Muestra el modal de confirmación para eliminar un vehículo.
   */
  const confirmDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsConfirmOpen(true);
  };

  /**
   * Cierra el modal de confirmación restableciendo la unidad seleccionada.
   */
  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    setTimeout(() => setVehicleToDelete(null), 200);
  };

  /**
   * Solicita el borrado lógico o físico del vehículo seleccionado en el servidor.
   */
  const executeDelete = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    try {
      await VehicleService.delete(vehicleToDelete.id);
      toast.success(`Unidad ${vehicleToDelete.placas} eliminada correctamente`);
      await fetchVehicles();
      closeConfirmModal();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la unidad");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    vehicles,
    isLoading,
    fetchVehicles,
    isModalOpen,
    selectedVehicle,
    openNewModal,
    openEditModal,
    closeModal,
    isConfirmOpen,
    vehicleToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  };
};
