import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MenuItem } from "../../config/menuConfig";
import { Tooltip } from "./Tooltip";

interface SidebarItemProps {
  item: MenuItem;
  userRol: string | undefined;
  isCollapsed: boolean;
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

  useEffect(() => {
    if (isCollapsed) setIsOpen(false);
    else if (isChildActive) setIsOpen(true);
  }, [isCollapsed, isChildActive]);

  if (!hasPermission(item.roles, userRol)) return null;

  const subItemsPermitidos =
    item.subItems?.filter((sub) => hasPermission(sub.roles, userRol)) || [];
  if (item.subItems && subItemsPermitidos.length === 0) return null;

  const Icon = item.icon;
  const baseClasses = `flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-medium text-sm w-full ${
    isCollapsed ? "justify-center px-0" : ""
  }`;
  const activeClasses = "bg-blue-600 text-white shadow-md";
  const inactiveClasses =
    "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50";

  const renderContent = (isActive: boolean) => (
    <>
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.title}</span>
          {item.subItems && (
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </>
      )}
    </>
  );

  if (!item.subItems) {
    return (
      <Tooltip text={item.title} enabled={isCollapsed}>
        <NavLink
          to={item.path!}
          end={item.path === "/panel/inicio"}
          className={({ isActive }) =>
            `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
          }
        >
          {({ isActive }) => renderContent(isActive)}
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-1">
      <Tooltip text={item.title} enabled={isCollapsed}>
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          className={`${baseClasses} ${
            isChildActive && !isOpen
              ? "text-neutral-100 bg-neutral-800/50"
              : inactiveClasses
          } ${isCollapsed ? "cursor-default" : "cursor-pointer"}`}
        >
          {renderContent(false)}
        </button>
      </Tooltip>

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
