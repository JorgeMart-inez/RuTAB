// types.ts
export interface Vehicle {
  id: string;
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: number;
  estatus: string;
}

export interface VehicleFormData {
  placas: string;
  marca: string;
  modelo: string;
  rendimiento_combustible: string;
  estatus: string;
}

export interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: Vehicle | null;
}