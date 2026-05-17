import { isAxiosError } from "axios";
import { api } from "../../../config/api";
import { VehicleFormData } from "./types";

/** Punto de entrada principal para el recurso de vehículos en la API */
const ENDPOINT = "/vehicles";

/**
 * Procesador central de excepciones para respuestas de NestJS.
 * Normaliza errores de validación (class-validator), códigos de estado HTTP (409, 403, 404)
 * y fallos de red para convertirlos en mensajes claros para la interfaz de usuario.
 */
const handleNestError = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    const status = error.response.status;

    // ─── MAPEO DE ERRORES CRÍTICOS DEL BACKEND ───
    if (status === 403) {
      throw new Error(
        "No tienes permisos suficientes para realizar esta acción.",
      );
    }

    if (status === 409) {
      throw new Error(
        "Las placas ingresadas ya se encuentran registradas en el sistema.",
      );
    }

    if (status === 404) {
      throw new Error("El vehículo solicitado no existe o ya fue eliminado.");
    }

    // NestJS puede devolver el mensaje en 'message' (array o string) o 'error'
    const message = data?.message || data?.error || error.response.statusText;
    const finalMessage = Array.isArray(message) ? message.join(", ") : message;

    throw new Error(finalMessage || "Error en la petición al servidor");
  }

  throw new Error(
    "Error de conexión con el servidor. Por favor, verifica tu red.",
  );
};

/**
 * Capa de servicio para operaciones CRUD de vehículos.
 * Implementa la comunicación asíncrona, sanitización y parseo de tipos hacia la API.
 */
export const VehicleService = {
  /** Recupera el listado completo de unidades registradas */
  getAll: async () => {
    try {
      const { data } = await api.get(ENDPOINT);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Registra una nueva unidad.
   * Realiza el parseo del rendimiento a número decimal antes del envío.
   */
  create: async (formData: VehicleFormData) => {
    try {
      const { data } = await api.post(ENDPOINT, {
        ...formData,
        // Sincronización estricta de tipos: garantizamos que viaje un float/number al backend
        rendimiento_combustible:
          parseFloat(formData.rendimiento_combustible) || 0,
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Actualiza parcialmente un registro existente mediante PATCH.
   */
  update: async (id: string | number, formData: VehicleFormData) => {
    try {
      const { data } = await api.patch(`${ENDPOINT}/${id}`, {
        ...formData,
        rendimiento_combustible:
          parseFloat(formData.rendimiento_combustible) || 0,
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /** Elimina un registro de vehículo del sistema */
  delete: async (id: string | number) => {
    try {
      const { data } = await api.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },
};
