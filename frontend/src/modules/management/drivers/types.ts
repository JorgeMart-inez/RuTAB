import { z } from "zod";

// 1. Definición del esquema de validación con Zod (Barrera de seguridad)
export const driverValidationSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio")
    .regex(
      /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/,
      "El nombre solo puede contener letras y espacios",
    ),
  licencia: z.string().trim().min(1, "El tipo de licencia es obligatorio"),
  correo: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio")
    .email("El formato del correo electrónico es inválido"),
  telefono: z
    .string()
    .trim()
    .regex(
      /^[0-9+\s\-]*$/,
      "El teléfono solo puede contener números, espacios, guiones o el signo '+'",
    )
    .transform((val) => (val === "" ? null : val)),
  foto_perfil_url: z
    .string()
    .url("La URL de la foto de perfil no es válida")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        // Si está vacío, es válido (para edición)
        if (val === "" || val === undefined) return true;
        // Si tiene texto, al limpiar espacios debe medir mínimo 6 caracteres
        return val.trim().length >= 6;
      },
      {
        message:
          "La contraseña no puede contener solo espacios y debe tener al menos 6 caracteres reales",
      },
    )
    .transform((val) => (!val ? "" : val.trim())),
});

// 2. Inferencia de tipos a partir del esquema de Zod
export type DriverFormData = z.infer<typeof driverValidationSchema>;

// 3. Interfaces del modelo de datos de la aplicación
export interface Driver {
  id: string;
  nombre: string;
  licencia: string;
  correo: string;
  telefono: string | null;
  foto_perfil_url: string | null;
}

export interface DriverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: Driver | null;
}
