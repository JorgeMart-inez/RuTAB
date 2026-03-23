// vehicles.service.ts
import { isAxiosError } from 'axios';
import { api } from '../../../config/api'; // Ajusta la ruta según dónde guardaste api.ts
import { VehicleFormData } from './types';

const ENDPOINT = '/vehicles';

// Interceptamos la estructura de error por defecto de NestJS
const handleNestError = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    
    // Buscamos el mensaje en las diferentes propiedades que NestJS suele usar
    const message = data.message || data.error || error.response.statusText;
    const finalMessage = Array.isArray(message) ? message.join(', ') : message;
    
    // Si es un 403, podemos ser aún más específicos para el usuario
    if (error.response.status === 403) {
      throw new Error('No tienes permisos suficientes para realizar esta acción.');
    }

    throw new Error(finalMessage || 'Error en la petición al servidor');
  }
  throw new Error('Error de conexión con el servidor');
};

export const VehicleService = {
  getAll: async () => {
    try {
      const { data } = await api.get(ENDPOINT);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  create: async (formData: VehicleFormData) => {
    try {
      const { data } = await api.post(ENDPOINT, {
        ...formData,
        rendimiento_combustible: parseFloat(formData.rendimiento_combustible) || 0
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  update: async (id: string | number, formData: VehicleFormData) => {
    try {
      const { data } = await api.patch(`${ENDPOINT}/${id}`, {
        ...formData,
        rendimiento_combustible: parseFloat(formData.rendimiento_combustible) || 0
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  delete: async (id: string | number) => {
    try {
      const { data } = await api.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  }
};