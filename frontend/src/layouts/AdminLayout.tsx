import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { menuConfig } from "../config/menuConfig";
import { SidebarItem } from "../components/ui/SidebarItem";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "../assets/logo_admin_layout.png";

export const AdminLayout = () => {
  const { usuario, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Barra Lateral - Añadido z-40 para que los tooltips se vean sobre el main */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-[260px]"
        } bg-neutral-900 text-neutral-50 flex flex-col shadow-lg shrink-0 transition-all duration-300 relative z-40`}
      >
        {/* Botón para colapsar/expandir - Sin cambios en funcionalidad */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-700 transition-colors z-50 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Sección de Identidad Corporativa */}
        <div
          className={`p-4 border-b border-neutral-800 flex items-center ${
            isCollapsed ? "justify-center" : "gap-4 p-8"
          }`}
        >
          <div className="p-2 bg-white rounded-xl shadow-inner w-12 h-12 flex items-center justify-center shrink-0">
            <img src={logo} alt="Logo" className="max-w-full h-auto" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-semibold">RuTAB</h1>
              <p className="text-sm text-neutral-400">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navegación - Ajustado overflow para permitir ver tooltips */}
        <nav
          className={`flex-1 p-4 space-y-2 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}
        >
          {menuConfig.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              userRol={usuario?.rol}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Acciones de cuenta */}
        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={logout}
            className={`flex items-center justify-center gap-2 w-full p-4 bg-neutral-950 text-neutral-50 rounded-lg hover:bg-red-600/90 transition-all font-bold text-sm ${
              isCollapsed ? "px-0" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenedor de Contenido Principal */}
      <main className="flex-1 bg-white text-neutral-950 m-4 p-8 rounded-2xl shadow-sm overflow-y-auto relative z-0">
        <Outlet />
      </main>
    </div>
  );
};
