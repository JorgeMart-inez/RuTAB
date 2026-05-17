import { isAxiosError } from "axios";
import { api } from "../../../config/api";
import { DriverFormData } from "./types";

const ENDPOINT = "/drivers";

/**
 * Centralizador y formateador de errores de Axios / NestJS
 */
const handleNestError = (error: unknown): never => {
  if (isAxiosError(error)) {
    // 1. El servidor respondió con un código de estado fuera del rango 2xx
    if (error.response) {
      const data = error.response.data as any;
      const status = error.response.status;

      if (status === 401) {
        throw new Error(
          "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
        );
      }
      if (status === 403) {
        throw new Error(
          "No tienes permisos suficientes para realizar esta acción.",
        );
      }

      // Procesa mensajes de NestJS (pueden venir como string o string[] de class-validator)
      const message = data?.message || data?.error || error.response.statusText;
      const finalMessage = Array.isArray(message)
        ? message.join(", ")
        : message;

      throw new Error(
        finalMessage || "Sucedió un error inesperado en el servidor.",
      );
    }

    // 2. La petición se envió pero el servidor jamás respondió (Falla de red o caída)
    if (error.request) {
      throw new Error(
        "No se pudo establecer comunicación con el servidor. Verifica tu conexión de red.",
      );
    }
  }

  // 3. Errores nativos de JavaScript o configuraciones de código
  throw new Error(
    error instanceof Error ? error.message : "Error desconocido en el sistema.",
  );
};

export const DriverService = {
  getAll: async () => {
    try {
      const { data } = await api.get(ENDPOINT);
      return data;
    } catch (error) {
      return handleNestError(error);
    }
  },

  create: async (formData: DriverFormData) => {
    try {
      const { data } = await api.post(ENDPOINT, formData);
      return data;
    } catch (error) {
      return handleNestError(error);
    }
  },

  update: async (id: string, formData: DriverFormData) => {
    try {
      const { data } = await api.patch(`${ENDPOINT}/${id}`, formData);
      return data;
    } catch (error) {
      return handleNestError(error);
    }
  },

  delete: async (id: string) => {
    try {
      const { data } = await api.delete(`${ENDPOINT}/${id}`);
      return data;
    } catch (error) {
      return handleNestError(error);
    }
  },

  /**
   * Sube la imagen del chofer optimizada a Supabase Storage
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
      return handleNestError(error);
    }
  },
};
