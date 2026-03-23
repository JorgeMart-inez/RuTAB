// useVehiclesPage.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Vehicle } from '../types';
import { VehicleService } from '../vehicles.service';

export const useVehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Modal del Formulario (Crear/Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // NUEVOS: Estados para el Modal de Confirmación (Eliminar)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  // --- Lógica del Formulario ---
  const openNewModal = () => { setSelectedVehicle(null); setIsModalOpen(true); };
  const openEditModal = (vehicle: Vehicle) => { setSelectedVehicle(vehicle); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); };

  // --- NUEVA: Lógica de Eliminación ---
  const confirmDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    // Esperamos un poco antes de limpiar el estado para que la animación de cierre del modal no pierda el nombre del vehículo
    setTimeout(() => setVehicleToDelete(null), 200); 
  };

  const executeDelete = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    try {
      await VehicleService.delete(vehicleToDelete.id);
      toast.success(`Unidad ${vehicleToDelete.placas} eliminada correctamente`);
      await fetchVehicles();
      closeConfirmModal();
    } catch (error: any) {
      // Si NestJS lanza un 403 Forbidden, se mostrará aquí gracias a nuestro interceptor
      toast.error(error.message || "Error al eliminar la unidad");
      setIsDeleting(false); // Solo quitamos el loading si hay error (si hay éxito, el modal se cierra)
    }
  };

  return {
    vehicles,
    isLoading,
    // Exportes del formulario
    isModalOpen,
    selectedVehicle,
    openNewModal,
    openEditModal,
    closeModal,
    fetchVehicles,
    // Exportes de confirmación
    isConfirmOpen,
    vehicleToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete
  };
};