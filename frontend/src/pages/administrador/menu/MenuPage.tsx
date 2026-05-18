import { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ImagePlus,
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  tipo: 'COCINA' | 'COMPLEMENTO';
}

export default function MenuPage() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const [productoEditando, setProductoEditando] =
    useState<Producto | null>(null);

  const [categorias, setCategorias] = useState([
    'Pollos a la brasa',
    'Combos',
    'Bebidas',
    'Guarniciones',
  ]);

  const [productos, setProductos] = useState<Producto[]>([
    {
      id: 1,
      nombre: '1/4 Pollo a la Brasa',
      descripcion: 'Pollo acompañado de papas fritas.',
      precio: 18.9,
      categoria: 'Pollos a la brasa',
      tipo: 'COCINA',
      imagen:
        'https://images.unsplash.com/photo-1600891964092-4316c288032e',
    },
    {
      id: 2,
      nombre: 'Inca Kola',
      descripcion: 'Bebida personal helada.',
      precio: 5.5,
      categoria: 'Bebidas',
      tipo: 'COMPLEMENTO',
      imagen:
        'https://images.unsplash.com/photo-1629203851122-3726ecdf080e',
    },
  ]);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    imagen: '',
    tipo: 'COCINA',
  });

  const crearCategoria = () => {
    if (!nuevaCategoria.trim()) return;

    setCategorias([...categorias, nuevaCategoria]);

    setNuevaCategoria('');
    setModalCategoria(false);
  };

  const crearProducto = () => {
    if (
      !nuevoProducto.nombre ||
      !nuevoProducto.precio ||
      !nuevoProducto.categoria
    ) {
      return;
    }

    const producto: Producto = {
      id: Date.now(),
      nombre: nuevoProducto.nombre,
      descripcion: nuevoProducto.descripcion,
      precio: Number(nuevoProducto.precio),
      categoria: nuevoProducto.categoria,
      imagen: nuevoProducto.imagen,
      tipo: nuevoProducto.tipo as 'COCINA' | 'COMPLEMENTO',
    };

    setProductos([producto, ...productos]);

    setNuevoProducto({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      imagen: '',
      tipo: 'COCINA',
    });

    setModalProducto(false);
  };

  const actualizarProducto = () => {
    if (!productoEditando) return;

    setProductos((prev) =>
      prev.map((producto) =>
        producto.id === productoEditando.id
          ? productoEditando
          : producto
      )
    );

    setModalEditar(false);
    setProductoEditando(null);
  };

  const eliminarProducto = (id: number) => {
    setProductos((prev) =>
      prev.filter((producto) => producto.id !== id)
    );
  };

  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaActiva === 'Todos' ||
      producto.categoria === categoriaActiva;

    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text">
            Menú
          </h1>

          <p className="text-text-muted mt-1">
            Gestiona los productos del restaurante
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setModalCategoria(true)}
            className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-xl font-medium hover:bg-primary/5"
          >
            <Plus size={18} />
            Nueva categoría
          </button>

          <button
            onClick={() => setModalProducto(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90"
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />

        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full lg:w-[400px] bg-white border border-border rounded-2xl pl-11 pr-4 py-3 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setCategoriaActiva('Todos')}
          className={`px-5 py-2 rounded-full text-sm font-medium
          ${
            categoriaActiva === 'Todos'
              ? 'bg-primary text-white'
              : 'bg-white border border-border'
          }`}
        >
          Todos
        </button>

        {categorias.map((categoria) => (
          <button
            key={categoria}
            onClick={() => setCategoriaActiva(categoria)}
            className={`px-5 py-2 rounded-full text-sm font-medium
            ${
              categoriaActiva === categoria
                ? 'bg-primary text-white'
                : 'bg-white border border-border'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {productosFiltrados.map((producto) => (
          <div
            key={producto.id}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative">
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-full h-52 object-cover"
              />

              <div
                className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold
                ${
                  producto.tipo === 'COCINA'
                    ? 'bg-orange-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {producto.tipo}
              </div>
            </div>

            <div className="p-5">
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {producto.categoria}
              </span>

              <h2 className="text-lg font-bold text-text mb-2">
                {producto.nombre}
              </h2>

              <p className="text-sm text-text-muted mb-4 line-clamp-2">
                {producto.descripcion}
              </p>

              <div className="mb-5">
                <span className="text-2xl font-bold text-primary">
                  S/ {producto.precio.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProductoEditando(producto);
                    setModalEditar(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary py-2.5 rounded-xl font-medium hover:bg-primary/5"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  onClick={() =>
                    eliminarProducto(producto.id)
                  }
                  className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 rounded-xl font-medium hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalCategoria && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Nueva categoría
              </h2>

              <button
                onClick={() => setModalCategoria(false)}
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={nuevaCategoria}
              onChange={(e) =>
                setNuevaCategoria(e.target.value)
              }
              className="w-full border border-border rounded-xl px-4 py-3 mb-6 outline-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalCategoria(false)}
                className="px-4 py-2 rounded-xl border border-border"
              >
                Cancelar
              </button>

              <button
                onClick={crearCategoria}
                className="px-4 py-2 rounded-xl bg-primary text-white"
              >
                Crear categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {modalProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Nuevo producto
              </h2>

              <button
                onClick={() => setModalProducto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Imagen del producto
                </label>

                <label className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary block">
                  <ImagePlus
                    size={36}
                    className="mx-auto mb-3 text-text-muted"
                  />

                  <p className="text-sm text-text-muted mb-3">
                    Haz clic para subir una imagen
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const archivo =
                        e.target.files?.[0];

                      if (archivo) {
                        const urlImagen =
                          URL.createObjectURL(archivo);

                        setNuevoProducto({
                          ...nuevoProducto,
                          imagen: urlImagen,
                        });
                      }
                    }}
                  />

                  {nuevoProducto.imagen && (
                    <img
                      src={nuevoProducto.imagen}
                      alt="Preview"
                      className="mt-4 w-full h-56 object-cover rounded-xl"
                    />
                  )}
                </label>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Precio
                </label>

                <input
                  type="number"
                  value={nuevoProducto.precio}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      precio: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Categoría
                </label>

                <select
                  value={nuevoProducto.categoria}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                >
                  <option value="">
                    Seleccionar categoría
                  </option>

                  {categorias.map((categoria) => (
                    <option key={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo
                </label>

                <div className="flex gap-5 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={
                        nuevoProducto.tipo ===
                        'COCINA'
                      }
                      onChange={() =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          tipo: 'COCINA',
                        })
                      }
                    />
                    Cocina
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={
                        nuevoProducto.tipo ===
                        'COMPLEMENTO'
                      }
                      onChange={() =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          tipo: 'COMPLEMENTO',
                        })
                      }
                    />
                    Complemento
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Descripción breve
                </label>

                <textarea
                  rows={4}
                  value={nuevoProducto.descripcion}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalProducto(false)}
                className="px-4 py-2 rounded-xl border border-border"
              >
                Cancelar
              </button>

              <button
                onClick={crearProducto}
                className="px-4 py-2 rounded-xl bg-primary text-white"
              >
                Crear producto
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEditar && productoEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Editar producto
              </h2>

              <button
                onClick={() => {
                  setModalEditar(false);
                  setProductoEditando(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Imagen del producto
                </label>

                <label className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary block">
                  <ImagePlus
                    size={36}
                    className="mx-auto mb-3 text-text-muted"
                  />

                  <p className="text-sm text-text-muted mb-3">
                    Cambiar imagen
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const archivo =
                        e.target.files?.[0];

                      if (archivo) {
                        const urlImagen =
                          URL.createObjectURL(archivo);

                        setProductoEditando({
                          ...productoEditando,
                          imagen: urlImagen,
                        });
                      }
                    }}
                  />

                  {productoEditando.imagen && (
                    <img
                      src={productoEditando.imagen}
                      alt="Preview"
                      className="mt-4 w-full h-56 object-cover rounded-xl"
                    />
                  )}
                </label>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nombre
                </label>

                <input
                  type="text"
                  value={productoEditando.nombre}
                  onChange={(e) =>
                    setProductoEditando({
                      ...productoEditando,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Precio
                </label>

                <input
                  type="number"
                  value={productoEditando.precio}
                  onChange={(e) =>
                    setProductoEditando({
                      ...productoEditando,
                      precio: Number(e.target.value),
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Categoría
                </label>

                <select
                  value={productoEditando.categoria}
                  onChange={(e) =>
                    setProductoEditando({
                      ...productoEditando,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none"
                >
                  {categorias.map((categoria) => (
                    <option key={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo
                </label>

                <div className="flex gap-5 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={
                        productoEditando.tipo ===
                        'COCINA'
                      }
                      onChange={() =>
                        setProductoEditando({
                          ...productoEditando,
                          tipo: 'COCINA',
                        })
                      }
                    />
                    Cocina
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={
                        productoEditando.tipo ===
                        'COMPLEMENTO'
                      }
                      onChange={() =>
                        setProductoEditando({
                          ...productoEditando,
                          tipo: 'COMPLEMENTO',
                        })
                      }
                    />
                    Complemento
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Descripción breve
                </label>

                <textarea
                  rows={4}
                  value={productoEditando.descripcion}
                  onChange={(e) =>
                    setProductoEditando({
                      ...productoEditando,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-xl px-4 py-3 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalEditar(false);
                  setProductoEditando(null);
                }}
                className="px-4 py-2 rounded-xl border border-border"
              >
                Cancelar
              </button>

              <button
                onClick={actualizarProducto}
                className="px-4 py-2 rounded-xl bg-primary text-white"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}