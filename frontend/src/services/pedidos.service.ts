import { api } from './api';
import type { Pedido, TipoPedido } from '../types';

interface CrearPedidoPayload {
  mesaId?: string;
  tipo: TipoPedido;
  items: { productoId: string; cantidad: number }[];
}

export const pedidosService = {
  getActivos: async (): Promise<Pedido[]> => {
    const { data } = await api.get('/pedidos/activos');
    return data;
  },

  crear: async (payload: CrearPedidoPayload): Promise<Pedido> => {
    const { data } = await api.post('/pedidos', payload);
    return data;
  },

  agregarItems: async (
    id: string,
    items: { productoId: string; cantidad: number }[]
  ): Promise<Pedido> => {
    const { data } = await api.patch(`/pedidos/${id}/items`, { items });
    return data;
  },

  entregar: async (id: string): Promise<Pedido> => {
    const { data } = await api.patch(`/pedidos/${id}/entregar`);
    return data;
  },

  cobrar: async (id: string, metodoPago: string): Promise<void> => {
    await api.patch(`/pedidos/${id}/cobrar`, { metodoPago });
  },

  cancelar: async (id: string): Promise<void> => {
    await api.patch(`/pedidos/${id}/cancelar`);
  },
};
