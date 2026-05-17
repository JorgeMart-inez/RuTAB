import { useState, useEffect, FormEvent } from "react";
import { Vehicle, VehicleFormData, vehicleFormSchema } from "../types";
import { VehicleService } from "../vehicles.service";
import { toast } from "sonner";

/**
 * Estado inicial limpio para el formulario de vehículos.
 */
const INITIAL_STATE: VehicleFormData = {
  placas: "",
  marca: "",
  modelo: "",
  rendimiento_combustible: "",
  estatus: "disponible",
};

/**
 * Hook personalizado para la gestión lógica y validación de formularios de vehículos.
 */
export const useVehiclesForm = (
  vehicle: Vehicle | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void,
) => {
  const [formData, setFormData] = useState<VehicleFormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  /** Estado para almacenar los mensajes de error específicos de cada campo */
  const [errors, setErrors] = useState<
    Partial<Record<keyof VehicleFormData, string>>
  >({});

  /**
   * Efecto de Sincronización:
   * Rehidrata el formulario en modo edición o lo limpia en modo creación.
   * También limpia cualquier rastro de errores de validación previos al abrir/cerrar.
   */
  useEffect(() => {
    setErrors({});
    if (vehicle) {
      setFormData({
        placas: vehicle.placas || "",
        marca: vehicle.marca || "",
        modelo: vehicle.modelo || "",
        rendimiento_combustible:
          vehicle.rendimiento_combustible?.toString() || "",
        estatus: vehicle.estatus || "disponible",
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [vehicle, isOpen]);

  /**
   * Actualizador dinámico de campos.
   * Si el campo modificado tenía un error activo, lo remueve de inmediato para mejorar la UX.
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
   * Gestiona el flujo de validación local mediante Zod y el posterior envío al servidor.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); // Reset preventivo de errores

    // ─── BARRERA DE SEGURIDAD CON ZOD ───
    const validation = vehicleFormSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof VehicleFormData, string>> = {};

      // Mapeamos el arreglo de errores de Zod hacia nuestro estado estructurado
      validation.error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof VehicleFormData;
        if (fieldName) {
          fieldErrors[fieldName] = err.message;
        }
      });

      setErrors(fieldErrors);
      toast.error("Por favor, revisa los campos marcados en rojo.");
      return;
    }

    // Si la validación pasa, continuamos con la sincronización asíncrona
    setIsLoading(true);

    try {
      if (vehicle?.id) {
        await VehicleService.update(vehicle.id, formData);
        toast.success("Vehículo actualizado correctamente");
      } else {
        await VehicleService.create(formData);
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
    handleChange,
    handleSubmit,
  };
};
