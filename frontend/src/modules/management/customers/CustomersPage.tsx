// /src/modules/clientes/CustomersPage.tsx
import {
  Search, Plus, Users, UserCheck, Package,
  Edit2, Trash2, Phone, Mail, MapPin, User
} from 'lucide-react';
import { useCustomersPage } from './hooks/useCustomersPage';
import { CustomersForm } from './CustomersForm'; // Lo haremos en el siguiente paso

export const CustomersPage = () => {
  const {
    customers,
    isLoading,
    searchTerm,
    setSearchTerm,
    stats,
    isModalOpen,
    selectedCustomer,
    openNewModal,
    openEditModal,
    closeModal,
    isConfirmOpen,
    customerToDelete,
    isDeleting,
    confirmDelete,
    closeConfirmModal,
    executeDelete,
    fetchCustomers
  } = useCustomersPage();

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen flex flex-col gap-6 w-full">

      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Administra tu cartera de clientes</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Agregar Cliente
        </button>
      </div>

      {/* 2. Tarjetas de Estadísticas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-gray-500 text-sm">Total Clientes</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
            <p className="text-gray-500 text-sm">Clientes Activos</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPedidos}</p>
            <p className="text-gray-500 text-sm">Pedidos Totales</p>
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, ID o contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
        />
      </div>

      {/* 4. Cuadrícula de Clientes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
          No se encontraron clientes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">

              {/* Cabecera de la Tarjeta */}
              <div className="p-5 flex justify-between items-start border-b border-gray-50">
                <div className="flex gap-3 items-center">
                  <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{customer.nombre}</h3>
                    <span className="text-xs text-gray-500 font-medium">{customer.codigo || 'S/N'}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${customer.estatus === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {customer.estatus || 'Activo'}
                </span>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="p-5 flex-1 flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contacto:</span>
                  <span className="font-medium text-gray-900">{customer.contacto || 'No asignado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span>{customer.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="truncate">{customer.correo || 'Sin correo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400 min-w-4" />
                  <span className="truncate">{customer.direccion || 'Sin dirección'}</span>
                </div>

                {/* Total de Pedidos */}
                <div className="mt-auto pt-4 flex justify-between items-center font-medium">
                  <span className="text-gray-500">Total Pedidos:</span>
                  <span className="text-blue-600 text-lg">{customer.totalPedidos || 0}</span>
                </div>
              </div>

              {/* Footer de Botones */}
              <div className="flex border-t border-gray-100 bg-gray-50/50 rounded-b-xl overflow-hidden">
                <button
                  onClick={() => openEditModal(customer)}
                  className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors border-r border-gray-100"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => confirmDelete(customer)}
                  className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}


      <CustomersForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => { fetchCustomers(); closeModal(); }}
        customer={selectedCustomer}
      />

      {/* 5. Modal de Confirmación de Eliminación */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold">¿Eliminar cliente?</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. Se eliminará permanentemente al cliente
              <span className="font-bold text-gray-900"> {customerToDelete?.nombre}</span> y todos sus datos asociados.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};