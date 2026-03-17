// src/modulos/logistica/vehiculos/services/vehiculo.service.ts
import { api } from "../../../config/api"; // Asegúrate de que la ruta sea correcta
import { Vehiculo, VehiculoFormData } from "./types";

export const vehiculosService = {
  
  // Obtener todos los vehículos
  getAll: async (): Promise<Vehiculo[]> => {
    const { data } = await api.get<Vehiculo[]>("/vehiculos");
    return data;
  },

  // Crear un nuevo vehículo
  create: async (formData: VehiculoFormData) => {
    const { data } = await api.post("/vehiculos", {
      ...formData,
      // Mantenemos la conversión a número 
      rendimiento_combustible: parseFloat(formData.rendimiento_combustible) || 0,
    });
    return data;
  },

  // Actualizar vehículo existente
  update: async (id: string | number, formData: VehiculoFormData) => {
    const { data } = await api.patch(`/vehiculos/${id}`, {
      ...formData,
      rendimiento_combustible: parseFloat(formData.rendimiento_combustible) || 0,
    });
    return data;
  },

  // Eliminar vehículo
  delete: async (id: string | number) => {
    const { data } = await api.delete(`/vehiculos/${id}`);
    return data;
  },
};