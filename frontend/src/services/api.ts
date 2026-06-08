import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find(r => r.startsWith('csrf-token='))
    ?.split('=')[1];

  if (csrf && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
    config.headers['CSRF-Token'] = csrf;
  }

  return config;
});