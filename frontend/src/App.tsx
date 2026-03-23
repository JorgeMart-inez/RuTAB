// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ModuloAuth } from './modules/auth';
import { AdminLayout } from './layouts/AdminLayout';
import { ModuloInicio } from './modules/index';
import { ModuloLogistica } from './modules/management/logistic-Index';
import { ModuloAuditoria } from './modules/audit';
import { VehiclesPage } from './modules/management/vehicles/VehiclesPage';
import { CustomersPage } from './modules/management/customers/customersPage';

// 1. CREAMOS EL WRAPPER AQUÍ MISMO
const RoleGuard = ({ allowedRoles, children }: { allowedRoles: string[], children: JSX.Element }) => {
  const { usuario } = useAuth();
  
  // Siempre permitimos al superAdmin, más los roles específicos que pida la ruta
  if (usuario?.rol === 'superAdmin' || allowedRoles.includes(usuario?.rol || '')) {
    return children;
  }
  return <Navigate to="/panel/inicio" replace />;
};

export default function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Ruta pública / Login */}
        <Route path="/login" element={!token ? <ModuloAuth /> : <Navigate to="/panel/inicio" replace />} />
        
        {/* Ruta base */}
        <Route path="/" element={<Navigate to={token ? "/panel/inicio" : "/login"} replace />} />

        {/* Rutas protegidas globales */}
        <Route path="/panel" element={token ? <AdminLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ModuloInicio />} />

          {/* Rutas Protegidas por Rol usando nuestro nuevo Wrapper */}
          <Route path="logistica" element={
            <RoleGuard allowedRoles={['logístico']}>
              <ModuloLogistica />
            </RoleGuard>
          } />

          <Route path="logistica/vehiculos" element={
            <RoleGuard allowedRoles={['logístico']}>
              <VehiclesPage />
            </RoleGuard>
          } />

          <Route path="logistica/clientes" element={
            <RoleGuard allowedRoles={['logístico']}>
              <CustomersPage />
            </RoleGuard>
          } />

          <Route path="auditoria" element={
            <RoleGuard allowedRoles={['auditor']}>
              <ModuloAuditoria />
            </RoleGuard>
          } />
        </Route>
        
        {/* Ruta 404 / Catch-all */}
        <Route path="*" element={<Navigate to={token ? "/panel/inicio" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}