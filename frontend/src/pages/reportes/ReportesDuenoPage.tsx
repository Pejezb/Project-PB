import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Crown,
  Download,
  Package,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
} from 'lucide-react';
import { reportesService } from '../../services/reportes.service';
import { formatCurrency, formatDate } from '../../utils/cn';

type FiltroRapido = 'HOY' | 'AYER' | 'SEMANA' | 'MES' | 'PERSONALIZADO';

function toInputDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatInputDateLabel(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return '';

  const text = String(value).replace(/"/g, '""');

  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text}"`;
  }

  return text;
}

function createCsvSection(title: string, rows: unknown[][]) {
  const section = [
    [title],
    ...rows,
    [],
  ];

  return section
    .map((row) => row.map(escapeCsvValue).join(';'))
    .join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getRangoInicial() {
  const hoy = new Date();
  const desde = new Date();
  desde.setDate(hoy.getDate() - 6);

  return {
    desde: toInputDate(desde),
    hasta: toInputDate(hoy),
  };
}

function getRangoPorFiltro(filtro: FiltroRapido) {
  const hoy = new Date();

  if (filtro === 'HOY') {
    const fecha = toInputDate(hoy);
    return { desde: fecha, hasta: fecha };
  }

  if (filtro === 'AYER') {
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    const fecha = toInputDate(ayer);
    return { desde: fecha, hasta: fecha };
  }

  if (filtro === 'SEMANA') {
    const desde = new Date();
    desde.setDate(hoy.getDate() - 6);
    return { desde: toInputDate(desde), hasta: toInputDate(hoy) };
  }

  if (filtro === 'MES') {
    const desde = new Date();
    desde.setDate(hoy.getDate() - 29);
    return { desde: toInputDate(desde), hasta: toInputDate(hoy) };
  }

  return getRangoInicial();
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string | number;
  icon: any;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="text-2xl font-bold text-text mt-2">{value}</p>
          {description && (
            <p className="text-xs text-text-muted mt-1">{description}</p>
          )}
        </div>

        <div className="p-2 rounded-lg bg-gray-50 text-primary">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-text-muted">
      {message}
    </div>
  );
}

