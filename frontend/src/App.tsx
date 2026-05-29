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

function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

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

function RequireMesero({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.rol !== 'MESERO') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RequireSoloAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
              <RequireAuth>
                <AuthLayout />
              </RequireAuth>
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
              element={
                <RequireMesero>
                  <MesasPageMesero />
                </RequireMesero>
              }
            />
            <Route
              path="/mesero/pedido"
              element={
                <RequireMesero>
                  <PedidoPage />
                </RequireMesero>
              }
            />

            <Route
              path="/mesero/pedidos"
              element={
                <RequireMesero>
                  <PedidosActivosPage />
                </RequireMesero>
              }
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
              element={
                <RequireSoloAdmin>
                  <AsistenciasPage />
                </RequireSoloAdmin>
              }
            />

            <Route
              path="/menu"
              element={
                <RequireSoloAdmin>
                  <MenuPage />
                </RequireSoloAdmin>
              }
            />

            <Route
              path="/reportes"
              element={
                <RequireAdmin>
                  <ReportesPage />
                </RequireAdmin>
              }
            />

            <Route
              path="/mesas"
              element={
                <RequireSoloAdmin>
                  <MesasPage />
                </RequireSoloAdmin>
              }
            />

            <Route
              path="/pedidos"
              element={
                <RequireSoloAdmin>
                  <PedidosPage />
                </RequireSoloAdmin>
              }
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