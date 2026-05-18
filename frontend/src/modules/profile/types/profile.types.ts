import { z } from "zod";

export const updateProfileSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "El nombre es demasiado corto (mínimo 3 caracteres)" })
    .nonempty({ message: "El nombre no puede estar vacío" }),

  telefono: z
    .string()
    .trim()
    .regex(
      /^[0-9+\s\-]*$/,
      "El teléfono solo puede contener números, espacios, guiones o el signo '+'",
    ),

  correo: z
    .string()
    .trim()
    .email({ message: "El formato del correo es inválido" })
    .nonempty({ message: "El correo electrónico es obligatorio" }),

  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.length >= 6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
