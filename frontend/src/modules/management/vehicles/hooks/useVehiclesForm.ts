// useVehiclesForm.ts
import { useState, useEffect, FormEvent } from 'react';
import { Vehicle, VehicleFormData } from '../types';
import { VehicleService } from '../vehicles.service';
import { toast } from 'sonner';

const INITIAL_STATE: VehicleFormData = {
  placas: '',
  marca: '',
  modelo: '',
  rendimiento_combustible: '',
  estatus: 'disponible'
};

export const useVehiclesForm = (
  vehicle: Vehicle | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void
) => {
  const [formData, setFormData] = useState<VehicleFormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar el estado cuando se abre el modal o cambia el vehículo
  useEffect(() => {
    if (vehicle) {
      setFormData({
        placas: vehicle.placas || '',
        marca: vehicle.marca || '',
        modelo: vehicle.modelo || '',
        rendimiento_combustible: vehicle.rendimiento_combustible?.toString() || '',
        estatus: vehicle.estatus || 'disponible'
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [vehicle, isOpen]);

  // Manejador dinámico para los inputs
  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (vehicle?.id) {
        await VehicleService.update(vehicle.id, formData);
        toast.success('Vehículo actualizado correctamente');
      } else {
        await VehicleService.create(formData);
        toast.success('Vehículo registrado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit
  };
};