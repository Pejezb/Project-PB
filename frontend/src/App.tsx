import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthLayout } from './components/layout/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SucursalesPage from './pages/sucursales/SucursalesPage';
import SucursalDetallePage from './pages/sucursales/SucursalDetallePage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import { useAuthStore } from './store/authStore';
import PedidosCocinaPage from './pages/pedidos-cocina/PedidosCocinaPage';
import AsistenciasPage from './pages/administrador/asistencias/AsistenciasPages';
import MenuPage from './pages/administrador/menu/MenuPage';
import ReportesPage from './pages/administrador/reportes/ReportesPage';
import MesasPage from './pages/administrador/Mesas/MesasPage';
import PedidosPage from './pages/administrador/pedidos/PedidosPage';

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Ruta protegida: redirige a login si no hay sesión
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Ruta solo para DUENO
function RequireDueno({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.rol !== 'DUENO') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Ruta solo para DUENO o ADMIN
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.rol !== 'DUENO' && user?.rol !== 'ADMIN') return <Navigate to="/configuracion" replace />;
  return <>{children}</>;
}

// Redirect raíz inteligente según rol
function HomeRedirect() {
  const { user } = useAuthStore();
  if (user?.rol === 'MESERO' || user?.rol === 'COCINERO') return <Navigate to="/configuracion" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Privadas */}
          <Route
            element={
              <RequireAuth>
                <AuthLayout />
              </RequireAuth>
            }
          >
            <Route index element={<HomeRedirect />} />

            {/* DUENO y ADMIN */}
            <Route
              path="/dashboard"
              element={
                <RequireAdmin>
                  <DashboardPage />
                </RequireAdmin>
              }
            />

            {/* Solo DUENO */}
            <Route
              path="/sucursales"
              element={
                <RequireDueno>
                  <SucursalesPage />
                </RequireDueno>
              }
            />

            <Route
              path="/sucursales/:id"
              element={
                <RequireDueno>
                  <SucursalDetallePage />
                </RequireDueno>
              }
            />

            {/* DUENO y ADMIN */}
            <Route
              path="/usuarios"
              element={
                <RequireAdmin>
                  <UsuariosPage />
                </RequireAdmin>
              }
            />

            {/* Todos los roles */}
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/pedidos-cocina" element={<PedidosCocinaPage />} />
            <Route path="/asistencias" element={<AsistenciasPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/mesas" element={<MesasPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            {/* El equipo puede agregar más rutas aquí:
            <Route path="/mesas"    element={<MesasPage />} />
            <Route path="/pedidos"  element={<PedidosPage />} />
            <Route path="/menu"     element={<MenuPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px', borderRadius: '10px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
