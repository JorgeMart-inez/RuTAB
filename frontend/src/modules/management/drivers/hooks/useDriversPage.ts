import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Driver } from "../types";
import { DriverService } from "../drivers.service";

export const useDriverPage = () => {
  // Estado de datos y carga global
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el flujo de Formulario (Creación / Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Estados para el flujo de Eliminación Segura
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Obtiene la lista de conductores desde el servidor
   */
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DriverService.getAll();
      // Aseguramos que data sea un arreglo antes de guardarlo para evitar romper el .map() de la UI
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(
        error.message || "Sucedió un problema al cargar los conductores.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // --- Lógica de Control de Formulario ---

  /** Prepara el modal para registrar un nuevo conductor */
  const openNewModal = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  /** Prepara el modal para editar un conductor existente */
  const openEditModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  /** Cierra el modal de formulario */
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // --- Lógica de Control de Eliminación ---

  /** Dispara el modal de confirmación antes de proceder con el borrado */
  const confirmDelete = (driver: Driver) => {
    setDriverToDelete(driver);
    setIsConfirmOpen(true);
  };

  /** Cierra el modal de confirmación de forma limpia */
  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    setTimeout(() => setDriverToDelete(null), 200);
  };

  /** Ejecuta la eliminación definitiva en el servidor */
  const executeDelete = async () => {
    if (!driverToDelete) return;

    setIsDeleting(true);
    try {
      await DriverService.delete(driverToDelete.id);
      toast.success(
        `Conductor ${driverToDelete.nombre} eliminado correctamente`,
      );

      // Sincronización de la lista local
      await fetchDrivers();
      closeConfirmModal();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el conductor");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    drivers,
    isLoading,
    fetchDrivers,
    isModalOpen,
    selectedDriver,
    openNewModal,
    openEditModal,
    closeModal,
    isConfirmOpen,
    driverToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  };
};
