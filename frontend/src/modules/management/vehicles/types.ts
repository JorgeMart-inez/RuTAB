// frontend/src/modules/management/vehicles/types.ts

import { z } from "zod";

/**
 * Esquema de validación para el formulario de vehículos.
 * Replica las reglas de negocio y restricciones del DTO del backend.
 */
export const vehicleFormSchema = z.object({
  placas: z
    .string()
    .min(1, "Las placas son obligatorias")
    .trim()
    .regex(
      /^[A-Z]{3}-[0-9]{3}-[A-Z]{1}$/,
      "Formato de placa inválido (Ejemplo esperado: ABC-123-A)",
    ),
  marca: z.string().trim().optional().or(z.literal("")),
  modelo: z.string().trim().optional().or(z.literal("")),
  rendimiento_combustible: z
    .string()
    .trim()
    .min(1, "El rendimiento es obligatorio")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Debe ser un número válido (ej. 15.5)",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "El rendimiento debe ser un valor mayor a 0",
    }),
  estatus: z.string().default("disponible"),
  foto_unidad_url: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

/**
 * Representación del modelo de datos de un vehículo (Estructura de persistencia).
 */
export interface Vehicle {
  id: string;
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: number;
  estatus: string;
  foto_unidad_url?: string | null;
}

/**
 * Estructura para el estado interno del formulario.
 * Mantiene tipos basados en strings para facilitar el binding con inputs HTML.
 */
export interface VehicleFormData {
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: string;
  estatus: string;
  foto_unidad_url?: string | null;
}

/**
 * Propiedades del componente del formulario de vehículos.
 */
export interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: Vehicle | null;
}
