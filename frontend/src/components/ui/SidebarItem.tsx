import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MenuItem } from "../../config/menuConfig";

interface SidebarItemProps {
  item: MenuItem;
  userRol: string | undefined;
  isCollapsed: boolean; // Nueva prop
}

const hasPermission = (rolesItem: string[], userRol: string | undefined) => {
  if (!userRol) return false;
  return rolesItem.includes(userRol);
};

export const SidebarItem = ({
  item,
  userRol,
  isCollapsed,
}: SidebarItemProps) => {
  const location = useLocation();
  const isChildActive = item.subItems?.some((sub) =>
    location.pathname.includes(sub.path),
  );
  const [isOpen, setIsOpen] = useState(isChildActive || false);

  // Si se colapsa la barra, cerramos los submenús automáticamente
  useEffect(() => {
    if (isCollapsed) setIsOpen(false);
    else if (isChildActive) setIsOpen(true);
  }, [isCollapsed, isChildActive]);

  if (!hasPermission(item.roles, userRol)) return null;

  const subItemsPermitidos =
    item.subItems?.filter((sub) => hasPermission(sub.roles, userRol)) || [];
  if (item.subItems && subItemsPermitidos.length === 0) return null;

  const Icon = item.icon;

  // Clases base ajustadas para el estado colapsado
  const baseClasses = `flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium text-sm w-full ${
    isCollapsed ? "justify-center px-0" : ""
  }`;
  const activeClasses = "bg-blue-600 text-white shadow-md";
  const inactiveClasses =
    "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50";

  // --- CASO 1: Ítem de nivel único ---
  if (!item.subItems) {
    return (
      <NavLink
        to={item.path!}
        end={item.path === "/panel/inicio"}
        className={({ isActive }) =>
          `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
        }
        title={isCollapsed ? item.title : ""} // Tooltip nativo al estar colapsado
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
      </NavLink>
    );
  }

  // --- CASO 2: Ítem con submenú ---
  return (
    <div className="space-y-1">
      <button
        onClick={() => !isCollapsed && setIsOpen(!isOpen)}
        className={`${baseClasses} ${
          isChildActive && !isOpen
            ? "text-neutral-100 bg-neutral-800/50"
            : inactiveClasses
        } ${isCollapsed ? "cursor-default" : "cursor-pointer"}`}
        title={isCollapsed ? item.title : ""}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.title}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {/* Submenús: Solo se muestran si NO está colapsado y está abierto */}
      {!isCollapsed && (
        <div
          className={`space-y-1 pl-6 overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
        >
          {subItemsPermitidos.map((subItem) => {
            const SubIcon = subItem.icon;
            return (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg transition-colors font-medium text-sm w-full ${
                    isActive
                      ? "text-blue-500 bg-blue-500/10"
                      : "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/50"
                  }`
                }
              >
                <SubIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{subItem.title}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};
