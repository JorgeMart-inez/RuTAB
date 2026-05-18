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
 * Hook para la gestión del estado, validación con Zod y procesamiento de la imagen del vehículo.
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  /**
   * Sincroniza e hidrata el estado del formulario con los datos del vehículo recibido.
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
      setPreviewUrl((vehicle as any).foto_unidad_url || null);
    } else {
      setFormData(INITIAL_STATE);
      setPreviewUrl(null);
    }

    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [vehicle, isOpen]);

  /**
   * Captura el archivo seleccionado del sistema y abre el modal de recorte.
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };

  /**
   * Almacena el archivo recortado final y genera su URL de previsualización local.
   */
  const handleCropComplete = (croppedImageFile: File) => {
    setCroppedFile(croppedImageFile);

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(croppedImageFile));
    setIsCropModalOpen(false);
  };

  /**
   * Actualiza el valor de un campo específico del formulario y remueve su error asociado.
   */
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

  /**
   * Valida los datos del formulario con Zod y envía la petición de creación o actualización.
   */
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
