import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Flame, Salad, CheckCircle2, CreditCard, XCircle, PlusCircle, Clock } from 'lucide-react';
import { pedidosService } from '../../services/pedidos.service';
import type { Pedido } from '../../types';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
  EN_COCINA:  { label: 'En cocina',  cls: 'bg-orange-100 text-orange-700' },
  LISTO:      { label: '¡Listo!',    cls: 'bg-green-100 text-green-700 animate-pulse' },
  ENTREGADO:  { label: 'Entregado',  cls: 'bg-blue-100 text-blue-700' },
};

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Yape', 'Plin'];

function tiempoTranscurrido(fecha: string): string {
  const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function PedidosActivosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalCobro, setModalCobro] = useState<Pedido | null>(null);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [modalCancelar, setModalCancelar] = useState<Pedido | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: pedidosService.getActivos,
    refetchInterval: 15_000,
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
    qc.invalidateQueries({ queryKey: ['mesas-mesero'] });
  };

  const entregarMutation = useMutation({
    mutationFn: (id: string) => pedidosService.entregar(id),
    onSuccess: () => { invalidar(); toast.success('Pedido marcado como entregado'); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error'),
  });

  const cobrarMutation = useMutation({
    mutationFn: ({ id, metodo }: { id: string; metodo: string }) =>
      pedidosService.cobrar(id, metodo),
    onSuccess: () => {
      invalidar();
      toast.success('Pedido cobrado');
      setModalCobro(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error'),
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => pedidosService.cancelar(id),
    onSuccess: () => { invalidar(); toast.success('Pedido cancelado'); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error'),
  });

  const handleCobrar = (pedido: Pedido) => {
    setMetodoPago('Efectivo');
    setModalCobro(pedido);
  };

  const confirmarCobro = () => {
    if (!modalCobro) return;
    cobrarMutation.mutate({ id: modalCobro.id, metodo: metodoPago });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            Pedidos activos
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en curso · se actualiza cada 15s
          </p>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-border p-4 h-40 animate-pulse" />)}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay pedidos activos</p>
          <p className="text-sm mt-1">Los pedidos nuevos aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pedidos.map((pedido) => {
            const esCocina = pedido.items.filter((i) => i.producto?.requiereCocina);
            const esComplemento = pedido.items.filter((i) => !i.producto?.requiereCocina);
            const estCfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, cls: 'bg-gray-100 text-gray-600' };
            const esListo = pedido.estado === 'LISTO';
            const esEntregado = pedido.estado === 'ENTREGADO';

            return (
              <div
                key={pedido.id}
                className={cn(
                  'bg-white rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all',
                  esListo ? 'border-green-300 shadow-md' : 'border-border'
                )}
              >
                {/* Encabezado tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-text">
                      {pedido.tipo === 'PARA_LLEVAR' ? '🛍 Para llevar' : `Mesa ${pedido.mesa?.numero ?? '?'}`}
                      <span className="text-text-muted font-normal text-sm ml-1.5">#{pedido.numero}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                      <Clock size={11} />
                      {tiempoTranscurrido(pedido.creadoEn)}
                    </p>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0', estCfg.cls)}>
                    {estCfg.label}
                  </span>
                </div>

                {/* Ítems agrupados */}
                <div className="space-y-2">
                  {esCocina.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 text-[11px] font-bold text-orange-600 mb-1">
                        <Flame size={11} /> Cocina
                      </p>
                      <div className="space-y-0.5">
                        {esCocina.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-text">
                            <span className="truncate">{item.producto?.nombre}</span>
                            <span className="text-text-muted flex-shrink-0 ml-2">×{item.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {esComplemento.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 text-[11px] font-bold text-green-600 mb-1">
                        <Salad size={11} /> Complementos
                      </p>
                      <div className="space-y-0.5">
                        {esComplemento.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-text">
                            <span className="truncate">{item.producto?.nombre}</span>
                            <span className="text-text-muted flex-shrink-0 ml-2">×{item.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm text-text-muted">Total</span>
                  <span className="font-bold text-text">S/ {Number(pedido.total ?? 0).toFixed(2)}</span>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2">
                  {esListo && (
                    <button
                      onClick={() => entregarMutation.mutate(pedido.id)}
                      disabled={entregarMutation.isPending}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={16} /> Marcar entregado
                    </button>
                  )}
                  <button
                    onClick={() => handleCobrar(pedido)}
                    disabled={!esEntregado}
                    className={cn(
                      'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
                      esEntregado
                        ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <CreditCard size={16} /> Cobrar
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/mesero/pedido', {
                        state: { mesaId: pedido.mesaId, mesaNumero: pedido.mesa?.numero, pedidoId: pedido.id }
                      })}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-border text-text-muted text-sm hover:bg-background active:scale-95 transition-all"
                    >
                      <PlusCircle size={14} /> Añadir
                    </button>
                    <button
                      onClick={() => setModalCancelar(pedido)}
                      className="p-2 rounded-xl border border-red-200 text-error hover:bg-red-50 active:scale-95 transition-all"
                      title="Cancelar pedido"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal cancelar */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
            <h3 className="font-semibold text-text text-lg mb-1">Cancelar pedido</h3>
            <p className="text-sm text-text-muted mb-6">
              ¿Estás seguro de cancelar{' '}
              <span className="font-semibold text-text">
                {modalCancelar.tipo === 'PARA_LLEVAR' ? 'Para llevar' : `Mesa ${modalCancelar.mesa?.numero}`}
              </span>
              {' · '}#{modalCancelar.numero}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalCancelar(null)}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted text-sm hover:bg-background transition-colors"
              >
                No, volver
              </button>
              <button
                onClick={() => {
                  cancelarMutation.mutate(modalCancelar.id);
                  setModalCancelar(null);
                }}
                disabled={cancelarMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 active:scale-95 transition-all"
              >
                {cancelarMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cobro */}
      {modalCobro && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
            <h3 className="font-semibold text-text text-lg mb-1">Cobrar pedido</h3>
            <p className="text-sm text-text-muted mb-4">
              {modalCobro.tipo === 'PARA_LLEVAR' ? 'Para llevar' : `Mesa ${modalCobro.mesa?.numero}`}
              {' · '}
              <span className="font-semibold text-text">S/ {Number(modalCobro.total ?? 0).toFixed(2)}</span>
            </p>

            <p className="text-sm font-medium text-text mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={cn(
                    'py-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95',
                    metodoPago === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-muted hover:border-primary/40'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalCobro(null)}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCobro}
                disabled={cobrarMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-95 transition-all"
              >
                {cobrarMutation.isPending ? 'Procesando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
