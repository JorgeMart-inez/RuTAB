export interface Driver {
  id: string;
  nombre: string;
  licencia: string;
  correo: string;
  telefono: string;
  foto_perfil_url: string | null; // Cambiado a null para evitar errores de undefined
}

export interface DriverFormData {
  nombre: string;
  licencia: string;
  correo: string;
  password?: string; // Ahora es opcional
  telefono: string;
  foto_perfil_url?: string;
}

export interface DriverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: Driver | null;
}
