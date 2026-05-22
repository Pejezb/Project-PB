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
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import PedidosCocinaPage from './pages/pedidos-cocina/PedidosCocinaPage';
import MesasPageMesero from './pages/mesero/MesasPage';
import PedidoPage from './pages/mesero/PedidoPage';
import PedidosActivosPage from './pages/mesero/PedidosActivosPage';
import AsistenciasPage from './pages/administrador/asistencias/AsistenciasPages';
import MenuPage from './pages/administrador/menu/MenuPage';
import ReportesPage from './pages/reportes/ReportesPage';
import MesasPage from './pages/administrador/Mesas/MesasPage';
import PedidosPage from './pages/administrador/pedidos/PedidosPage';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RequireDueno({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  if (user?.rol !== 'DUENO') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  if (
    user?.rol !== 'DUENO' &&
    user?.rol !== 'ADMIN'
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RequireCocinero({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  if (user?.rol !== 'COCINERO') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuthStore();

  if (user?.rol === 'COCINERO') {
    return <Navigate to="/pedidos-cocina" replace />;
  }

  if (user?.rol === 'MESERO') {
    return <Navigate to="/mesero/mesas" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            element={
              <ProtectedRoute>
                <AuthLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<HomeRedirect />}
            />

            <Route
              path="/dashboard"
              element={
                <RequireAdmin>
                  <DashboardPage />
                </RequireAdmin>
              }
            />

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

            <Route
              path="/usuarios"
              element={
                <RequireAdmin>
                  <UsuariosPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/mesero/mesas"
              element={<MesasPageMesero />}
            />

            <Route
              path="/mesero/pedido"
              element={<PedidoPage />}
            />

            <Route
              path="/mesero/pedidos"
              element={<PedidosActivosPage />}
            />
        
            <Route
              path="/pedidos-cocina"
              element={
                <RequireCocinero>
                  <PedidosCocinaPage />
                </RequireCocinero>
              }
            />

            <Route
              path="/configuracion"
              element={<ConfiguracionPage />}
            />

            <Route
              path="/asistencias"
              element={<AsistenciasPage />}
            />

            <Route
              path="/menu"
              element={<MenuPage />}
            />

            <Route
              path="/reportes"
              element={<ReportesPage />}
            />

            <Route
              path="/mesas"
              element={<MesasPage />}
            />

            <Route
              path="/pedidos"
              element={<PedidosPage />}
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate to="/login" replace />
            }
          />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}