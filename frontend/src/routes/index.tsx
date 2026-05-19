import { lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RoleGuard } from "../components/guards/RoleGuard";
import { ContentLoader } from "../components/ui/ContentLoader";
import { AdminLayout } from "../layouts/AdminLayout";
import { Suspense } from "react";

// Lazy Imports
const ModuloAuth = lazy(() =>
  import("../modules/auth").then((m) => ({ default: m.ModuloAuth })),
);
const DashboardPage = lazy(() =>
  import("../modules/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ModuloOptimizacion = lazy(() =>
  import("../modules/optimization/OptimizationIndex").then((m) => ({
    default: m.OptimizationIndex,
  })),
);
const ModuloMonitoreo = lazy(() =>
  import("../modules/monitoring/store/MonitoringPage").then((m) => ({
    default: m.MonitoringPage,
  })),
);
const FailedDeliveriesPage = lazy(() =>
  import("../modules/failed-deliveries/pages/FailedDeliveriesPage").then(
    (m) => ({ default: m.FailedDeliveriesPage }),
  ),
);
const RouteLoaderPage = lazy(() =>
  import("../modules/route-loader/pages/RouteLoaderPage").then((m) => ({
    default: m.RouteLoaderPage,
  })),
);
const ModuloAuditoria = lazy(() =>
  import("../modules/audit").then((m) => ({ default: m.ModuloAuditoria })),
);
const VehiclesPage = lazy(() =>
  import("../modules/management/vehicles/VehiclesPage").then((m) => ({
    default: m.VehiclesPage,
  })),
);
const CustomersPage = lazy(() =>
  import("../modules/management/customers/CustomersPage").then((m) => ({
    default: m.CustomersPage,
  })),
);
const DriversPage = lazy(() =>
  import("../modules/management/drivers/DriversPage").then((m) => ({
    default: m.DriversPage,
  })),
);
const EvidencesPage = lazy(() =>
  import("../modules/audit/evidences/pages/EvidencesPage").then((m) => ({
    default: m.EvidencesPage,
  })),
);
const IncidentsPage = lazy(() =>
  import("../modules/audit/incidents/pages/IncidentsPage").then((m) => ({
    default: m.IncidentsPage,
  })),
);
const RoutesPage = lazy(() =>
  import("../modules/audit/routes/pages/RoutesPage").then((m) => ({
    default: m.RoutesPage,
  })),
);
const OrdersPage = lazy(() =>
  import("../modules/management/orders/OrdersPage").then((m) => ({
    default: m.OrdersPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../modules/profile/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const ReportPage = lazy(() =>
  import("../modules/reports/pages/ReportPage").then((m) => ({
    default: m.ReportPage,
  })),
);

export const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      {/* RUTA PÚBLICA */}
      <Route
        path="/login"
        element={
          !token ? <ModuloAuth /> : <Navigate to="/panel/inicio" replace />
        }
      />

      {/* Root Redirect */}
      <Route
        path="/"
        element={<Navigate to={token ? "/panel/inicio" : "/login"} replace />}
      />

      {/* RUTAS PROTEGIDAS */}
      <Route
        path="/panel"
        element={token ? <AdminLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="inicio" replace />} />

        <Route
          element={
            <Suspense fallback={<ContentLoader />}>
              <Outlet />
            </Suspense>
          }
        >
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

          {/* Operaciones */}
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

          {/* Gestión */}
          <Route
            path="gestion/vehiculos"
            element={
              <RoleGuard allowedRoles={["logístico", "superAdmin"]}>
                <VehiclesPage />
              </RoleGuard>
            }
          />
          <Route
            path="gestion/clientes"
            element={
              <RoleGuard allowedRoles={["superAdmin"]}>
                <CustomersPage />
              </RoleGuard>
            }
          />
          <Route
            path="gestion/choferes"
            element={
              <RoleGuard allowedRoles={["logístico", "superAdmin"]}>
                <DriversPage />
              </RoleGuard>
            }
          />
          <Route
            path="gestion/pedidos"
            element={
              <RoleGuard allowedRoles={["logístico", "superAdmin"]}>
                <OrdersPage />
              </RoleGuard>
            }
          />

          {/* Auditoría */}
          <Route
            path="auditoria"
            element={
              <RoleGuard allowedRoles={["auditor", "superAdmin"]}>
                <ModuloAuditoria />
              </RoleGuard>
            }
          />
          <Route
            path="auditoria/rutas"
            element={
              <RoleGuard allowedRoles={["superAdmin", "auditor"]}>
                <RoutesPage />
              </RoleGuard>
            }
          />
          <Route
            path="auditoria/evidencias"
            element={
              <RoleGuard allowedRoles={["superAdmin", "auditor", "logístico"]}>
                <EvidencesPage />
              </RoleGuard>
            }
          />
          <Route
            path="auditoria/incidencias"
            element={
              <RoleGuard allowedRoles={["superAdmin", "auditor", "logístico"]}>
                <IncidentsPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route
          path="auditoria/reportes"
          element={
            <RoleGuard allowedRoles={["superAdmin", "auditor", "logístico"]}>
              <ReportPage />
            </RoleGuard>
          }
        />

        <Route
          path="perfil"
          element={
            <RoleGuard allowedRoles={["superAdmin", "logístico", "auditor"]}>
              <ProfilePage />
            </RoleGuard>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? "/panel/inicio" : "/login"} replace />}
      />
    </Routes>
  );
};
