import { useState, useEffect, FormEvent } from "react";
import { Driver, DriverFormData, driverValidationSchema } from "../types";
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
        password: "", // Limpiamos para evitar re-envíos accidentales
        telefono: driver.telefono || "",
        foto_perfil_url: driver.foto_perfil_url || "",
      });
      setPreviewUrl(driver.foto_perfil_url || null);
    } else {
      setFormData(INITIAL_STATE);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
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
   * Procesa el guardado: Valida datos -> Sube imagen (si la hay) -> Transforma y Guarda
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. BARRERA DE SEGURIDAD: Validación y transformación local con Zod
    const validation = driverValidationSchema.safeParse(formData);

    if (!validation.success) {
      const firstError = validation.error.errors[0].message;
      toast.error(firstError);
      return;
    }

    setIsLoading(true);

    try {
      // Usamos los datos sanitizados por Zod (aquí teléfono y foto ya pueden ser null si venían vacíos)
      const payload = { ...validation.data };

      // 2. Si se seleccionó una foto nueva, la subimos a Supabase
      if (selectedFile) {
        const uploadResult = await DriverService.uploadAvatar(selectedFile);
        payload.foto_perfil_url = uploadResult.foto_perfil_url;
      }

      // 3. Sanitización de contraseña para el modo edición
      if (driver?.id && !payload.password) {
        delete payload.password;
      }

      // 4. Envío seguro de datos limpios al Backend
      if (driver?.id) {
        await DriverService.update(driver.id, payload as any);
        toast.success("Conductor actualizado correctamente");
      } else {
        await DriverService.create(payload as any);
        toast.success("Conductor registrado exitosamente");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error inesperado al guardar el conductor.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit,
    previewUrl,
    handleFileSelect,
    isCropModalOpen,
    setIsCropModalOpen,
    handleCropComplete,
    selectedFile,
  };
};
