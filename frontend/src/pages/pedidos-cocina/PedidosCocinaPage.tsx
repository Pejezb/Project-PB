import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

import {
  Clock3,
  CheckCircle2,
  ChefHat,
  Loader2,
} from 'lucide-react';

interface PedidoCocina {
  id: string;
  mesa: string;
  cliente: string;
  creadoEn: string;
  estado: string;
  platos: string[];
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {}),
  };
};

export default function PedidosCocinaPage() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(Date.now());
  const [loadingPedido, setLoadingPedido] = useState<string | null>(null);

  const pedidosRef = useRef<PedidoCocina[]>([]);

  useEffect(() => {
    pedidosRef.current = pedidos;
  }, [pedidos]);

  const obtenerPedidos = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/pedidos-cocina`,
        {
          headers: getAuthHeaders(),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('NO ES JSON:', text);
        return;
      }

      if (Array.isArray(data)) {
        const pedidosActuales = JSON.stringify(pedidosRef.current);
        const nuevosPedidos = JSON.stringify(data);

        if (pedidosActuales !== nuevosPedidos) {
          setPedidos(data);
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const marcarListo = async (id: string) => {
    try {
      setLoadingPedido(id);

      await fetch(
        `http://localhost:3001/api/pedidos-cocina/${id}/listo`,
        {
          method: 'PATCH',

          headers: getAuthHeaders(),
        }
      );

      setPedidos((prev) =>
        prev.filter((pedido) => pedido.id !== id)
      );

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPedido(null);
    }
  };

  const obtenerTiempoTranscurrido = (fecha: string) => {
    const ahora = new Date().getTime();
    const creado = new Date(fecha).getTime();

    const diferencia = Math.floor((ahora - creado) / 1000);

    const minutos = Math.floor(diferencia / 60);
    const segundos = diferencia % 60;

    return `${minutos}:${segundos
      .toString()
      .padStart(2, '0')}`;
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    obtenerPedidos();

    const interval = setInterval(() => {
      obtenerPedidos();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen">

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <ChefHat className="text-primary" size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text">
            Pedidos de Cocina
          </h1>

          <p className="text-text-muted text-sm">
            Gestiona los pedidos pendientes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="animate-spin text-primary"
            size={40}
          />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <p className="text-text-muted">
            No hay pedidos pendientes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-4"
            >

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">
                    {pedido.mesa}
                  </h2>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  Pendiente
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Clock3 size={16} />
                <span>
                  {obtenerTiempoTranscurrido(pedido.creadoEn)}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-text mb-2">
                  Platos solicitados
                </p>

                <div className="space-y-2">
                  {pedido.platos.map((plato, index) => (
                    <div
                      key={index}
                      className="bg-background rounded-lg px-3 py-2 text-sm"
                    >
                      {plato}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => marcarListo(pedido.id)}
                  disabled={loadingPedido === pedido.id}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {loadingPedido === pedido.id ? (
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}

                  Pedido listo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}