// frontend/src/modules/management/customers/types.ts
import { z } from "zod";

// Esquema de validación definitivo (Zod v3) con .trim() integrado
export const customerValidationSchema = z.object({
  nombre: z
    .string()
    .trim() // <-- Elimina espacios fantasmas. Si era "   ", se vuelve ""
    .min(1, "El nombre del cliente o razón social es obligatorio")
    .max(150, "El nombre es demasiado largo"),

  telefono: z
    .string()
    .trim() // <-- Convierte "   " en "" antes de evaluar la Regex y el transformador
    .regex(
      /^[0-9+\s\-]*$/,
      "El teléfono solo puede contener números, espacios, guiones o el signo '+'",
    )
    .nullable()
    .optional()
    .transform((val) => (!val ? null : val)), // Ahora "" se evalúa como falsy correctamente -> null

  correo: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio")
    .email("El formato del correo electrónico es inválido"),

  direccion: z.string().trim().min(1, "La dirección completa es obligatoria"),

  latitude: z
    .number({
      required_error: "La latitud es obligatoria",
      invalid_type_error: "La latitud debe ser un número",
    })
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90"),

  longitude: z
    .number({
      required_error: "La longitud es obligatoria",
      invalid_type_error: "La longitud debe ser un número",
    })
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180"),

  contacto: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (!val ? null : val)),

  estatus: z
    .enum(["Activo", "Inactivo"], {
      invalid_type_error: "El estatus debe ser 'Activo' o 'Inactivo'",
    })
    .optional()
    .default("Activo"),
});

// Interfaces estables para tu aplicación
export interface Customer {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string;
  direccion: string;
  latitude: number;
  longitude: number;
  codigo?: string;
  contacto?: string | null;
  estatus?: "Activo" | "Inactivo";
  totalPedidos?: number;
}

export interface CustomerFormData {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  latitude: number | null;
  longitude: number | null;
  contacto: string;
  estatus: "Activo" | "Inactivo";
}

export interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

export type CreateCustomerDto = Omit<
  Customer,
  "id" | "codigo" | "totalPedidos"
>;
export type UpdateCustomerDto = Partial<CreateCustomerDto>;
