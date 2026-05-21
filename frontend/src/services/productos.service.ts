import { api } from './api';
import type { Producto, Categoria } from '../types';

export const productosService = {
  getAll: async (sucursalId?: string): Promise<Producto[]> => {
    const { data } = await api.get('/productos', {
      params: sucursalId ? { sucursalId } : {},
    });
    return data;
  },

  getCategorias: async (sucursalId?: string): Promise<Categoria[]> => {
    const { data } = await api.get('/categorias', {
      params: sucursalId ? { sucursalId } : {},
    });
    return data;
  },
};
