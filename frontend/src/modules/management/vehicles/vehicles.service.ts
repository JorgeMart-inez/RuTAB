// frontend/src/modules/management/vehicles/vehicles.service.ts

import { isAxiosError } from "axios";
import { api } from "../../../config/api";
import { VehicleFormData } from "./types";

const ENDPOINT = "/vehicles";

/**
 * Normaliza y gestiona las excepciones emitidas por el backend NestJS.
 */
const handleNestError = (error: unknown): never => {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    const status = error.response.status;

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

    const message = data?.message || data?.error || error.response.statusText;
    const finalMessage = Array.isArray(message) ? message.join(", ") : message;

    throw new Error(finalMessage || "Error en la petición al servidor");
  }

  throw new Error(
    "Error de conexión con el servidor. Por favor, verifica tu red.",
  );
};

export const VehicleService = {
  /**
   * Obtiene el listado completo de vehículos.
   */
  getAll: async () => {
    try {
      const { data } = await api.get(ENDPOINT);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Registra una nueva unidad con soporte multimedia.
   */
  create: async (formData: VehicleFormData, fotoFile: File | null) => {
    try {
      const dataPayload = new FormData();

      dataPayload.append("placas", formData.placas.trim());
      dataPayload.append("marca", formData.marca.trim());
      dataPayload.append("modelo", formData.modelo.trim());
      dataPayload.append("estatus", formData.estatus);
      dataPayload.append(
        "rendimiento_combustible",
        (parseFloat(formData.rendimiento_combustible) || 0).toString(),
      );

      if (fotoFile) {
        dataPayload.append("foto_unidad", fotoFile);
      }

      const { data } = await api.post(ENDPOINT, dataPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Actualiza los datos de una unidad específica y/o reemplaza su imagen.
   */
  update: async (
    id: string | number,
    formData: VehicleFormData,
    fotoFile: File | null,
  ) => {
    try {
      const dataPayload = new FormData();

      dataPayload.append("placas", formData.placas.trim());
      dataPayload.append("marca", formData.marca.trim());
      dataPayload.append("modelo", formData.modelo.trim());
      dataPayload.append("estatus", formData.estatus);
      dataPayload.append(
        "rendimiento_combustible",
        (parseFloat(formData.rendimiento_combustible) || 0).toString(),
      );

      if (fotoFile) {
        dataPayload.append("foto_unidad", fotoFile);
      }

      const { data } = await api.patch(`${ENDPOINT}/${id}`, dataPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Elimina un vehículo por su identificador único.
   */
  delete: async (id: string | number) => {
    try {
      const { data } = await api.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },
};
