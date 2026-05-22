export type Rol = 'DUENO' | 'ADMIN' | 'MESERO' | 'COCINERO';
export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'RESERVADA';
export type EstadoPedido = 'PENDIENTE' | 'EN_COCINA' | 'LISTO' | 'ENTREGADO' | 'PAGADO' | 'CANCELADO';
export type TipoPedido = 'EN_MESA' | 'PARA_LLEVAR';
export type TipoProducto = 'COCINA' | 'COMPLEMENTO';

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  logo?: string;
  abierto: boolean;
  horarioApertura?: string;
  horarioCierre?: string;
  diasOperacion?: string;
  duenoId: string;
  creadoEn: string;
  actualizadoEn?: string;
  _count?: {
    usuarios?: number;
    mesas?: number;
    productos?: number;
    pedidos?: number;
  };
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  sucursalId?: string;
  sucursal?: { id: string; nombre: string };
  creadoEn: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  sucursalId?: string;
  sucursal?: { id: string; nombre: string };
  asistencia ?: boolean;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  sucursalId: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  sucursalId: string;
  _count?: { productos: number };
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
  disponible: boolean;
  requiereCocina: boolean;
  tipo: TipoProducto;
  categoriaId: string;
  sucursalId: string;
  categoria?: Categoria;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  servido: boolean;
  enviadoACocina: boolean;
  producto?: Producto;
}

export interface Pedido {
  id: string;
  numero: number;
  tipo: TipoPedido;
  estado: EstadoPedido;
  mesaId?: string;
  mesa?: Mesa;
  meseroId?: string;
  sucursalId: string;
  items: ItemPedido[];
  pagado: boolean;
  metodoPago?: string;
  total?: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface DashboardDueno {
  sucursales: (Sucursal & {
    ventasHoy: number;
    pedidosHoy: number;
    mesasOcupadas: number;
  })[];
}

export interface DashboardSucursal {
  ventasHoy: number;
  pedidosHoy: number;
  mesasOcupadas: number;
  totalMesas: number;
  pedidosActivos: any[];
  topProductos?: {
    id: string;
    nombre: string;
    cantidad: number;
    total: number;
  }[];
}

export interface ReporteSucursalFiltro {
  id: string;
  nombre: string;
}

export interface ReporteMetodoPago {
  metodoPago: string;
  total: number;
  pedidos: number;
}

export interface ReporteTopProducto {
  productoId: string;
  producto: string;
  cantidad: number;
  total: number;
}

export interface ReporteSucursalVentas {
  sucursalId: string;
  sucursal: string;
  total: number;
  pedidos: number;
}

export interface ReporteVentaDia {
  fecha: string;
  total: number;
  pedidos: number;
}

export interface ReporteDetallePedido {
  id: string;
  numero: number;
  fecha: string;
  sucursal: string;
  mesero: string;
  metodoPago: string | null;
  total: number;
}

export interface ReporteDueno {
  filtros: {
    desde: string;
    hasta: string;
    sucursales: ReporteSucursalFiltro[];
  };
  resumen: {
    ventasTotales: number;
    pedidosPagados: number;
    ticketPromedio: number;
    productoMasVendido: ReporteTopProducto | null;
    sucursalLider: {
      id: string;
      nombre: string;
      total: number;
    } | null;
  };
  ventasPorDia: ReporteVentaDia[];
  ventasPorSucursal: ReporteSucursalVentas[];
  ventasPorMetodoPago: ReporteMetodoPago[];
  topProductos: ReporteTopProducto[];
  detallePedidos: ReporteDetallePedido[];
}
