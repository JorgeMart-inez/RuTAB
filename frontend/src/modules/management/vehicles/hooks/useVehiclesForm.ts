import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Vehicle, VehicleFormData, vehicleFormSchema } from "../types";
import { VehicleService } from "../vehicles.service";
import { toast } from "sonner";

const INITIAL_STATE: VehicleFormData = {
  placas: "",
  marca: "",
  modelo: "",
  rendimiento_combustible: "",
  estatus: "disponible",
};

/**
 * Hook personalizado para la gestión lógica, validación con Zod y procesamiento de imágenes del vehículo.
 */
export const useVehiclesForm = (
  vehicle: Vehicle | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void,
) => {
  const [formData, setFormData] = useState<VehicleFormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof VehicleFormData, string>>
  >({});

  // ─── ESTADOS PARA LA GESTIÓN DE LA IMAGEN ───
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Archivo original antes de recortar
  const [croppedFile, setCroppedFile] = useState<File | null>(null); // Archivo WebP final recortado
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL para mostrar la imagen en el formulario
  const [isCropModalOpen, setIsCropModalOpen] = useState(false); // Interruptor del modal de recorte

  /**
   * Efecto de Sincronización e Hidratación de datos.
   * Maneja de manera limpia las URLs remotas existentes y libera memoria de las temporales.
   */
  useEffect(() => {
    setErrors({});
    setSelectedFile(null);
    setCroppedFile(null);

    if (vehicle) {
      setFormData({
        placas: vehicle.placas || "",
        marca: vehicle.marca || "",
        modelo: vehicle.modelo || "",
        rendimiento_combustible:
          vehicle.rendimiento_combustible?.toString() || "",
        estatus: vehicle.estatus || "disponible",
      });
      // Cast explícito de la URL remota guardada en BD que vendrá en la consulta (heredada de la tabla/DTO)
      setPreviewUrl((vehicle as any).foto_unidad_url || null);
    } else {
      setFormData(INITIAL_STATE);
      setPreviewUrl(null);
    }

    // Limpieza preventiva de URLs de objeto al cerrar o cambiar de modo
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [vehicle, isOpen]);

  /**
   * Intercepta la selección del archivo desde el explorador del sistema.
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsCropModalOpen(true); // Despierta inmediatamente al recortador visual
    }
  };

  /**
   * Recibe el archivo binario WebP optimizado e inyecta la previsualización local.
   */
  const handleCropComplete = (croppedImageFile: File) => {
    setCroppedFile(croppedImageFile);

    // Revocamos la previsualización local anterior si era un blob, evitando fugas de memoria
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Creamos la nueva URL temporal para renderizar el recorte en el formulario
    setPreviewUrl(URL.createObjectURL(croppedImageFile));
    setIsCropModalOpen(false);
  };

  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[field];
        return updatedErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = vehicleFormSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof VehicleFormData, string>> = {};
      validation.error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof VehicleFormData;
        if (fieldName) fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Por favor, revisa los campos marcados en rojo.");
      return;
    }

    setIsLoading(true);

    try {
      if (vehicle?.id) {
        // Pasamos tanto los textos del formulario como el binario de la imagen recortada
        await VehicleService.update(vehicle.id, formData, croppedFile);
        toast.success("Vehículo actualizado correctamente");
      } else {
        await VehicleService.create(formData, croppedFile);
        toast.success("Vehículo registrado exitosamente");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el vehículo");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    errors,
    previewUrl,
    selectedFile,
    isCropModalOpen,
    setIsCropModalOpen,
    handleChange,
    handleFileSelect,
    handleCropComplete,
    handleSubmit,
  };
};
