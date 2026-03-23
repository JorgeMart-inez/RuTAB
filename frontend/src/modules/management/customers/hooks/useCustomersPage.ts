// /src/modules/clientes/hooks/useCustomersPage.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Customer } from '../types';
import { CustomerService } from '../customers.service';

export const useCustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Buscador y Métricas (Específicos del diseño de clientes)
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el Modal del Formulario (Crear/Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Estados para el Modal de Confirmación (Eliminar)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CustomerService.getAll();
      setCustomers(data || []);
    } catch (error: any) {
      toast.error(error.message || "Hubo un problema al cargar los clientes");
    } finally {
      setIsLoading(false);
    }
  }, []);


  // --- Lógica del Buscador y Estadísticas ---
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerSearch = searchTerm.toLowerCase();

    return customers.filter(c =>
      c.nombre.toLowerCase().includes(lowerSearch) ||
      (c.contacto && c.contacto.toLowerCase().includes(lowerSearch)) ||
      (c.correo && c.correo.toLowerCase().includes(lowerSearch)) ||
      (c.codigo && c.codigo.toLowerCase().includes(lowerSearch))
    );
  }, [customers, searchTerm]);

const stats = useMemo(() => {
  const currentCustomers = customers || [];
  const activos = currentCustomers.filter(c => c.estatus === 'Activo').length;
  const total = currentCustomers.length;
  const totalPedidos = currentCustomers.reduce((sum, c) => sum + (Number(c.totalPedidos) || 0), 0);

  return { total, activos, totalPedidos };
}, [customers]);

  // --- Lógica del Formulario ---
  const openNewModal = () => { setSelectedCustomer(null); setIsModalOpen(true); };
  const openEditModal = (customer: Customer) => { setSelectedCustomer(customer); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); };

  // --- Lógica de Eliminación ---
  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    // Esperamos para la animación de cierre
    setTimeout(() => setCustomerToDelete(null), 200);
  };

  const executeDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      await CustomerService.delete(customerToDelete.id);
      toast.success(`Cliente ${customerToDelete.nombre} eliminado correctamente`);
      await fetchCustomers();
      closeConfirmModal();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el cliente");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
  fetchCustomers();
}, [fetchCustomers]);

  return {
    customers: filteredCustomers, // Exportamos los filtrados para que el buscador actúe
    isLoading,
    searchTerm,
    setSearchTerm,
    stats,
    // Exportes del formulario
    isModalOpen,
    selectedCustomer,
    openNewModal,
    openEditModal,
    closeModal,
    fetchCustomers,
    // Exportes de confirmación
    isConfirmOpen,
    customerToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete
  };
};