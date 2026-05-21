import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  X,
  Printer,
} from 'lucide-react';

import { useAuthStore } from '../../../store/authStore';

interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  id: number;
  pedidoId: string;
  mesa: number;
  estado: 'PENDIENTE' | 'PAGADO';
  usuario: string;
  productos: ProductoPedido[];
  total: number;
  creadoEn: string;
}

export default function PedidosPage() {
  const token = useAuthStore(
    (state) => state.token
  );

  const [loading, setLoading] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState('');

  const [filtro, setFiltro] =
    useState('TODOS');

  const [pedidos, setPedidos] =
    useState<Pedido[]>([]);

  const [
    pedidoSeleccionado,
    setPedidoSeleccionado,
  ] = useState<Pedido | null>(null);

  const [modalDetalle, setModalDetalle] =
    useState(false);

  const fetchPedidos = async () => {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      if (busqueda) {
        params.append(
          'busqueda',
          busqueda
        );
      }

      if (filtro !== 'TODOS') {
        params.append(
          'estado',
          filtro
        );
      }

      const response = await fetch(
        `http://localhost:3001/api/pedidos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error');
      }

      setPedidos(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error(
        'Error cargando pedidos:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPedidos();
    }, 300);

    return () => clearTimeout(timeout);

  }, [busqueda, filtro]);

  const calcularTotal = (
    productos: ProductoPedido[]
  ) => {
    return productos.reduce(
      (acc, item) =>
        acc +
        item.precio *
        item.cantidad,
      0
    );
  };

  const pedidosFiltrados = useMemo(() => {
    return Array.isArray(pedidos)
      ? pedidos
      : [];
  }, [pedidos]);

  const imprimirPedido = () => {
    if (!pedidoSeleccionado) return;

    const total =
      calcularTotal(
        pedidoSeleccionado.productos
      ).toFixed(2);

    const productosHTML =
      pedidoSeleccionado.productos
        .map(
          (p) => `
        <tr>
            <td style="padding:6px 0">${p.nombre}</td>
            <td style="text-align:center;padding:6px 0">${p.cantidad}</td>
            <td style="text-align:right;padding:6px 0">S/ ${(
              p.precio *
              p.cantidad
            ).toFixed(2)}</td>
        </tr>`
        )
        .join('');

    const ventana = window.open(
      '',
      '_blank',
      'width=400,height=600'
    );

    if (!ventana) return;

    ventana.document.write(`
        <html>
        <head><title>Pedido #${pedidoSeleccionado.id}</title></head>
        <body style="font-family:sans-serif;padding:32px">
            <h2>Pedido #${pedidoSeleccionado.id}</h2>
            <hr/>
            <p><strong>Mesa:</strong> Mesa ${pedidoSeleccionado.mesa}</p>
            <p><strong>Usuario:</strong> ${pedidoSeleccionado.usuario}</p>
            <p><strong>Estado:</strong> ${pedidoSeleccionado.estado}</p>
            <hr/>
            <table style="width:100%;border-collapse:collapse">
            <thead>
                <tr style="border-bottom:1px solid #000">
                <th style="text-align:left;padding:6px 0">Producto</th>
                <th style="text-align:center;padding:6px 0">Cant.</th>
                <th style="text-align:right;padding:6px 0">Precio</th>
                </tr>
            </thead>
            <tbody>${productosHTML}</tbody>
            </table>
            <hr/>
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:18px">
            <span>TOTAL</span>
            <span>S/ ${total}</span>
            </div>
        </body>
        </html>
    `);

    ventana.document.close();

    ventana.focus();

    ventana.print();

    ventana.close();
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text">
            Pedidos
          </h1>

          <p className="text-text-muted mt-1">
            Visualiza y controla los pedidos
          </p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />

        <input
          type="text"
          placeholder="Buscar por mesa o # de pedido"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          className="w-full lg:w-[400px] bg-white border border-border rounded-2xl pl-11 pr-4 py-3 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {[
          'TODOS',
          'PENDIENTE',
          'PAGADO',
        ].map((item) => (
          <button
            key={item}
            onClick={() =>
              setFiltro(item)
            }
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors
            ${filtro === item
                ? 'bg-primary text-white'
                : 'bg-white border border-border'
              }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted">
          Cargando pedidos...
        </div>
      ) : pedidosFiltrados.length ===
        0 ? (
        <div className="text-center py-20 text-text-muted">
          No se encontraron pedidos
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pedidosFiltrados.map(
            (pedido) => (
              <div
                key={pedido.pedidoId}
                className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-text">
                      Mesa{' '}
                      {pedido.mesa}
                    </h2>

                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={`w-3 h-3 rounded-full
                    ${pedido.estado ===
                            'PENDIENTE'
                            ? 'bg-red-400'
                            : 'bg-sky-400'
                          }`}
                      />

                      <span
                        className={`text-sm font-medium
                    ${pedido.estado ===
                            'PENDIENTE'
                            ? 'text-red-500'
                            : 'text-sky-500'
                          }`}
                      >
                        {pedido.estado ===
                          'PENDIENTE'
                          ? 'Pendiente'
                          : 'Pagado'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPedidoSeleccionado(
                        pedido
                      );

                      setModalDetalle(
                        true
                      );
                    }}
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {pedido.productos.map(
                    (
                      producto,
                      index
                    ) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-text">
                          {
                            producto.cantidad
                          }
                          x{' '}
                          {
                            producto.nombre
                          }
                        </span>

                        <span className="font-medium">
                          S/{' '}
                          {(
                            producto.precio *
                            producto.cantidad
                          ).toFixed(
                            2
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="text-text-muted">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-primary">
                    S/{' '}
                    {pedido.total.toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* MODAL */}
      {modalDetalle &&
        pedidoSeleccionado && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Pedido #
                    {
                      pedidoSeleccionado.id
                    }
                  </h2>

                  <p className="text-text-muted">
                    Mesa{' '}
                    {
                      pedidoSeleccionado.mesa
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setModalDetalle(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">
                    Mesa
                  </p>

                  <h3 className="font-semibold">
                    Mesa{' '}
                    {
                      pedidoSeleccionado.mesa
                    }
                  </h3>
                </div>

                <div className="bg-background rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">
                    Usuario
                  </p>

                  <h3 className="font-semibold">
                    {
                      pedidoSeleccionado.usuario
                    }
                  </h3>
                </div>

                <div className="bg-background rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">
                    Estado
                  </p>

                  <h3
                    className={`font-semibold
                    ${pedidoSeleccionado.estado ===
                        'PENDIENTE'
                        ? 'text-red-500'
                        : 'text-sky-500'
                      }`}
                  >
                    {
                      pedidoSeleccionado.estado
                    }
                  </h3>
                </div>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden mb-6">
                <div className="grid grid-cols-4 bg-background px-5 py-4 font-semibold text-sm">
                  <span className="col-span-2">
                    Producto
                  </span>

                  <span>
                    Cantidad
                  </span>

                  <span>
                    Precio
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {pedidoSeleccionado.productos.map(
                    (
                      producto,
                      index
                    ) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 px-5 py-4 text-sm"
                      >
                        <span className="col-span-2">
                          {
                            producto.nombre
                          }
                        </span>

                        <span>
                          {
                            producto.cantidad
                          }
                        </span>

                        <span>
                          S/{' '}
                          {(
                            producto.precio *
                            producto.cantidad
                          ).toFixed(
                            2
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-medium">
                  TOTAL
                </span>

                <span className="text-3xl font-bold text-primary">
                  S/{' '}
                  {pedidoSeleccionado.total.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={
                    imprimirPedido
                  }
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-background transition-colors"
                >
                  <Printer size={18} />
                  Imprimir
                </button>

                <button
                  onClick={() =>
                    setModalDetalle(
                      false
                    )
                  }
                  className="px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}