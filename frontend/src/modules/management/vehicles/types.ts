import { z } from "zod";

/**
 * Esquema de validación de Zod para el formulario de vehículos.
 * Replica las reglas del DTO del backend para interceptar errores en el cliente.
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
  marca: z.string().trim().optional().or(z.literal("")), // Permite strings vacíos sin romper si es opcional
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

  // ─── EXTENSIÓN PARA SOPORTE MULTIMEDIA ───
  /** URL opcional o nullable de la foto de la unidad */
  foto_unidad_url: z.string().optional().nullable(),
});

/** Tipo inferido directamente del esquema de Zod para la validación del formulario */
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

/**
 * Representación del modelo de datos de un vehículo.
 * Corresponde a la estructura almacenada en la base de datos (Prisma).
 */
export interface Vehicle {
  id: string;
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: number;
  estatus: string;
  foto_unidad_url?: string | null; // ─── ADICIÓN CRÍTICA PARA RENDER EN CARDS Y PAGES ───
}

/**
 * Estructura de datos para la gestión de estados en formularios.
 * Mantenemos los tipos basados en string para la cómoda manipulación de inputs HTML.
 */
export interface VehicleFormData {
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: string;
  estatus: string;
  foto_unidad_url?: string | null; // ─── EVITA CONFLICTOS DE ENLACE EN EL RESET/INITIAL_STATE ───
}

/**
 * Definición de propiedades para el componente de modal de formulario.
 */
export interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: Vehicle | null;
}
