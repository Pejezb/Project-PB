import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './components/layout/AuthLayout';
import { useAuthStore } from './store/authStore';
import type { Rol } from './types';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MesasPage from './pages/mesas/MesasPage';
import NuevoPedidoPage from './pages/pedidos/NuevoPedidoPage';
import HistorialPage from './pages/pedidos/HistorialPage';
import CocinaPage from './pages/cocina/CocinaPage';
import MenuPage from './pages/menu/MenuPage';
import InventarioPage from './pages/inventario/InventarioPage';
import ReportesPage from './pages/reportes/ReportesPage';
import CajaPage from './pages/caja/CajaPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import PerfilPage from './pages/perfil/PerfilPage';
import NotificacionesPage from './pages/notificaciones/NotificacionesPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import MeseroPage from './pages/mesero/MeseroPage';

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: Rol[] }) {
  const { user, accessToken } = useAuthStore();
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AuthGuard({ children }: { children: JSX.Element }) {
  const { accessToken } = useAuthStore();
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AuthGuard><LoginPage /></AuthGuard>} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/403" element={<NotFoundPage />} />

      {/* Cocina (sin sidebar) */}
      <Route path="/cocina" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'COCINERO']}>
          <CocinaPage />
        </ProtectedRoute>
      } />

      {/* Vista móvil mesero (sin sidebar) */}
      <Route path="/mesero" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
          <MeseroPage />
        </ProtectedRoute>
      } />

      {/* Authenticated layout */}
      <Route element={<ProtectedRoute><AuthLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO', 'CAJERO']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/mesas" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <MesasPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <HistorialPage />
          </ProtectedRoute>
        } />
        <Route path="/pedidos/nuevo" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <NuevoPedidoPage />
          </ProtectedRoute>
        } />
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MenuPage />
          </ProtectedRoute>
        } />
        <Route path="/inventario" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <InventarioPage />
          </ProtectedRoute>
        } />
        <Route path="/reportes" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
            <ReportesPage />
          </ProtectedRoute>
        } />
        <Route path="/caja" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
            <CajaPage />
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsuariosPage />
          </ProtectedRoute>
        } />
        <Route path="/configuracion" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <ConfiguracionPage />
          </ProtectedRoute>
        } />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/notificaciones" element={<NotificacionesPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
