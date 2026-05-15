import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, LogOut, ChefHat } from 'lucide-react';
import { pedidosService } from '../../services/pedidos.service';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import type { Pedido, ItemPedido } from '../../types';

function minutesSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function ElapsedTimer({ start }: { start: string }) {
  const [elapsed, setElapsed] = useState(minutesSince(start));
  useEffect(() => {
    const id = setInterval(() => setElapsed(minutesSince(start)), 10000);
    return () => clearInterval(id);
  }, [start]);
  const urgent = elapsed > 20;
  return (
    <span className={cn('font-bold tabular-nums', urgent ? 'text-error' : elapsed > 10 ? 'text-warning' : 'text-success')}>
      {elapsed} min
    </span>
  );
}

// Solo items que requieren cocina
function itemsCocina(items: ItemPedido[]) {
  return items.filter((i) => i.producto.requiereCocina !== false);
}

function nextEstado(estado: string) {
  if (estado === 'EN_COCINA') return 'EN_PREPARACION';
  if (estado === 'EN_PREPARACION') return 'LISTO';
  return null;
}

function nextLabel(estado: string) {
  if (estado === 'EN_COCINA') return '▶ Iniciar preparación';
  if (estado === 'EN_PREPARACION') return '✓ Listo para servir';
  return null;
}

function urgencyBorder(mins: number) {
  if (mins > 20) return 'border-error shadow-error/20 shadow-md';
  if (mins > 10) return 'border-warning';
  return 'border-success/50';
}

export default function CocinaPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_COCINA' | 'EN_PREPARACION' | 'LISTO'>('TODOS');
  const [time, setTime] = useState(new Date().toLocaleTimeString('es-PE'));

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('es-PE')), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: pedidos = [] } = useQuery<Pedido[]>({
    queryKey: ['pedidosActivos'],
    queryFn: pedidosService.getActivos,
    refetchInterval: 60000,
  });

  const updateEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      pedidosService.updateEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidosActivos'] }),
    onError: () => toast.error('Error al actualizar'),
  });

  // Solo pedidos que tienen al menos 1 item de cocina
  const pedidosCocina = pedidos.filter((p) =>
    ['EN_COCINA', 'EN_PREPARACION', 'LISTO'].includes(p.estado) &&
    itemsCocina(p.items).length > 0
  );

  const visible = pedidosCocina.filter((p) =>
    filtro === 'TODOS' ? true : p.estado === filtro
  );

  const counts = {
    EN_COCINA: pedidosCocina.filter(p => p.estado === 'EN_COCINA').length,
    EN_PREPARACION: pedidosCocina.filter(p => p.estado === 'EN_PREPARACION').length,
    LISTO: pedidosCocina.filter(p => p.estado === 'LISTO').length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-sidebar-bg border-b border-border flex flex-wrap items-center justify-between px-4 py-2 gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm"
          >
            <LogOut size={15} className="rotate-180" />
            Salir
          </button>
          <span className="text-border">|</span>
          <ChefHat size={18} className="text-primary" />
          <span className="font-bold text-foreground">Vista Cocina</span>
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 flex-wrap">
          {(['TODOS', 'EN_COCINA', 'EN_PREPARACION', 'LISTO'] as const).map((f) => {
            const label = f === 'TODOS'
              ? `Todos (${visible.length})`
              : f === 'EN_COCINA' ? `Nuevos (${counts.EN_COCINA})`
              : f === 'EN_PREPARACION' ? `Preparando (${counts.EN_PREPARACION})`
              : `Listos (${counts.LISTO})`;
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  filtro === f
                    ? f === 'EN_COCINA' ? 'bg-warning text-background'
                      : f === 'EN_PREPARACION' ? 'bg-info text-background'
                      : f === 'LISTO' ? 'bg-success text-background'
                      : 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="text-sm font-mono text-muted-foreground hidden sm:block">{time}</span>
      </header>

      {/* Grid de pedidos */}
      <main className="flex-1 p-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ChefHat size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Sin pedidos en cocina</p>
            <p className="text-sm mt-1">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((pedido) => {
              const mins = minutesSince(pedido.creadoEn);
              const urgent = mins > 20;
              const items = itemsCocina(pedido.items);
              const siguiente = nextEstado(pedido.estado);
              const btnLabel = nextLabel(pedido.estado);
              const isListo = pedido.estado === 'LISTO';

              return (
                <div
                  key={pedido.id}
                  className={cn(
                    'bg-card border-2 rounded-xl flex flex-col overflow-hidden transition-all',
                    urgencyBorder(mins)
                  )}
                >
                  {/* Card header */}
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    urgent ? 'bg-error/10' : 'bg-muted/30'
                  )}>
                    <div>
                      <p className="font-bold text-foreground text-lg leading-tight">
                        {pedido.mesa ? `Mesa ${pedido.mesa.numero}` : '🥡 Para llevar'}
                      </p>
                      <p className="text-xs text-muted-foreground">Pedido #{pedido.numero}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={13} />
                        <ElapsedTimer start={pedido.creadoEn} />
                      </div>
                      {urgent && (
                        <span className="text-xs bg-error text-white px-2 py-0.5 rounded-full font-bold mt-1 inline-block animate-pulse">
                          URGENTE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items con imagen */}
                  <div className="flex-1 p-3 space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-muted/40 rounded-lg p-2">
                        {item.producto.imagen ? (
                          <img
                            src={item.producto.imagen}
                            alt={item.producto.nombre}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Utensils size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm leading-tight">
                            {item.producto.nombre}
                          </p>
                        </div>
                        <span className="text-xl font-black text-foreground bg-background rounded-lg px-3 py-1 flex-shrink-0">
                          x{item.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Acción única */}
                  <div className="p-3 pt-0">
                    {isListo ? (
                      <div className="w-full py-3 rounded-xl bg-success/20 text-success font-bold text-center text-base">
                        ✓ Listo para servir
                      </div>
                    ) : siguiente && btnLabel ? (
                      <button
                        disabled={updateEstado.isPending}
                        onClick={() => updateEstado.mutate({ id: pedido.id, estado: siguiente })}
                        className={cn(
                          'w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95',
                          pedido.estado === 'EN_COCINA'
                            ? 'bg-warning text-background hover:bg-warning/90'
                            : 'bg-success text-background hover:bg-success/90',
                          updateEstado.isPending && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {updateEstado.isPending ? '...' : btnLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
