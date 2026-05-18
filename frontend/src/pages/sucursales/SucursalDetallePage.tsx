import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Users,
  Package,
  UserCircle,
  Pencil,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { sucursalesService } from '../../services/sucursales.service';
import { usuariosService } from '../../services/usuarios.service';
import type { Rol } from '../../types';

const ROL_LABELS: Record<Rol, string> = {
  DUENO: 'Dueño',
  ADMIN: 'Administrador',
  MESERO: 'Mesero',
  COCINERO: 'Cocinero',
};

const ROL_VARIANTS: Record<Rol, 'success' | 'warning' | 'info' | 'neutral'> = {
  DUENO: 'neutral',
  ADMIN: 'success',
  MESERO: 'info',
  COCINERO: 'warning',
};

const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SucursalDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: sucursal, isLoading } = useQuery({
    queryKey: ['sucursal', id],
    queryFn: () => sucursalesService.getById(id!),
    enabled: Boolean(id),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios', 'detalle-sucursal', id],
    queryFn: () => usuariosService.getAll(),
    enabled: Boolean(id),
  });

  const staffSucursal = useMemo(() => {
    return usuarios.filter((usuario) => {
      const usuarioSucursalId = usuario.sucursalId ?? usuario.sucursal?.id;
      return usuarioSucursalId === id;
    });
  }, [usuarios, id]);

  const administradores = useMemo(() => {
    return staffSucursal.filter((usuario) => usuario.rol === 'ADMIN');
  }, [staffSucursal]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Cargando información de la sucursal...</p>
      </div>
    );
  }

  if (!sucursal) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-card p-6 text-center">
        <p className="font-semibold text-text">Sucursal no encontrada</p>
        <p className="text-sm text-text-muted mt-1">
          No se pudo cargar la información de esta sucursal.
        </p>
        <Button className="mt-4" onClick={() => navigate('/sucursales')}>
          Volver a sucursales
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/sucursales')}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a sucursales
      </button>

      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Building2 size={28} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-text">{sucursal.nombre}</h1>
                <Badge variant={sucursal.abierto ? 'success' : 'neutral'}>
                  {sucursal.abierto ? 'Abierto' : 'Cerrado'}
                </Badge>
              </div>

              <p className="text-sm text-text-muted mt-1">
                Información general y operativa de la sucursal.
              </p>

              <div className="flex flex-wrap gap-3 mt-4 text-sm text-text-muted">
                {sucursal.direccion && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {sucursal.direccion}
                  </span>
                )}

                {sucursal.telefono && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} />
                    {sucursal.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              // Por ahora volvemos a la lista.
              // Luego podemos abrir aquí el modal de edición.
              navigate('/sucursales');
            }}
          >
            <Pencil size={16} />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Staff total</p>
              <p className="text-2xl font-bold text-text mt-1">{staffSucursal.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Pedidos registrados</p>
              <p className="text-2xl font-bold text-text mt-1">
                {sucursal._count?.pedidos ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-primary flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Productos</p>
              <p className="text-2xl font-bold text-text mt-1">
                {sucursal._count?.productos ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-text mb-4">Información de sucursal</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Nombre</span>
              <span className="font-medium text-text text-right">{sucursal.nombre}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Dirección</span>
              <span className="font-medium text-text text-right">
                {sucursal.direccion || 'Sin dirección'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Teléfono</span>
              <span className="font-medium text-text text-right">
                {sucursal.telefono || 'Sin teléfono'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Administrador</span>
              <span className="font-medium text-text text-right">
                {administradores.length === 0
                  ? 'Sin administrador'
                  : administradores.length === 1
                    ? administradores[0].nombre
                    : `${administradores.length} administradores`}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Creado en</span>
              <span className="font-medium text-text text-right">
                {formatDate(sucursal.creadoEn)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Actualizado en</span>
              <span className="font-medium text-text text-right">
                {formatDate(sucursal.actualizadoEn)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-text mb-4">Horario de operación</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border p-4">
              <Clock size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-text">
                  {sucursal.horarioApertura || '--:--'} - {sucursal.horarioCierre || '--:--'}
                </p>
                <p className="text-xs text-text-muted">Horario de atención</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border p-4">
              <CalendarDays size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-text">
                  {sucursal.diasOperacion || 'Sin días configurados'}
                </p>
                <p className="text-xs text-text-muted">Días de operación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-text">Miembros de la sucursal</h2>
          <p className="text-sm text-text-muted mt-1">
            Personal asignado a esta sucursal. Esta sección es solo informativa.
          </p>
        </div>

        {staffSucursal.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-text">No hay personal asignado</p>
            <p className="text-sm text-text-muted mt-1">
              Esta sucursal aún no tiene usuarios vinculados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staffSucursal.map((usuario) => (
              <div key={usuario.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <UserCircle size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-text truncate">{usuario.nombre}</p>
                    <p className="text-sm text-text-muted truncate">{usuario.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={ROL_VARIANTS[usuario.rol]}>
                    {ROL_LABELS[usuario.rol]}
                  </Badge>

                  <Badge variant={usuario.activo ? 'success' : 'neutral'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}