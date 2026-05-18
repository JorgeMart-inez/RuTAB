import { api } from "../../../config/api";
// Importamos el tipo estricto derivado de Zod
import { UpdateProfileInput } from "../types/profile.types";

export const profileService = {
  /**
   * Actualiza datos de texto (nombre, correo, password) garantizando
   * que la estructura cumpla fielmente con las reglas de negocio.
   */
  updateProfile: async (data: UpdateProfileInput) => {
    const response = await api.patch("/profile/update", data);
    return response.data;
  },

  /**
   * Sube la imagen del avatar optimizada al servidor utilizando FormData
   */
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/profile/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Retorna { foto_perfil_url: "..." }
  },
};
