import { api } from "../../../config/api";

export const profileService = {
  /**
   * Actualiza datos de texto (nombre, correo, password)
   */
  updateProfile: async (data: {
    nombre?: string;
    correo?: string;
    telefono?: string;
    password?: string;
  }) => {
    const response = await api.patch("/profile/update", data);
    return response.data;
  },

  /**
   * Sube la imagen al servidor
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
