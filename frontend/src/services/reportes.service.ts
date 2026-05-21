import { api } from './api';
import type { ReporteDueno } from '../types';

export const reportesService = {
  getDueno: async (params: {
    desde: string;
    hasta: string;
    sucursalId?: string;
  }): Promise<ReporteDueno> => {
    const { data } = await api.get('/reportes/dueno', { params });
    return data;
  },
};