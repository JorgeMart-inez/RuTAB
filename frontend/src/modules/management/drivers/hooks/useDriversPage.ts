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

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DriverService.getAll();
      setDrivers(data);
    } catch (error: any) {
      toast.error(
        error.message || "Sucedió un problema al cargar los choferes.",
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

  /** Prepara el modal para registrar un nuevo chofer */
  const openNewModal = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  /** Prepara el modal para editar un chofer existente */
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

  /** Cierra el modal de confirmación y limpia la selección tras la animación de salida */
  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    // Delay para preservar los datos en el UI durante la transición de cierre del modal
    setTimeout(() => setDriverToDelete(null), 200);
  };

  /** Ejecuta la eliminación definitiva en el servidor */
  const executeDelete = async () => {
    if (!driverToDelete) return;

    setIsDeleting(true); // Bloqueamos botones
    try {
      await DriverService.delete(driverToDelete.id);
      toast.success(`Chofer ${driverToDelete.nombre} eliminado correctamente`);

      // Sincronización de la lista local
      await fetchDrivers();

      // Cerramos el modal primero
      closeConfirmModal();

      // --- LA CLAVE ESTÁ AQUÍ ---
      // Debemos resetear el estado de carga para que la próxima vez que se abra esté limpio.
      // Lo ideal es un pequeño delay o hacerlo justo antes de cerrar para que la UI no parpadee.
      setIsDeleting(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el chofer");
      // Si falla, también desbloqueamos
      setIsDeleting(false);
    }
  };

  return {
    // Datos y carga
    drivers,
    isLoading,
    fetchDrivers,

    // Gestión de Formulario
    isModalOpen,
    selectedDriver,
    openNewModal,
    openEditModal,
    closeModal,

    // Gestión de Eliminación
    isConfirmOpen,
    driverToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
  };
};
