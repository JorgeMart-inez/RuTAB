// src/App.tsx

import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { RoleGuard } from "./components/guards/RoleGuard";
import { ContentLoader } from "./components/ui/ContentLoader";
import { AdminLayout } from "./layouts/AdminLayout";
import { ReactNode } from "react";
import { useAlertListener } from "../src/modules/monitoring/hooks/useAlertListener";
import { Toaster } from "react-hot-toast"; // Para que los mensajes se vean

/**
 * Indicador de carga de pantalla completa.
 * Se utiliza exclusivamente durante la hidratación inicial del estado de autenticación
 * o cambios mayores de contexto para evitar "flickering" visual.
 */
const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-xl z-[100]">
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
    </div>
  </div>
);

/**
 * Diseño de Dashboard Principal.
 * Este layout se encarga de establecer la estructura base del panel de monitoreo,
 * incluyendo la barra lateral y el área de contenido. Además, aquí se activa el
 * hook de escucha de alertas para que esté disponible en todas las vistas hijas.
 */
interface Props {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: Props) => {
  // Aquí activamos la escucha de sockets
  useAlertListener();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* El Toaster permite que las notificaciones floten en la pantalla */}
      <Toaster position="top-right" />

      <aside style={{ width: "250px", background: "#123a5d", color: "white" }}>
        {/* Aquí irá tu menú lateral después */}
        <p style={{ padding: "20px" }}>RuTAB Admin</p>
      </aside>

      <main style={{ flex: 1, padding: "20px", background: "#f4f7f9" }}>
        {children}
      </main>
    </div>
  );
};

/**
 * Definición de Módulos mediante Lazy Loading.
 * Optimiza el bundle inicial cargando el código de cada módulo solo cuando se requiere.
 */
const ModuloAuth = lazy(() =>
  import("./modules/auth").then((m) => ({ default: m.ModuloAuth })),
);
const DashboardPage = lazy(() =>
  import("./modules/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ModuloOptimizacion = lazy(() =>
  import("./modules/optimization/OptimizationIndex").then((m) => ({
    default: m.OptimizationIndex,
  })),
);
const ModuloMonitoreo = lazy(() =>
  import("./modules/monitoring/store/MonitoringPage").then((m) => ({
    default: m.MonitoringPage,
  })),
);
const FailedDeliveriesPage = lazy(() =>
  import("./modules/failed-deliveries/pages/FailedDeliveriesPage").then(
    (m) => ({
      default: m.FailedDeliveriesPage,
    }),
  ),
);
const RouteLoaderPage = lazy(() =>
  import("./modules/route-loader/pages/RouteLoaderPage").then((m) => ({
    default: m.RouteLoaderPage,
  })),
);
const ModuloAuditoria = lazy(() =>
  import("./modules/audit").then((m) => ({ default: m.ModuloAuditoria })),
);
const VehiclesPage = lazy(() =>
  import("./modules/management/vehicles/VehiclesPage").then((m) => ({
    default: m.VehiclesPage,
  })),
);
const CustomersPage = lazy(() =>
  import("./modules/management/customers/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);
const DriversPage = lazy(() =>
  import("./modules/management/drivers/DriversPage").then((m) => ({
    default: m.DriversPage,
  })),
);
const EvidencesPage = lazy(() =>
  import("./modules/audit/evidences/pages/EvidencesPage").then((m) => ({
    default: m.EvidencesPage,
  })),
);
const IncidentsPage = lazy(() =>
  import("./modules/audit/incidents/pages/IncidentsPage").then((m) => ({
    default: m.IncidentsPage,
  })),
);

const OrdersPage = lazy(() =>
  import("./modules/management/orders/OrdersPage").then((m) => ({
    default: m.OrdersPage,
  })),
);

/**
 * Orquestador principal de Rutas y Seguridad.
 */
export default function App() {
  const { token, cargandoAuth } = useAuth();

  // Bloqueo de renderizado hasta que el servidor valide la sesión actual (Hidratación)
  if (cargandoAuth) return <FullScreenLoader />;

  return (
    <Router>
      {/* Suspense Global: Captura la carga de los módulos lazy importados */}
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* RUTA PÚBLICA: Login. Redirige al panel si el usuario ya está autenticado */}
          <Route
            path="/login"
            element={
              !token ? <ModuloAuth /> : <Navigate to="/panel/inicio" replace />
            }
          />

          {/* Root Redirect: Gestión inteligente del punto de entrada */}
          <Route
            path="/"
            element={
              <Navigate to={token ? "/panel/inicio" : "/login"} replace />
            }
          />

          {/* GRUPO DE RUTAS PROTEGIDAS: Requieren token de sesión activo */}
          <Route
            path="/panel"
            element={token ? <AdminLayout /> : <Navigate to="/login" replace />}
          >
            {/* Redirección interna por defecto dentro del layout */}
            <Route index element={<Navigate to="inicio" replace />} />

            {/* Estrategia de Renderizado de Contenido Interno:
                Se utiliza un Suspense anidado con ContentLoader (barra de progreso + skeleton).
                Esto permite que el Sidebar y Header (Layout) se mantengan estáticos mientras
                la sección central carga la nueva vista.
            */}
            <Route
              element={
                <Suspense fallback={<ContentLoader />}>
                  <Outlet />
                </Suspense>
              }
            >
              {/* Ruta pública para cualquier usuario autenticado */}
              <Route
                path="inicio"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "logístico"]}>
                    <DashboardPage />
                  </RoleGuard>
                }
              />

              <Route
                path="optimizacion"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "logístico"]}>
                    <ModuloOptimizacion />
                  </RoleGuard>
                }
              />

              <Route
                path="monitoreo"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "logístico"]}>
                    <ModuloMonitoreo />
                  </RoleGuard>
                }
              />

              <Route
                path="operaciones/pedidos-fallidos"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "logístico"]}>
                    <FailedDeliveriesPage />
                  </RoleGuard>
                }
              />

              <Route
                path="operaciones/cargar-rutas"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "logístico"]}>
                    <RouteLoaderPage />
                  </RoleGuard>
                }
              />

              {/* Rutas con Control de Acceso basado en Roles (RBAC) */}
              <Route
                path="gestion/vehiculos"
                element={
                  <RoleGuard allowedRoles={["logístico"]}>
                    <VehiclesPage />
                  </RoleGuard>
                }
              />

              <Route
                path="gestion/clientes"
                element={
                  <RoleGuard allowedRoles={["logístico"]}>
                    <CustomersPage />
                  </RoleGuard>
                }
              />

              <Route
                path="gestion/choferes"
                element={
                  <RoleGuard allowedRoles={["logístico"]}>
                    <DriversPage />
                  </RoleGuard>
                }
              />

              <Route
                path="gestion/pedidos"
                element={
                  <RoleGuard allowedRoles={["logístico"]}>
                    <OrdersPage />
                  </RoleGuard>
                }
              />

              <Route
                path="auditoria"
                element={
                  <RoleGuard allowedRoles={["auditor"]}>
                    <ModuloAuditoria />
                  </RoleGuard>
                }
              />

              <Route
                path="auditoria/evidencias"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "auditor"]}>
                    <EvidencesPage />
                  </RoleGuard>
                }
              />

              <Route
                path="auditoria/incidencias"
                element={
                  <RoleGuard allowedRoles={["superAdmin", "auditor"]}>
                    <IncidentsPage />
                  </RoleGuard>
                }
              />
            </Route>
          </Route>

          {/* Catch-all: Redirección de seguridad para rutas inexistentes */}
          <Route
            path="*"
            element={
              <Navigate to={token ? "/panel/inicio" : "/login"} replace />
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
