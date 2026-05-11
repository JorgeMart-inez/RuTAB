import { isAxiosError } from "axios";
import { api } from "../../../config/api";
import { DriverFormData } from "./types";

const ENDPOINT = "/drivers";

const handleNestError = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;

    const message = data.message || data.error || error.response.statusText;
    const finalMessage = Array.isArray(message) ? message.join(", ") : message;

    if (error.response.status === 403) {
      throw new Error(
        "No tienes permisos suficientes para realizar esta acción.",
      );
    }

    throw new Error(finalMessage || "Error en la petición al servidor");
  }
  throw new Error("Error de conexión con el servidor");
};

export const DriverService = {
  getAll: async () => {
    try {
      const { data } = await api.get(ENDPOINT);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  create: async (FormData: DriverFormData) => {
    try {
      const { data } = await api.post(ENDPOINT, {
        ...FormData,
        correo: FormData.correo,
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  update: async (id: string, formData: DriverFormData) => {
    try {
      const { data } = await api.patch(`${ENDPOINT}/${id}`, {
        ...formData,
        correo: formData.correo,
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  delete: async (id: string) => {
    try {
      const { data } = await api.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

  /**
   * Sube la imagen del chofer al servidor/Supabase
   * @param file Archivo optimizado (normalmente WebP)
   */
  uploadAvatar: async (file: File): Promise<{ foto_perfil_url: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post(`${ENDPOINT}/upload-avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      throw handleNestError(error);
    }
  },
};
