import { useState, useEffect, FormEvent } from "react";
import { Driver, DriverFormData } from "../types";
import { DriverService } from "../drivers.service";
import { toast } from "sonner";

const INITIAL_STATE: DriverFormData = {
  nombre: "",
  licencia: "",
  correo: "",
  password: "",
  telefono: "",
  foto_perfil_url: "",
};

export const useDriverForm = (
  driver: Driver | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void,
) => {
  const [formData, setFormData] = useState<DriverFormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el manejo de la imagen y recorte
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        nombre: driver.nombre || "",
        licencia: driver.licencia || "",
        correo: driver.correo || "",
        password: "", // Limpiamos para que no se envíe a menos que se edite
        telefono: driver.telefono || "",
        foto_perfil_url: driver.foto_perfil_url || "",
      });
      setPreviewUrl(driver.foto_perfil_url || null);
    } else {
      setFormData(INITIAL_STATE);
      setPreviewUrl(null);
    }
    setSelectedFile(null); // Reiniciamos archivo pendiente
  }, [driver, isOpen]);

  /**
   * Actualizador dinámico de campos del formulario.
   */
  const handleChange = (field: keyof DriverFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Captura el archivo del input file y abre el modal de recorte
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsCropModalOpen(true);
      // Reseteamos el input por si el usuario cancela y vuelve a elegir la misma imagen
      e.target.value = "";
    }
  };

  /**
   * Recibe el archivo recortado (Blob/File) desde el componente ImageCropper
   */
  const handleCropComplete = (croppedFile: File) => {
    setSelectedFile(croppedFile);
    const objectUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(objectUrl);
    setIsCropModalOpen(false);
  };

  /**
   * Procesa el guardado: Sube imagen (si hay nueva) -> Guarda Chofer
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let currentPhotoUrl = formData.foto_perfil_url;

      // 1. Si hay un archivo nuevo pendiente, lo subimos primero
      if (selectedFile) {
        const uploadResult = await DriverService.uploadAvatar(selectedFile);
        currentPhotoUrl = uploadResult.foto_perfil_url;
      }

      // 2. Preparamos el payload final
      const payload: DriverFormData = {
        ...formData,
        foto_perfil_url: currentPhotoUrl,
      };

      // Limpiamos el password si está vacío en edición
      if (driver?.id && !payload.password) {
        delete payload.password;
      }

      // 3. Guardar en Base de Datos
      if (driver?.id) {
        await DriverService.update(driver.id, payload);
        toast.success("Chofer actualizado correctamente");
      } else {
        await DriverService.create(payload);
        toast.success("Chofer registrado exitosamente.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el chofer.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit,
    // Exportamos propiedades para la UI de imagen
    previewUrl,
    handleFileSelect,
    isCropModalOpen,
    setIsCropModalOpen,
    handleCropComplete,
    selectedFile,
  };
};
