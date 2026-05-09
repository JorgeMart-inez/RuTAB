import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { menuConfig } from "../config/menuConfig";
import { SidebarItem } from "../components/ui/SidebarItem";
import { LogOut } from "lucide-react";
import logo from "../assets/logo_admin_layout.png";

/**
 * Componente de diseño principal para el Panel Administrativo.
 * Establece una estructura de Sidebar persistente y un área de contenido dinámico.
 */
export const AdminLayout = () => {
  // Consumo del estado global de autenticación para personalización y acciones de sesión
  const { usuario, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Barra Lateral (Sidebar): Navegación y Branding */}
      <aside className="w-[260px] bg-neutral-900 text-neutral-50 flex flex-col shadow-lg shrink-0">
        {/* Sección de Identidad Corporativa */}
        <div className="p-8 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-inner w-16 h-16 flex items-center justify-center shrink-0">
              <img src={logo} alt="Logo RuTAB" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">RuTAB</h1>
              <p className="text-sm text-neutral-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Generación dinámica de navegación basada en configuración y roles de usuario */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuConfig.map((item, index) => (
            <SidebarItem key={index} item={item} userRol={usuario?.rol} />
          ))}
        </nav>

        {/* Acciones de cuenta y cierre de sesión */}
        <div className="p-6 border-t border-neutral-800">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full p-4 bg-neutral-950 text-neutral-50 rounded-lg hover:bg-red-600/90 hover:text-white transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenedor de Contenido Principal:
          El componente <Outlet /> renderiza el componente de la ruta hija correspondiente.
      */}
      <main className="flex-1 bg-white text-neutral-950 m-4 p-8 rounded-2xl shadow-sm overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

