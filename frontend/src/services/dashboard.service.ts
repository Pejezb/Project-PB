import { api } from './api';
import type { DashboardSucursal } from '../types';

export const dashboardService = {
  getSucursal: async (sucursalId: string): Promise<DashboardSucursal> => {
    const { data } = await api.get(`/dashboard/sucursal/${sucursalId}`);
    return data;
  },
};