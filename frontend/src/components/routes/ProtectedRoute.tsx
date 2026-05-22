import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = ({ children }: any) => {
  const { token, user, logout } = useAuthStore();

  const noAuth = !token;
  const noAsistencia = user?.asistencia === false;

  useEffect(() => {
    if (noAsistencia) {
      logout();
    }
  }, [noAsistencia, logout]);

  if (noAuth) {
    return <Navigate to="/login" replace />;
  }

  if (noAsistencia) {
    return <Navigate to="/login" replace />;
  }

  return children;
};