import { useEffect, useState } from 'react';
import { Plus, Pencil, Users, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: 'LIBRE' | 'OCUPADA' | 'RESERVADA';
  sucursalId: string;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalNuevaMesa, setModalNuevaMesa] = useState(false);
  const [modalEditarMesa, setModalEditarMesa] = useState(false);
  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);

  const [nuevaMesa, setNuevaMesa] = useState({
    numero: '',
    capacidad: '',
  });

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      setLoading(true);

      const res = await fetch('http://localhost:3001/api/mesas', {
        headers: getAuthHeaders(),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error(text);
        setMesas([]);
        return;
      }

      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setMesas([]);
        return;
      }

      setMesas(data);
    } catch (error) {
      console.error('ERROR REAL:', error);
    } finally {
      setLoading(false);
    }
  };

  const mesasLibres = mesas.filter(m => m.estado === 'LIBRE').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA').length;

  const crearMesa = async () => {
    const numero = Number(nuevaMesa.numero);
    const capacidad = Number(nuevaMesa.capacidad);

    if (!numero || !capacidad) return;

    const res = await fetch('http://localhost:3001/api/mesas', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ numero, capacidad }),
    });

    if (!res.ok) return;

    const data = await res.json();

    setMesas(prev => [...prev, data]);
    setNuevaMesa({ numero: '', capacidad: '' });
    setModalNuevaMesa(false);
  };

  const actualizarMesa = async () => {
    if (!mesaEditando) return;

    const res = await fetch(
      `http://localhost:3001/api/mesas/${mesaEditando.id}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          numero: mesaEditando.numero,
          capacidad: mesaEditando.capacidad,
          estado: mesaEditando.estado,
        }),
      }
    );

    if (!res.ok) return;

    const data = await res.json();

    setMesas(prev =>
      prev.map(m => (m.id === data.id ? data : m))
    );

    setMesaEditando(null);
    setModalEditarMesa(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />

          <p className="text-sm text-text-muted">
            Cargando mesas...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 bg-background min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div className="flex flex-wrap gap-6">

          {/* LIBRES */}
          <div className="flex items-center gap-3 bg-white border border-border rounded-2xl px-5 py-4 shadow-sm">
            <div className="w-5 h-5 rounded-full bg-sky-400" />
            <div>
              <p className="text-sm text-text-muted">Mesas libres</p>
              <h2 className="text-2xl font-bold">{mesasLibres}</h2>
            </div>
          </div>

          {/* OCUPADAS */}
          <div className="flex items-center gap-3 bg-white border border-border rounded-2xl px-5 py-4 shadow-sm">
            <div className="w-5 h-5 rounded-full bg-red-400" />
            <div>
              <p className="text-sm text-text-muted">Mesas ocupadas</p>
              <h2 className="text-2xl font-bold">{mesasOcupadas}</h2>
            </div>
          </div>

        </div>

        <button
          onClick={() => setModalNuevaMesa(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl hover:bg-primary/90 transition"
        >
          <Plus size={18} />
          Nueva mesa
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {mesas.map(mesa => (
          <div
            key={mesa.id}
            className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >

            {/* HEADER CARD */}
            <div className="flex items-start justify-between mb-5">

              <div>
                <h2 className="text-2xl font-bold text-text">
                  Mesa {mesa.numero}
                </h2>

                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      mesa.estado === 'LIBRE'
                        ? 'bg-sky-400'
                        : mesa.estado === 'OCUPADA'
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                    }`}
                  />

                  <span
                    className={`text-sm font-medium ${
                      mesa.estado === 'LIBRE'
                        ? 'text-sky-500'
                        : mesa.estado === 'OCUPADA'
                        ? 'text-red-500'
                        : 'text-yellow-500'
                    }`}
                  >
                    {mesa.estado}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMesaEditando(mesa);
                  setModalEditarMesa(true);
                }}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-background"
              >
                <Pencil size={18} />
              </button>
            </div>

            {/* CAPACIDAD */}
            <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>

              <div>
                <p className="text-sm text-text-muted">Capacidad</p>
                <h3 className="font-semibold">
                  {mesa.capacidad} personas
                </h3>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL CREAR */}
      {modalNuevaMesa && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">

            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Nueva mesa</h2>
              <button onClick={() => setModalNuevaMesa(false)}>
                <X />
              </button>
            </div>

            <input
              type="number"
              placeholder="Número"
              value={nuevaMesa.numero}
              onChange={e =>
                setNuevaMesa({ ...nuevaMesa, numero: e.target.value })
              }
              className="w-full border border-border rounded-xl px-4 py-3 mb-3"
            />

            <input
              type="number"
              placeholder="Capacidad"
              value={nuevaMesa.capacidad}
              onChange={e =>
                setNuevaMesa({ ...nuevaMesa, capacidad: e.target.value })
              }
              className="w-full border border-border rounded-xl px-4 py-3 mb-5"
            />

            <button
              onClick={crearMesa}
              className="bg-primary text-white w-full py-3 rounded-xl"
            >
              Crear mesa
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditarMesa && mesaEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">

            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Editar mesa</h2>
              <button onClick={() => setModalEditarMesa(false)}>
                <X />
              </button>
            </div>

            <input
              type="number"
              value={mesaEditando.numero}
              onChange={e =>
                setMesaEditando({
                  ...mesaEditando,
                  numero: Number(e.target.value),
                })
              }
              className="w-full border border-border rounded-xl px-4 py-3 mb-3"
            />

            <input
              type="number"
              value={mesaEditando.capacidad}
              onChange={e =>
                setMesaEditando({
                  ...mesaEditando,
                  capacidad: Number(e.target.value),
                })
              }
              className="w-full border border-border rounded-xl px-4 py-3 mb-5"
            />

            <button
              onClick={actualizarMesa}
              className="bg-primary text-white w-full py-3 rounded-xl"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}