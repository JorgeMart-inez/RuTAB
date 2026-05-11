import React, { useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { profileService } from "../services/profileService";
import { User, Mail, Phone, Lock, Camera, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ImageCropperModal } from "../../../components/ui/ImageCropperModal";

export const ProfilePage = () => {
  const { usuario, updateUsuario } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- CAMBIO: Ahora guardamos el File crudo, no el string base64 ---
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    telefono: usuario?.telefono || "",
    password: "",
  });

  const handleApiError = (error: any, defaultMsg: string) => {
    const backendMessage = error.response?.data?.message;
    if (Array.isArray(backendMessage)) {
      toast.error(backendMessage[0]);
    } else if (typeof backendMessage === "string") {
      toast.error(backendMessage);
    } else {
      toast.error(defaultMsg);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {};
      if (formData.nombre.trim()) updateData.nombre = formData.nombre.trim();
      if (formData.telefono?.trim())
        updateData.telefono = formData.telefono.trim();
      if (formData.correo.trim()) updateData.correo = formData.correo.trim();
      if (formData.password) updateData.password = formData.password;

      if (!updateData.nombre) {
        toast.error("El nombre es obligatorio");
        setLoading(false);
        return;
      }

      const updatedUser = await profileService.updateProfile(updateData);
      updateUsuario(updatedUser);
      setFormData((prev) => ({ ...prev, password: "" }));
      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      handleApiError(error, "Error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  // --- MEJORA: handleFileChange mucho más limpio ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Simplemente guardamos el archivo y el modal se abre
    setSelectedImageFile(file);

    // Limpiamos el input para que permita subir la misma foto si se cancela
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    setSelectedImageFile(null); // Cerramos el modal
    setUploading(true);
    const toastId = toast.loading("Subiendo avatar optimizado...");

    try {
      const { foto_perfil_url } =
        await profileService.uploadAvatar(croppedFile);
      updateUsuario({ foto_perfil_url });
      toast.success("Foto de perfil actualizada", { id: toastId });
    } catch (error: any) {
      handleApiError(error, "Error al subir la imagen");
      toast.dismiss(toastId);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* --- MODAL ACTUALIZADO --- */}
      {selectedImageFile && (
        <ImageCropperModal
          isOpen={!!selectedImageFile}
          imageFile={selectedImageFile}
          onClose={() => setSelectedImageFile(null)}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mi Cuenta</h1>
        <p className="text-gray-500">
          Gestiona tu información personal y credenciales de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 bg-gray-100 flex items-center justify-center">
              {usuario?.foto_perfil_url ? (
                <img
                  src={usuario.foto_perfil_url}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:bg-gray-400"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Camera size={18} />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-800">{usuario?.nombre}</p>
            <p className="text-sm text-blue-600 font-medium badge bg-blue-50 px-3 py-1 rounded-full inline-block mt-1">
              {usuario?.rol}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100"
          >
            {/* ... Resto del formulario igual ... */}
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User size={20} className="text-blue-500" /> Información
                Personal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      name="correo"
                      type="email"
                      value={formData.correo}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Lock size={20} className="text-orange-500" /> Seguridad
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Dejar en blanco para mantener actual"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:bg-blue-300"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