export default function ReportesDuenoPage() {
  const rangoInicial = useMemo(() => getRangoInicial(), []);

  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('SEMANA');
  const [desde, setDesde] = useState(rangoInicial.desde);
  const [hasta, setHasta] = useState(rangoInicial.hasta);
  const [sucursalId, setSucursalId] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reportes-dueno', desde, hasta, sucursalId],
    queryFn: () =>
      reportesService.getDueno({
        desde,
        hasta,
        sucursalId: sucursalId || undefined,
      }),
    enabled: !!desde && !!hasta,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const aplicarFiltroRapido = (filtro: Exclude<FiltroRapido, 'PERSONALIZADO'>) => {
    const rango = getRangoPorFiltro(filtro);
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setFiltroRapido(filtro);
  };

  const restablecerFiltros = () => {
    const rango = getRangoPorFiltro('SEMANA');
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setSucursalId('');
    setFiltroRapido('SEMANA');
  };

  const ventasPorDia = data?.ventasPorDia ?? [];
  const ventasPorSucursal = data?.ventasPorSucursal ?? [];
  const ventasPorMetodoPago = data?.ventasPorMetodoPago ?? [];
  const topProductos = data?.topProductos ?? [];
  const detallePedidos = data?.detallePedidos ?? [];
  const sucursales = data?.filtros.sucursales ?? [];

  const productoMasVendido = data?.resumen.productoMasVendido;
  const sucursalLider = data?.resumen.sucursalLider;

  const sucursalSeleccionada = sucursales.find(
    (sucursal) => sucursal.id === sucursalId
  );

  const periodoTexto =
    desde && hasta
      ? `Periodo: ${formatInputDateLabel(desde)} - ${formatInputDateLabel(hasta)}`
      : 'Periodo no seleccionado';

  const sucursalTexto = sucursalSeleccionada
    ? sucursalSeleccionada.nombre
    : 'Todas las sucursales';


  const exportarReporteCsv = () => {
    if (!data) return;

    const resumenRows = [
      ['Campo', 'Valor'],
      ['Periodo desde', formatInputDateLabel(desde)],
      ['Periodo hasta', formatInputDateLabel(hasta)],
      ['Sucursal', sucursalTexto],
      ['Ventas totales', data.resumen.ventasTotales],
      ['Pedidos pagados', data.resumen.pedidosPagados],
      ['Ticket promedio', data.resumen.ticketPromedio],
      [
        'Producto más vendido',
        data.resumen.productoMasVendido?.producto ?? 'Sin ventas',
      ],
      [
        'Sucursal líder',
        data.resumen.sucursalLider?.nombre ?? 'Sin ventas',
      ],
    ];

    const ventasPorDiaRows = [
      ['Fecha', 'Pedidos', 'Total'],
      ...ventasPorDia.map((item) => [
        item.fecha,
        item.pedidos,
        item.total,
      ]),
    ];

    const ventasPorSucursalRows = [
      ['Sucursal', 'Pedidos', 'Total'],
      ...ventasPorSucursal.map((item) => [
        item.sucursal,
        item.pedidos,
        item.total,
      ]),
    ];

    const metodosPagoRows = [
      ['Método de pago', 'Pedidos', 'Total'],
      ...ventasPorMetodoPago.map((item) => [
        item.metodoPago,
        item.pedidos,
        item.total,
      ]),
    ];

    const productosRows = [
      ['Producto', 'Cantidad', 'Total'],
      ...topProductos.map((item) => [
        item.producto,
        item.cantidad,
        item.total,
      ]),
    ];

    const detallePedidosRows = [
      ['Pedido', 'Fecha', 'Sucursal', 'Mesero', 'Método de pago', 'Total'],
      ...detallePedidos.map((pedido) => [
        `#${pedido.numero}`,
        formatDate(pedido.fecha),
        pedido.sucursal,
        pedido.mesero,
        pedido.metodoPago || 'No registrado',
        pedido.total,
      ]),
    ];

    const csv = [
      createCsvSection('REPORTE GENERAL DEL NEGOCIO', resumenRows),
      createCsvSection('VENTAS POR DÍA', ventasPorDiaRows),
      createCsvSection('VENTAS POR SUCURSAL', ventasPorSucursalRows),
      createCsvSection('VENTAS POR MÉTODO DE PAGO', metodosPagoRows),
      createCsvSection('PRODUCTOS MÁS VENDIDOS', productosRows),
      createCsvSection('DETALLE DE PEDIDOS', detallePedidosRows),
    ].join('\n');

    const filename = `reporte-dueno-${desde}-a-${hasta}.csv`;

    downloadCsv(filename, csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div>
          <h2 className="text-lg font-semibold text-text">Reportes</h2>
          <p className="text-sm text-text-muted">
            Análisis detallado de ventas, pedidos y rendimiento del negocio
          </p>
          <p className="text-xs text-text-muted mt-1">
            {periodoTexto} · {sucursalTexto}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card p-4 w-full xl:max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[
              { key: 'HOY', label: 'Hoy' },
              { key: 'AYER', label: 'Ayer' },
              { key: 'SEMANA', label: 'Últimos 7 días' },
              { key: 'MES', label: 'Últimos 30 días' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  aplicarFiltroRapido(item.key as Exclude<FiltroRapido, 'PERSONALIZADO'>)
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filtroRapido === item.key
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-text-muted border-border hover:bg-background'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={restablecerFiltros}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-background transition-colors"
            >
              <RefreshCcw size={15} />
              Restablecer
            </button>

            <button
              type="button"
              onClick={exportarReporteCsv}
              disabled={!data}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-green-700 text-green-700 hover:bg-green-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-700"
            >
              <Download size={15} />
              Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="reporte-desde" className="block text-xs font-medium text-text-muted mb-1">
                Desde
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="date"
                  id="reporte-desde"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDesde(value);
                    if (hasta && value > hasta) setHasta(value);
                    setFiltroRapido('PERSONALIZADO');
                  }}
                  className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reporte-hasta" className="block text-xs font-medium text-text-muted mb-1">
                Hasta
              </label>
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="date"
                  id="reporte-hasta"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (desde && value < desde) return;
                    setHasta(value);
                    setFiltroRapido('PERSONALIZADO');
                  }}
                  className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reporte-sucursal" className="block text-xs font-medium text-text-muted mb-1">
                Sucursal
              </label>
              <select
                id="reporte-sucursal"
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isFetching && !isLoading && (
            <p className="text-xs text-text-muted mt-3">Actualizando reporte...</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="bg-white rounded-xl border border-border p-5 shadow-card h-28 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              label="Ventas totales"
              value={formatCurrency(data?.resumen.ventasTotales ?? 0)}
              icon={TrendingUp}
              description="Pedidos pagados del periodo"
            />

            <StatCard
              label="Pedidos pagados"
              value={data?.resumen.pedidosPagados ?? 0}
              icon={ClipboardList}
              description="No incluye cancelados"
            />

            <StatCard
              label="Ticket promedio"
              value={formatCurrency(data?.resumen.ticketPromedio ?? 0)}
              icon={ReceiptText}
              description="Promedio por pedido pagado"
            />

            <StatCard
              label="Producto más vendido"
              value={productoMasVendido?.producto ?? 'Sin ventas'}
              icon={Package}
              description={
                productoMasVendido
                  ? `${productoMasVendido.cantidad} unidades vendidas`
                  : 'Sin productos vendidos'
              }
            />

            <StatCard
              label="Sucursal líder"
              value={sucursalLider?.nombre ?? 'Sin ventas'}
              icon={Crown}
              description={
                sucursalLider
                  ? formatCurrency(sucursalLider.total)
                  : 'Sin ventas registradas'
              }
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text">Ventas por día</h3>
                <p className="text-xs text-text-muted mt-1">
                  Ventas pagadas agrupadas por fecha
                </p>
              </div>

              <div className="p-5">
                {ventasPorDia.length === 0 ||
                ventasPorDia.every((item) => item.total === 0) ? (
                  <EmptyState message="No hay ventas registradas en el periodo" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasPorDia}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => String(value).slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `S/ ${value}`}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Bar
                          dataKey="total"
                          name="Ventas"
                          fill="#16a34a"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text">Ventas por sucursal</h3>
                <p className="text-xs text-text-muted mt-1">
                  Comparación de ventas pagadas entre sucursales
                </p>
              </div>

              <div className="p-5">
                {ventasPorSucursal.length === 0 ? (
                  <EmptyState message="No hay ventas por sucursal en el periodo" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasPorSucursal}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="sucursal"
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
                        />
                        <Bar
                          dataKey="total"
                          name="Ventas"
                          fill="#2563eb"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text">Productos más vendidos</h3>
                <p className="text-xs text-text-muted mt-1">
                  Ranking por cantidad vendida
                </p>
              </div>

              <div className="p-5">
                {topProductos.length === 0 ? (
                  <EmptyState message="No hay productos vendidos en el periodo" />
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topProductos}
                        layout="vertical"
                        margin={{ left: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="producto"
                          tick={{ fontSize: 12 }}
                          width={130}
                        />
                        <Tooltip
                          formatter={(value, name) =>
                            name === 'Cantidad'
                              ? [`${value} unidades`, name]
                              : [formatCurrency(Number(value)), name]
                          }
                        />
                        <Bar
                          dataKey="cantidad"
                          name="Cantidad"
                          fill="#f97316"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text">Top productos</h3>
                <p className="text-xs text-text-muted mt-1">
                  Cantidad y ventas generadas
                </p>
              </div>

              <div className="divide-y divide-border">
                {topProductos.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-text-muted">
                    Sin productos vendidos
                  </p>
                ) : (
                  topProductos.slice(0, 5).map((producto, index) => (
                    <div
                      key={producto.productoId}
                      className="px-5 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-text-muted w-6">
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-text truncate">
                            {producto.producto}
                          </p>
                          <p className="text-xs text-text-muted">
                            {producto.cantidad} unidades
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-text">
                        {formatCurrency(producto.total)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-text">Ventas por método de pago</h3>
              <p className="text-xs text-text-muted mt-1">
                Distribución de ventas pagadas según el método registrado
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr className="text-left text-text-muted">
                    <th className="px-5 py-3 font-medium">Método de pago</th>
                    <th className="px-5 py-3 font-medium text-right">Pedidos</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {ventasPorMetodoPago.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-center text-text-muted"
                      >
                        No hay métodos de pago registrados en el periodo
                      </td>
                    </tr>
                  ) : (
                    ventasPorMetodoPago.map((item) => (
                      <tr key={item.metodoPago} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-text">
                          {item.metodoPago}
                        </td>
                        <td className="px-5 py-4 text-right text-text-muted">
                          {item.pedidos}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-text">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-text">Detalle de pedidos</h3>
                <p className="text-xs text-text-muted mt-1">
                  Últimos pedidos pagados dentro del periodo seleccionado
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <BarChart3 size={15} />
                {detallePedidos.length} registros
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr className="text-left text-text-muted">
                    <th className="px-5 py-3 font-medium">Pedido</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Sucursal</th>
                    <th className="px-5 py-3 font-medium">Mesero</th>
                    <th className="px-5 py-3 font-medium">Método pago</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {detallePedidos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-text-muted"
                      >
                        No hay pedidos pagados en el periodo seleccionado
                      </td>
                    </tr>
                  ) : (
                    detallePedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-text">
                          #{pedido.numero}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {formatDate(pedido.fecha)}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {pedido.sucursal}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {pedido.mesero}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {pedido.metodoPago || 'No registrado'}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-text">
                          {formatCurrency(pedido.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
