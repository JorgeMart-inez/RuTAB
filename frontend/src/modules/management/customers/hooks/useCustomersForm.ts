// /src/modules/clientes/hooks/useCustomersForm.ts
import { useState, useEffect, FormEvent } from 'react';
import { Customer } from '../types';
import { CustomerService } from '../customers.service';
import { toast } from 'sonner';

// Definimos el estado inicial sin ID ni campos calculados
const INITIAL_STATE = {
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  codigo: '',
  contacto: '',
  estatus: 'Activo' as 'Activo' | 'Inactivo'
};

// Usamos typeof para inferir el tipo directamente del INITIAL_STATE
type FormDataState = typeof INITIAL_STATE;

export const useCustomersForm = (
  customer: Customer | null | undefined,
  isOpen: boolean,
  onSuccess: () => void,
  onClose: () => void
) => {
  const [formData, setFormData] = useState<FormDataState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar el estado cuando se abre el modal o cambia el cliente
  useEffect(() => {
    if (customer) {
      setFormData({
        nombre: customer.nombre || '',
        telefono: customer.telefono || '',
        correo: customer.correo || '',
        direccion: customer.direccion || '',
        codigo: customer.codigo || '',
        contacto: customer.contacto || '',
        estatus: customer.estatus || 'Activo'
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [customer, isOpen]);

  // Manejador dinámico para los inputs (mismo formato que en vehículos)
  const handleChange = (field: keyof FormDataState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (customer?.id) {
      // Enviamos TODO el formData (incluyendo estatus, contacto, etc.)
      await CustomerService.update(customer.id, formData);
      toast.success('Cliente actualizado correctamente');
    } else {
      // Enviamos TODO el formData
      await CustomerService.create(formData);
      toast.success('Cliente registrado exitosamente');
    }
    onSuccess();
    onClose();
  } catch (error: any) {
    // Si el error viene de Axios, intentamos sacar el mensaje real del backend
    const errorMsg = error.response?.data?.message || error.message || 'Error al guardar';
    toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    
  } finally {
    setIsLoading(false);
  }
};

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit
  };
};