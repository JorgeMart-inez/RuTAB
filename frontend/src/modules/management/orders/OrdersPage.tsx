// src/modules/management/orders/OrdersPage.tsx
import React, { useState, useMemo } from "react";
import {
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Settings2,
  Package
} from "lucide-react";
import { useOrderPage } from "./hooks/useOrdersPage";
import { OrdersForm } from "./OrdersForm";
import { Order } from "./types";

export const OrdersPage: React.FC = () => {
  const { orders, fetchOrders } = useOrderPage();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Lógica de Filtrado Dinámico (Para no mostrar borrados y aplicar búsqueda)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro de "Borrados" (Si el backend envía deleted_at o similar)
      if ((order as any).deleted_at) return false;

      // Filtro por Estado
      const matchesStatus = statusFilter === "todos" || order.estado_pedido === statusFilter;

      // Filtro por Búsqueda (Cliente o ID)
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) || // UUID Real
        order.clientes?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  // Contadores para las Estadísticas
  const stats = {
    pendientes: orders.filter(o => o.estado_pedido === 'pendiente').length,
    transito: orders.filter(o => o.estado_pedido === 'en_transito').length,
    completados: orders.filter(o => o.estado_pedido === 'entregado').length,
    cancelados: orders.filter(o => o.estado_pedido === 'Cancelado').length,
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header del Panel */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Pedidos</h1>
          <p className="text-slate-500">Administra y supervisa la operación logística en tiempo real</p>
        </div>
      </div>

      {/* Cards de Estadísticas Dinámicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Clock size={20} />} label="Pendientes" value={stats.pendientes} color="yellow" />
        <StatCard icon={<Truck size={20} />} label="En Tránsito" value={stats.transito} color="blue" />
        <StatCard icon={<CheckCircle size={20} />} label="Entregados" value={stats.completados} color="green" />
        <StatCard icon={<XCircle size={20} />} label="Cancelados" value={stats.cancelados} color="red" />
      </div>

      {/* Barra de Herramientas: Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Buscar por cliente o UUID de pedido..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_transito">En Tránsito</option>
            <option value="entregado">Entregados</option>
            <option value="Cancelado">Cancelados</option>
          </select>
        </div>
        <p className="text-xs font-medium text-slate-400">Mostrando {filteredOrders.length} pedidos</p>
      </div>

      {/* Tabla con mayor escala visual */}
      <div className="bg-white rounded-b-3xl shadow-md border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">ID (UUID)</th>
              <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
              <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">Codigo Rastreo</th>
              <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-slate-300" />
                    <span className="text-sm font-mono text-slate-500 font-medium" title={order.id}>
                      {order.id.split('-')[0]}...
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-base font-bold text-slate-800">{order.clientes?.nombre}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{order.clientes?.direccion}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-base font-bold text-slate-800">{order.codigo_rastreo}</div>
                </td>
                <td className="px-8 py-6 text-center">
                  <StatusBadge status={order.estado_pedido} />
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                  >
                    <Settings2 size={22} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrdersForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchOrders();
        }}
        order={selectedOrder}
      />
    </div>
  );
};

// --- SUB-COMPONENTES PARA LIMPIEZA ---

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: any = {
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    entregado: "bg-green-100 text-green-600",
    en_transito: "bg-blue-100 text-blue-600",
    pendiente: "bg-yellow-100 text-yellow-600",
    Cancelado: "bg-red-100 text-red-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};