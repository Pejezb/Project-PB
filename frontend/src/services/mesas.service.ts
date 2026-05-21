import { api } from './api';
import type { Mesa } from '../types';

export const mesasService = {
  getAll: async (): Promise<Mesa[]> => {
    const { data } = await api.get('/mesas');
    return data;
  },
};
