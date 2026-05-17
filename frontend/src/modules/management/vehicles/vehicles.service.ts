import { isAxiosError } from "axios";
import { api } from "../../../config/api";
import { VehicleFormData } from "./types";

const ENDPOINT = "/vehicles";

const handleNestError = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    const status = error.response.status;

    if (status === 403)
      throw new Error(
        "No tienes permisos suficientes para realizar esta acción.",
      );
    if (status === 409)
      throw new Error(
        "Las placas ingresadas ya se encuentran registradas en el sistema.",
      );
    if (status === 404)
      throw new Error("El vehículo solicitado no existe o ya fue eliminado.");

    const message = data?.message || data?.error || error.response.statusText;
    const finalMessage = Array.isArray(message) ? message.join(", ") : message;

    throw new Error(finalMessage || "Error en la petición al servidor");
  }

  throw new Error(
    "Error de conexión con el servidor. Por favor, verifica tu red.",
  );
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

      // ─── VALIDACIÓN Y EMPAQUETADO DEL ARCHIVO ───
      if (fotoFile) {
        // Imprimimos para confirmar que el hook sí nos pasó el archivo
        console.log(
          "🛠️ Empaquetando archivo en POST:",
          fotoFile.name,
          fotoFile.type,
          fotoFile.size,
        );
        // IMPORTANTE: El nombre "foto_unidad" debe ser EXACTAMENTE el mismo
        // que busca el @UseInterceptors(FileInterceptor('foto_unidad')) en NestJS
        dataPayload.append("foto_unidad", fotoFile);
      }

      const { data } = await api.post(ENDPOINT, dataPayload, {
        headers: {
          // Forzamos a Axios a procesarlo como formulario multipart
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      handleNestError(error);
    }
  },

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
        console.log(
          "🛠️ Empaquetando archivo en PATCH:",
          fotoFile.name,
          fotoFile.type,
          fotoFile.size,
        );
        dataPayload.append("foto_unidad", fotoFile);
      }

      const { data } = await api.patch(`${ENDPOINT}/${id}`, dataPayload, {
        headers: {
          // Forzamos a Axios a procesarlo como formulario multipart
          "Content-Type": "multipart/form-data",
        },
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
  },
};
