import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import type { DashboardDueno, Rol, Usuario } from '../../types';
import { formatCurrency } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { usuariosService } from '../../services/usuarios.service';

const ROLES_STAFF: Rol[] = ['ADMIN', 'MESERO', 'COCINERO'];

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-primary',
}: {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-text-muted">{label}</p>
        <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-text-muted">
      {message}
    </div>
  );
}

function EstadoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const nombres: string[] = item.sucursales ?? [];

  return (
    <div className="bg-white border border-border rounded-lg shadow-card p-3 max-w-xs">
      <p className="text-sm font-semibold text-text mb-2">
        {item.name}: {item.value}
      </p>

      {nombres.length === 0 ? (
        <p className="text-xs text-text-muted">Sin sucursales</p>
      ) : (
        <div className="space-y-1">
          {nombres.map((nombre) => (
            <p key={nombre} className="text-xs text-text-muted">
              {nombre}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function getUsuarioSucursalId(usuario: Usuario) {
  return usuario.sucursalId ?? usuario.sucursal?.id ?? '';
}

function esPersonalOperativo(usuario: Usuario) {
  return ROLES_STAFF.includes(usuario.rol);
}

function getPersonalActivoPorSucursal(usuarios: Usuario[], sucursalId: string) {
  return usuarios.filter(
    (usuario) =>
      usuario.activo &&
      getUsuarioSucursalId(usuario) === sucursalId &&
      esPersonalOperativo(usuario)
  ).length;
}

export default function DuenoDashboard({ data }: { data: DashboardDueno }) {
  const sucursales = data.sucursales ?? [];

  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.getAll(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const ventasHoy = sucursales.reduce(
    (total, sucursal) => total + sucursal.ventasHoy,
    0
  );

  const pedidosHoy = sucursales.reduce(
    (total, sucursal) => total + sucursal.pedidosHoy,
    0
  );

  const sucursalesAbiertas = sucursales.filter(
    (sucursal) => sucursal.abierto
  ).length;

  const sucursalesCerradas = sucursales.length - sucursalesAbiertas;

  const personalActivo = usuarios.filter(
    (usuario) =>
      usuario.activo &&
      getUsuarioSucursalId(usuario) &&
      esPersonalOperativo(usuario)
  ).length;

  const ventasPorSucursal = sucursales.map((sucursal) => ({
    nombre: sucursal.nombre,
    ventas: sucursal.ventasHoy,
  }));

  const sucursalesAbiertasLista = sucursales.filter((sucursal) => sucursal.abierto);
  const sucursalesCerradasLista = sucursales.filter((sucursal) => !sucursal.abierto);

  const estadoSucursales = [
    {
        name: 'Abiertas',
        value: sucursalesAbiertas,
        sucursales: sucursalesAbiertasLista.map((sucursal) => sucursal.nombre),
    },
    {
        name: 'Cerradas',
        value: sucursalesCerradas,
        sucursales: sucursalesCerradasLista.map((sucursal) => sucursal.nombre),
    },
  ];

  const haySucursales = sucursales.length > 0;
  const hayVentas = ventasPorSucursal.some((item) => item.ventas > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">
          Resumen general del negocio
        </h2>
        <p className="text-sm text-text-muted">
          Hoy · todas las sucursales
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Ventas hoy"
          value={formatCurrency(ventasHoy)}
          icon={TrendingUp}
        />

        <StatCard
          label="Pedidos hoy"
          value={pedidosHoy}
          icon={ShoppingBag}
        />

        <StatCard
          label="Sucursales abiertas"
          value={`${sucursalesAbiertas} / ${sucursales.length}`}
          icon={Building2}
        />

        <StatCard
          label="Personal activo"
          value={isLoadingUsuarios ? '...' : personalActivo}
          icon={Users}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text">Ventas por sucursal</h3>
            <p className="text-xs text-text-muted mt-1">
              Total vendido hoy por cada sucursal
            </p>
          </div>

          <div className="p-5">
            {!haySucursales ? (
              <EmptyChartMessage message="No hay sucursales registradas" />
            ) : !hayVentas ? (
              <EmptyChartMessage message="Aún no hay ventas registradas hoy" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorSucursal}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `S/ ${value}`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelStyle={{ color: '#111827' }}
                    />
                    <Bar
                      dataKey="ventas"
                      name="Ventas"
                      radius={[8, 8, 0, 0]}
                      fill="#16a34a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-text">Estado operativo</h3>
            <p className="text-xs text-text-muted mt-1">
              Sucursales abiertas y cerradas
            </p>
          </div>

          <div className="p-5">
            {!haySucursales ? (
              <EmptyChartMessage message="No hay sucursales registradas" />
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoSucursales}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip content={<EstadoTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-text-muted">Abiertas</span>
                    <span className="font-semibold text-text">
                      {sucursalesAbiertas}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-text-muted">Cerradas</span>
                    <span className="font-semibold text-text">
                      {sucursalesCerradas}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text">Estado de sucursales</h3>
          <p className="text-xs text-text-muted mt-1">
            Resumen operativo de cada sucursal durante el día
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr className="text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Sucursal</th>
                <th className="px-5 py-3 font-medium text-right">
                  Pedidos hoy
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  Ventas hoy
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  Personal activo
                </th>
                <th className="px-5 py-3 font-medium text-center">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {sucursales.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-text-muted"
                  >
                    No hay sucursales registradas
                  </td>
                </tr>
              ) : (
                sucursales.map((sucursal) => {
                  const personalSucursal = getPersonalActivoPorSucursal(
                    usuarios,
                    sucursal.id
                  );

                  return (
                    <tr key={sucursal.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-text">
                          {sucursal.nombre}
                        </p>
                        <p className="text-xs text-text-muted">
                          {sucursal.direccion || 'Sin dirección registrada'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right text-text-muted">
                        {sucursal.pedidosHoy}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-text">
                        {formatCurrency(sucursal.ventasHoy)}
                      </td>

                      <td className="px-5 py-4 text-right text-text-muted">
                        {isLoadingUsuarios ? '...' : personalSucursal}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge variant={sucursal.abierto ? 'success' : 'neutral'}>
                          {sucursal.abierto ? 'Abierto' : 'Cerrado'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}