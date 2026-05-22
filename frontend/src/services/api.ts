import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

const forceLogout = () => {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const code = data?.code;
    const msg = data?.error ?? '';

    if (status === 401) {
      forceLogout();
      return Promise.reject(error);
    }

    if (status === 403) {
      if (
        code === 'ASISTENCIA_REQUERIDA' ||
        msg.includes('asistencia') ||
        msg.includes('cerrada')
      ) {
        forceLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);