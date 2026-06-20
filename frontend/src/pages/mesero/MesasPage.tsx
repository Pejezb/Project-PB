import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Grid2X2, ShoppingBag, RefreshCw } from 'lucide-react';
import { mesasService } from '../../services/mesas.service';
import { pedidosService } from '../../services/pedidos.service';
import { useAuthStore } from '../../store/authStore';
import type { Mesa, Pedido } from '../../types';
import { cn } from '../../utils/cn';

const ESTADO_CONFIG = {
  LIBRE:     { label: 'Libre',    bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-800',  dot: 'bg-green-600' },
  OCUPADA:   { label: 'Ocupada',  bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-600' },
  RESERVADA: { label: 'Reservada',bg: 'bg-gray-50',   border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-500' },
};

export default function MesasPageMesero() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const sucursalId = user?.sucursalId;

  const { data: mesas = [], isLoading: loadingMesas, refetch } = useQuery({
    queryKey: ['mesas-mesero'],
    queryFn: mesasService.getAll,
    refetchInterval: 15_000,
  });

  const { data: pedidosActivos = [] } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: pedidosService.getActivos,
    refetchInterval: 15_000,
  });

  const pedidoPorMesa = (mesaId: string): Pedido | undefined =>
    pedidosActivos.find((p) => p.mesaId === mesaId);

  const libres  = mesas.filter((m) => m.estado === 'LIBRE').length;
  const ocupadas = mesas.filter((m) => m.estado === 'OCUPADA').length;

  const handleMesa = (mesa: Mesa) => {
    if (mesa.estado === 'LIBRE') {
      navigate('/mesero/pedido', { state: { mesaId: mesa.id, mesaNumero: mesa.numero } });
    } else {
      const pedido = pedidoPorMesa(mesa.id);
      if (pedido) {
        navigate('/mesero/pedido', { state: { mesaId: mesa.id, mesaNumero: mesa.numero, pedidoId: pedido.id } });
      } else {
        navigate('/mesero/pedido', { state: { mesaId: mesa.id, mesaNumero: mesa.numero } });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Grid2X2 size={20} className="text-primary" />
            Gestión de mesas
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            <span className="text-green-600 font-medium">{libres} libre{libres !== 1 ? 's' : ''}</span>
            {' · '}
            <span className="text-orange-600 font-medium">{ocupadas} ocupada{ocupadas !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/mesero/pedido', { state: { tipo: 'PARA_LLEVAR' } })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
          >
            <ShoppingBag size={16} />
            Para llevar
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-border hover:bg-background transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      {loadingMesas ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-4 animate-pulse h-36 bg-white" />
          ))}
        </div>
      ) : mesas.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Grid2X2 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay mesas configuradas</p>
          <p className="text-sm mt-1">El administrador debe crear las mesas primero</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mesas.map((mesa) => {
            const cfg = ESTADO_CONFIG[mesa.estado] ?? ESTADO_CONFIG.LIBRE;
            const pedido = pedidoPorMesa(mesa.id);
            const esLibre = mesa.estado === 'LIBRE';

            return (
              <div
                key={mesa.id}
                className={cn(
                  'rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all',
                  cfg.bg, cfg.border
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-text">Mesa {mesa.numero}</p>
                    <p className="text-xs text-text-muted">{mesa.capacidad} personas</p>
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.badge)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>

                {pedido && (
                  <div className="text-xs text-text-muted bg-white/60 rounded-lg px-2.5 py-1.5">
                    <p className="font-medium text-text truncate">{pedido.items.length} ítem{pedido.items.length !== 1 ? 's' : ''}</p>
                    <p>S/ {Number(pedido.total ?? 0).toFixed(2)}</p>
                  </div>
                )}

                <button
                  onClick={() => handleMesa(mesa)}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                    esLibre
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-orange-700 text-white hover:bg-orange-800'
                  )}
                >
                  {esLibre ? 'Asignar pedido' : 'Añadir a pedido'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
