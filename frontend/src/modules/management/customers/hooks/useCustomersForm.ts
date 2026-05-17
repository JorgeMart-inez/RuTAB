// frontend/src/modules/management/customers/hooks/useCustomersForm.ts
import { useState, useEffect, FormEvent } from "react";
import { Customer, CustomerFormData, customerValidationSchema } from "../types";
import { CustomerService } from "../Customers.service";
import { toast } from "sonner";

const INITIAL_STATE: CustomerFormData = {
  nombre: "",
  telefono: "",
  correo: "",
  direccion: "",
  contacto: "",
  latitude: null,
  longitude: null,
  estatus: "Activo",
};

export const useCustomersForm = (
  customer: Customer | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void,
) => {
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          nombre: customer.nombre || "",
          telefono: customer.telefono || "",
          correo: customer.correo || "",
          direccion: customer.direccion || "",
          contacto: customer.contacto || "",
          latitude: customer.latitude ?? null,
          longitude: customer.longitude ?? null,
          estatus: customer.estatus || "Activo",
        });
      } else {
        setFormData(INITIAL_STATE);
      }
    }
  }, [customer, isOpen]);

  const handleChange = (
    field: keyof CustomerFormData,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Preparar los datos convirtiendo inputs vacíos y forzando tipos numéricos para las coordenadas
      const dataToValidate = {
        ...formData,
        latitude: formData.latitude !== null ? Number(formData.latitude) : null,
        longitude:
          formData.longitude !== null ? Number(formData.longitude) : null,
      };

      // 2. Ejecutar la validación estricta a través de la barrera de Zod
      const validation = customerValidationSchema.safeParse(dataToValidate);

      // 3. Si la validación falla, interceptamos los errores antes de tocar el servidor
      if (!validation.success) {
        // Extraemos el primer error de la lista para mostrar un mensaje directo e impactante
        const firstError = validation.error.errors[0].message;
        toast.error(firstError);
        setIsLoading(false);
        return;
      }

      // 4. Si pasa la barrera, Zod nos entrega el payload 100% limpio y tipado como CreateCustomerDto
      const validatedPayload = validation.data;

      if (customer?.id) {
        await CustomerService.update(customer.id, validatedPayload);
        toast.success("Cliente actualizado correctamente");
      } else {
        await CustomerService.create(validatedPayload);
        toast.success("Cliente registrado exitosamente");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      // Captura errores controlados del backend (como correos duplicados 409 Conflict)
      toast.error(error.message || "Error al guardar el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit,
  };
};
