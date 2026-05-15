import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, User, Pencil, CreditCard, ShoppingCart, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { mesasService } from '../../services/mesas.service';
import { pedidosService } from '../../services/pedidos.service';
import { menuService } from '../../services/menu.service';
import type { Mesa, Producto, Categoria } from '../../types';
import { cn, formatCurrency } from '../../utils/cn';
import toast from 'react-hot-toast';

function getTimerColor(t: number | null | undefined): React.CSSProperties {
  if (t == null) return {};
  if (t <= 10)  return { color: 'var(--color-error)' };
  if (t <= 20)  return { color: 'var(--color-warning)' };
  return { color: 'var(--color-success)' };
}

function getMesaBorder(m: Mesa) {
  if (m.estado === 'LIBRE')     return 'border-[#22D3EE]/40';
  if (m.estado === 'OCUPADA')   return 'border-[#F472B6]/60';
  if (m.estado === 'EN_ESPERA') return 'border-[#FBBF24]/60';
  return 'border-border';
}

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Yape / Plin', 'Transferencia'];

export default function MesasPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [showCreate, setShowCreate]   = useState(false);
  const [numero, setNumero]           = useState('');
  const [capacidad, setCapacidad]     = useState('4');
  const [editMesa, setEditMesa]       = useState<Mesa | null>(null);
  const [editNumero, setEditNumero]   = useState('');
  const [editCapacidad, setEditCapacidad] = useState('');
  const [pagoMesa, setPagoMesa]       = useState<Mesa | null>(null);
  const [metodoPago, setMetodoPago]   = useState('Efectivo');

  // Añadir items a pedido activo
  const [addMesa, setAddMesa]         = useState<Mesa | null>(null);
  const [catFiltro, setCatFiltro]     = useState('todas');
  const [carrito, setCarrito]         = useState<Record<string, number>>({});

  const { data: mesas = [], isLoading } = useQuery<Mesa[]>({
    queryKey: ['mesas'],
    queryFn: mesasService.getAll,
    refetchInterval: 60000,
  });
  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: menuService.getProductos,
    enabled: !!addMesa,
  });
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: menuService.getCategorias,
    enabled: !!addMesa,
  });

  const createMesa = useMutation({
    mutationFn: () => mesasService.create({ numero: parseInt(numero), capacidad: parseInt(capacidad) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mesas'] }); setShowCreate(false); toast.success('Mesa creada'); },
    onError: () => toast.error('Error al crear mesa'),
  });

  const updateMesaMut = useMutation({
    mutationFn: ({ id, numero, capacidad }: { id: string; numero: number; capacidad: number }) =>
      mesasService.update(id, { numero, capacidad }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mesas'] }); setEditMesa(null); toast.success('Mesa actualizada'); },
    onError: () => toast.error('Error al actualizar mesa'),
  });

  const entregar = useMutation({
    mutationFn: (pedidoId: string) => pedidosService.updateEstado(pedidoId, 'ENTREGADO'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mesas'] }); toast.success('Pedido entregado al cliente'); },
    onError: () => toast.error('Error al entregar pedido'),
  });

  const registrarPago = useMutation({
    mutationFn: ({ pedidoId, metodo }: { pedidoId: string; metodo: string }) =>
      pedidosService.registrarPago(pedidoId, metodo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mesas'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setPagoMesa(null);
      toast.success('¡Pago registrado! Mesa liberada');
    },
    onError: () => toast.error('Error al registrar pago'),
  });

  const addItems = useMutation({
    mutationFn: ({ pedidoId, items }: { pedidoId: string; items: { productoId: string; cantidad: number }[] }) =>
      pedidosService.addItems(pedidoId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mesas'] });
      qc.invalidateQueries({ queryKey: ['pedidosActivos'] });
      closeAddModal();
      toast.success('Productos añadidos al pedido');
    },
    onError: () => toast.error('Error al añadir productos'),
  });

  const openEdit = (mesa: Mesa) => { setEditMesa(mesa); setEditNumero(String(mesa.numero)); setEditCapacidad(String(mesa.capacidad)); };
  const openPago = (mesa: Mesa) => { setPagoMesa(mesa); setMetodoPago('Efectivo'); };
  const openAdd  = (mesa: Mesa) => { setAddMesa(mesa); setCarrito({}); setCatFiltro('todas'); };
  const closeAddModal = () => { setAddMesa(null); setCarrito({}); };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCarrito((prev) => {
      const actual = prev[productoId] ?? 0;
      const nuevo = Math.max(0, actual + delta);
      if (nuevo === 0) { const { [productoId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productoId]: nuevo };
    });
  };

  const totalCarrito = Object.entries(carrito).reduce((sum, [id, qty]) => {
    const p = productos.find((x) => x.id === id);
    return sum + (p ? Number(p.precio) * qty : 0);
  }, 0);
  const itemsCarrito = Object.keys(carrito).length;

  const prodVisibles = productos.filter((p) =>
    p.disponible && (catFiltro === 'todas' || p.categoriaId === catFiltro)
  );

  const libres   = mesas.filter((m) => m.estado === 'LIBRE').length;
  const ocupadas = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const enEspera = mesas.filter((m) => m.estado === 'EN_ESPERA').length;

  if (isLoading) {
    return <div className="grid grid-cols-5 gap-4">{[...Array(10)].map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-success" />
            <span className="text-foreground font-medium">○ {libres} Libres</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-error" />
            <span className="text-foreground font-medium">● {ocupadas} Ocupadas</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-warning" />
            <span className="text-foreground font-medium">◔ {enEspera} En espera</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/mesero')} title="Vista para celular">
            <Smartphone size={14} /> Vista Mesero
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nueva Mesa
          </Button>
        </div>
      </div>

      {/* Mesa Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mesas.map((mesa) => (
          <div key={mesa.id} className={cn('bg-card border-2 rounded-xl p-4 flex flex-col gap-3 transition-all', getMesaBorder(mesa))}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">Mesa {mesa.numero}</span>
              <div className="flex items-center gap-1.5">
                <StatusBadge variant={mesa.estado.toLowerCase()} />
                <button onClick={() => openEdit(mesa)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={`Editar mesa ${mesa.numero}`}>
                  <Pencil size={12} />
                </button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">{mesa.capacidad} personas</div>

            {mesa.estado === 'OCUPADA' && (
              <div className="space-y-1">
                {mesa.mesero && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User size={12} /> {mesa.mesero}
                  </div>
                )}
                {mesa.timerRestante != null && (
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={getTimerColor(mesa.timerRestante)}>
                    <Clock size={12} />
                    {mesa.timerRestante <= 0 ? 'TIEMPO AGOTADO' : `${mesa.timerRestante} min restantes`}
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto space-y-1.5">
              {mesa.estado === 'LIBRE' ? (
                <Button size="sm" className="w-full" onClick={() => navigate(`/pedidos/nuevo?mesaId=${mesa.id}`)}>
                  Asignar Pedido
                </Button>
              ) : mesa.pedidoActivo?.estado === 'LISTO' ? (
                <>
                  <div className="text-xs text-center font-semibold text-success py-0.5">✓ Listo para servir</div>
                  <Button size="sm" className="w-full" loading={entregar.isPending}
                    onClick={() => entregar.mutate(mesa.pedidoActivo!.id)}>
                    Entregar al cliente
                  </Button>
                  <button onClick={() => openAdd(mesa)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 hover:bg-muted rounded-lg transition-colors">
                    <Plus size={10} /> Añadir productos
                  </button>
                </>
              ) : mesa.pedidoActivo?.estado === 'ENTREGADO' ? (
                <>
                  <div className="text-xs text-center font-medium text-info py-0.5">Entregado — esperando pago</div>
                  <Button size="sm" variant="secondary" className="w-full border-success/50 text-success hover:bg-success/10"
                    onClick={() => openPago(mesa)}>
                    <CreditCard size={13} /> Cliente pagó
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-xs text-center text-muted-foreground py-0.5">
                    {mesa.pedidoActivo?.estado === 'EN_COCINA' ? '🍳 En cocina...' :
                     mesa.pedidoActivo?.estado === 'EN_PREPARACION' ? '👨‍🍳 Preparando...' : 'Ocupada'}
                  </div>
                  {mesa.pedidoActivo && (
                    <button onClick={() => openAdd(mesa)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1.5 hover:bg-muted rounded-lg transition-colors border border-border">
                      <ShoppingCart size={11} /> Añadir productos
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal Nueva Mesa ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Mesa">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Número de mesa</label>
            <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: 13" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Capacidad (personas)</label>
            <input type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button className="flex-1" loading={createMesa.isPending} onClick={() => createMesa.mutate()}>Crear Mesa</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Editar Mesa ── */}
      <Modal open={!!editMesa} onClose={() => setEditMesa(null)} title={`Editar Mesa ${editMesa?.numero}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Número de mesa</label>
            <input type="number" value={editNumero} onChange={(e) => setEditNumero(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Capacidad (personas)</label>
            <input type="number" value={editCapacidad} onChange={(e) => setEditCapacidad(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditMesa(null)}>Cancelar</Button>
            <Button className="flex-1" loading={updateMesaMut.isPending}
              onClick={() => editMesa && updateMesaMut.mutate({ id: editMesa.id, numero: parseInt(editNumero), capacidad: parseInt(editCapacidad) })}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Registrar Pago ── */}
      <Modal open={!!pagoMesa} onClose={() => setPagoMesa(null)} title={`Pago — Mesa ${pagoMesa?.numero}`}>
        <div className="space-y-4">
          {pagoMesa?.pedidoActivo && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-sm text-muted-foreground mb-1">Total a cobrar</p>
              <p className="text-2xl font-bold text-foreground">S/ {Number(pagoMesa.pedidoActivo.total ?? 0).toFixed(2)}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {METODOS_PAGO.map((m) => (
                <button key={m} onClick={() => setMetodoPago(m)}
                  className={cn('px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors',
                    metodoPago === m ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:text-foreground')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPagoMesa(null)}>Cancelar</Button>
            <Button className="flex-1" loading={registrarPago.isPending}
              onClick={() => pagoMesa?.pedidoActivo && registrarPago.mutate({ pedidoId: pagoMesa.pedidoActivo.id, metodo: metodoPago })}>
              Confirmar pago
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Añadir productos a pedido activo ── */}
      <Modal open={!!addMesa} onClose={closeAddModal} title={`Añadir a Mesa ${addMesa?.numero}`}>
        <div className="space-y-3">
          {/* Filtro categoría */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCatFiltro('todas')}
              className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors',
                catFiltro === 'todas' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              Todos
            </button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCatFiltro(c.id)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  catFiltro === c.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                {c.nombre}
              </button>
            ))}
          </div>

          {/* Lista de productos */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {prodVisibles.map((prod) => {
              const qty = carrito[prod.id] ?? 0;
              return (
                <div key={prod.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-2">
                  {prod.imagen ? (
                    <img src={prod.imagen} alt={prod.nombre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{prod.nombre}</p>
                    <p className="text-xs text-primary font-semibold">{formatCurrency(Number(prod.precio))}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => cambiarCantidad(prod.id, -1)}
                      className="w-7 h-7 rounded-full bg-muted hover:bg-error/20 text-foreground font-bold flex items-center justify-center transition-colors">
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-foreground">{qty}</span>
                    <button onClick={() => cambiarCantidad(prod.id, 1)}
                      className="w-7 h-7 rounded-full bg-muted hover:bg-success/20 text-foreground font-bold flex items-center justify-center transition-colors">
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen carrito */}
          {itemsCarrito > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-foreground">{itemsCarrito} producto{itemsCarrito > 1 ? 's' : ''} seleccionados</span>
              <span className="font-bold text-primary">{formatCurrency(totalCarrito)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={closeAddModal}>Cancelar</Button>
            <Button className="flex-1" loading={addItems.isPending} disabled={itemsCarrito === 0}
              onClick={() => addMesa?.pedidoActivo && addItems.mutate({
                pedidoId: addMesa.pedidoActivo.id,
                items: Object.entries(carrito).map(([productoId, cantidad]) => ({ productoId, cantidad })),
              })}>
              <ShoppingCart size={14} /> Añadir al pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
