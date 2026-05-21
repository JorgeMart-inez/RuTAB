import {
  List,
  Truck,
  ShieldCheck,
  Database,
  Users,
  ShoppingCart,
  LucideIcon,
  UserRound,
  Map,
  Activity,
  Zap,
  FolderCheck,
  AlertTriangle,
  FileUp, // Nuevo icono
  FileText,
} from "lucide-react";

// Tipado con "string hint" para mantener autocompletado y permitir otros strings
export type RolPermitido =
  | "superAdmin"
  | "logístico"
  | "auditor"
  | (string & {});

export interface SubMenuItem {
  title: string;
  path: string;
  icon: LucideIcon;
  roles: RolPermitido[];
}

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  path?: string;
  roles: RolPermitido[];
  subItems?: SubMenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    title: "Inicio",
    path: "/panel/inicio",
    icon: List,
    roles: ["superAdmin", "logístico"],
  },
  {
    title: "Rutas y Operaciones",
    icon: Map,
    roles: ["superAdmin", "logístico"],
    subItems: [
      {
        title: "Optimización",
        path: "/panel/optimizacion",
        icon: Zap,
        roles: ["superAdmin", "logístico"],
      },
      {
        title: "Monitoreo en Vivo",
        path: "/panel/monitoreo",
        icon: Activity,
        roles: ["superAdmin", "logístico"],
      },
      {
        title: "Extraer Pedidos Fallidos",
        path: "/panel/operaciones/pedidos-fallidos",
        icon: ShoppingCart,
        roles: ["superAdmin", "logístico"],
      },
      {
        title: "Cargar Rutas",
        path: "/panel/operaciones/cargar-rutas",
        icon: FileUp, // Actualizado
        roles: ["superAdmin", "logístico"],
      },
    ],
  },
  {
    title: "Auditoría",
    icon: ShieldCheck,
    roles: ["superAdmin", "auditor", "logístico"],
    subItems: [
      {
        title: "Rutas",
        path: "/panel/auditoria/rutas",
        icon: Map,
        roles: ["superAdmin", "auditor"],
      },
      {
        title: "Evidencias",
        path: "/panel/auditoria/evidencias",
        icon: FolderCheck,
        roles: ["superAdmin", "auditor", "logístico"],
      },
      {
        title: "Incidencias",
        path: "/panel/auditoria/incidencias",
        icon: AlertTriangle,
        roles: ["superAdmin", "auditor", "logístico"],
      },
      {
        title: "Reportes",
        path: "/panel/auditoria/reportes",
        icon: FileText,
        roles: ["superAdmin", "auditor", "logístico"],
      },
    ],
  },
  {
    title: "Gestión de Datos",
    icon: Database,
    roles: ["superAdmin", "logístico", "auditor"],
    subItems: [
      {
        title: "Vehículos",
        path: "/panel/gestion/vehiculos",
        icon: Truck,
        roles: ["superAdmin", "logístico"],
      },
      {
        title: "Conductores",
        path: "/panel/gestion/choferes",
        icon: UserRound,
        roles: ["superAdmin", "logístico"],
      },
      {
        title: "Clientes",
        path: "/panel/gestion/clientes",
        icon: Users,
        roles: ["superAdmin"],
      },
      {
        title: "Pedidos",
        path: "/panel/gestion/pedidos",
        icon: ShoppingCart,
        roles: ["superAdmin", "logístico"],
      },
    ],
  },
  {
    title: "Mi Cuenta",
    path: "/panel/perfil",
    icon: UserRound, // Ya lo tienes importado en tu archivo
    roles: ["superAdmin", "logístico", "auditor"],
  },
];
