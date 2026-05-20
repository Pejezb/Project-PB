import { api } from './api';
import type { DashboardDueno, DashboardSucursal } from '../types';

export const dashboardService = {
  getDueno: async (): Promise<DashboardDueno> => {
    const { data } = await api.get('/dashboard');
    return data;
  },

  getSucursal: async (sucursalId: string): Promise<DashboardSucursal> => {
    const { data } = await api.get(`/dashboard/sucursal/${sucursalId}`);
    return data;
  },
};