import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, Flame, Salad, Plus, Minus, X, ShoppingBag } from 'lucide-react';
import { productosService } from '../../services/productos.service';
import { pedidosService } from '../../services/pedidos.service';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Producto, TipoPedido } from '../../types';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface ItemOrden {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: 'COCINA' | 'COMPLEMENTO';
}

interface LocationState {
  mesaId?: string;
  mesaNumero?: number;
  pedidoId?: string;
  tipo?: TipoPedido;
}

export default function PedidoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isMobile = useIsMobile();

  const esEdicion = !!state.pedidoId;
  const tipoPedido: TipoPedido = state.tipo ?? 'EN_MESA';

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [orden, setOrden] = useState<ItemOrden[]>([]);
  const [mostrarOrden, setMostrarOrden] = useState(false);

  const sucursalId = user?.sucursalId;

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', sucursalId],
    queryFn: () => productosService.getCategorias(sucursalId),
  });

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos', sucursalId],
    queryFn: () => productosService.getAll(sucursalId),
  });

  const productosFiltrados = useMemo(() => {
    let lista = productos.filter((p) => p.disponible);
    if (categoriaSeleccionada !== 'todos') {
      lista = lista.filter((p) => p.categoriaId === categoriaSeleccionada);
    }
    return lista;
  }, [productos, categoriaSeleccionada]);

  const agregarProducto = (p: Producto) => {
    setOrden((prev) => {
      const existe = prev.find((i) => i.productoId === p.id);
      if (existe) {
        return prev.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad: 1, tipo: p.tipo }];
    });
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setOrden((prev) =>
      prev
        .map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    );
  };

  const total = orden.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalItems = orden.reduce((acc, i) => acc + i.cantidad, 0);

  const crearMutation = useMutation({
    mutationFn: () => pedidosService.crear({
      mesaId: state.mesaId,
      tipo: tipoPedido,
      items: orden.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
      qc.invalidateQueries({ queryKey: ['mesas-mesero'] });
      toast.success('Pedido creado');
      navigate('/mesero/mesas');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error al crear pedido'),
  });

  const agregarMutation = useMutation({
    mutationFn: () => pedidosService.agregarItems(
      state.pedidoId!,
      orden.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-activos'] });
      toast.success('Ítems agregados al pedido');
      navigate('/mesero/pedidos');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error al agregar ítems'),
  });

  const handleConfirmar = () => {
    if (orden.length === 0) { toast.error('Agrega al menos un producto'); return; }
    esEdicion ? agregarMutation.mutate() : crearMutation.mutate();
  };

  const isPending = crearMutation.isPending || agregarMutation.isPending;

  const titulo = esEdicion
    ? `Añadir a pedido${state.mesaNumero ? ` · Mesa ${state.mesaNumero}` : ''}`
    : tipoPedido === 'PARA_LLEVAR'
      ? 'Nuevo pedido · Para llevar'
      : `Nuevo pedido${state.mesaNumero ? ` · Mesa ${state.mesaNumero}` : ''}`;

  const OrdenPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <ShoppingCart size={16} />
          Orden de compra
        </h3>
        {orden.length > 0 && (
          <button onClick={() => setOrden([])} className="text-xs text-error hover:underline">
            Limpiar
          </button>
        )}
      </div>

      {orden.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm text-center px-4">
          Agrega productos para comenzar el pedido
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {orden.map((item) => (
            <div key={item.productoId} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{item.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.tipo === 'COCINA' ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                      <Flame size={9} /> Cocina
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      <Salad size={9} /> Complemento
                    </span>
                  )}
                  <span className="text-xs text-text-muted">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => cambiarCantidad(item.productoId, -1)} className="w-6 h-6 rounded-full bg-background flex items-center justify-center hover:bg-border transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.productoId, 1)} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-primary">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3 mt-3 space-y-3">
        <div className="flex items-center justify-between font-semibold text-text">
          <span>Total</span>
          <span className="text-primary">S/ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleConfirmar}
          disabled={orden.length === 0 || isPending}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          {isPending ? 'Enviando...' : esEdicion ? 'Agregar al pedido' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-background transition-colors">
          <ArrowLeft size={18} className="text-text-muted" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-text truncate">{titulo}</h2>
        </div>
        {tipoPedido === 'PARA_LLEVAR' && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            <ShoppingBag size={12} /> Para llevar
          </span>
        )}
      </div>

      {isMobile ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <button
              onClick={() => setCategoriaSeleccionada('todos')}
              className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                categoriaSeleccionada === 'todos' ? 'bg-primary text-white' : 'bg-background text-text-muted hover:text-text')}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  categoriaSeleccionada === cat.id ? 'bg-primary text-white' : 'bg-background text-text-muted hover:text-text')}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl border border-border h-32 animate-pulse bg-white" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-28">
                {productosFiltrados.map((p) => (
                  <ProductoCard key={p.id} producto={p} onAgregar={agregarProducto} />
                ))}
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-border shadow-lg">
            {totalItems > 0 ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMostrarOrden(true)}
                  className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm"
                >
                  <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">{totalItems}</span>
                  <span>Ver orden</span>
                  <span>S/ {total.toFixed(2)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-xl border border-border text-text-muted text-sm"
              >
                Cancelar
              </button>
            )}
          </div>

          {mostrarOrden && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMostrarOrden(false)} />
              <div className="relative bg-white rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text">Resumen del pedido</span>
                  <button onClick={() => setMostrarOrden(false)} className="p-1 rounded-lg hover:bg-background">
                    <X size={18} className="text-text-muted" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <OrdenPanel />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 flex-wrap mb-3">
              <button
                onClick={() => setCategoriaSeleccionada('todos')}
                className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  categoriaSeleccionada === 'todos' ? 'bg-primary text-white' : 'bg-background text-text-muted hover:text-text')}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    categoriaSeleccionada === cat.id ? 'bg-primary text-white' : 'bg-background text-text-muted hover:text-text')}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(9)].map((_, i) => <div key={i} className="rounded-xl border border-border h-36 animate-pulse bg-white" />)}
                </div>
              ) : productosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-sm">
                  No hay productos disponibles en esta categoría
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {productosFiltrados.map((p) => (
                    <ProductoCard key={p.id} producto={p} onAgregar={agregarProducto} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-border p-4 flex flex-col">
            <OrdenPanel />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductoCard({ producto, onAgregar }: { producto: Producto; onAgregar: (p: Producto) => void }) {
  const esCocina = producto.tipo === 'COCINA';

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col">
      <div className="bg-gray-100 h-20 flex items-center justify-center flex-shrink-0 relative">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300 text-2xl">🍽️</div>
        )}
        <span className={cn(
          'absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          esCocina ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
        )}>
          {esCocina ? <><Flame size={9} /> Cocina</> : <><Salad size={9} /> Compl.</>}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-text leading-tight line-clamp-2">{producto.nombre}</p>
          <p className="text-sm font-bold text-primary mt-0.5">S/ {Number(producto.precio).toFixed(2)}</p>
        </div>
        <button
          onClick={() => onAgregar(producto)}
          className={cn(
            'w-full py-2 rounded-lg text-white text-xs font-bold transition-all active:scale-95',
            esCocina ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'
          )}
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}
