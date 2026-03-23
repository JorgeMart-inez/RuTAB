// /src/modules/clientes/types.ts

export interface Customer {
  id: string;
  nombre: string;       // En el diseño: "Comercial Los Andes"
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  
  // -- Campos adicionales basados en el diseño --
  codigo?: string;      // Ej: "CLI-001" (Podemos simularlo o cortarlo del UUID)
  contacto?: string;    // Nombre de la persona (Ej: "Roberto Sánchez")
  estatus?: 'Activo' | 'Inactivo';
  totalPedidos?: number;
}

export interface CustomerFormData {
  id: string;
  nombre: string;       // En el diseño: "Comercial Los Andes"
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  
  // -- Campos adicionales basados en el diseño --
  codigo?: string;      // Ej: "CLI-001" (Podemos simularlo o cortarlo del UUID)
  contacto?: string;    // Nombre de la persona (Ej: "Roberto Sánchez")
  estatus?: 'Activo' | 'Inactivo';
  totalPedidos?: number;
}

export interface CustomerFormProps {
  isOpen : boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

// Para crear un cliente, no enviamos el ID ni los datos calculados
export type CreateCustomerDto = Omit<Customer, 'id' | 'codigo' | 'estatus' | 'totalPedidos'>;
// Para actualizar, todos los campos son opcionales
export type UpdateCustomerDto = Partial<CreateCustomerDto>;