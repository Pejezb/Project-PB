import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Users, X, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useVistaAdministradorStore } from '../../../store/vistaAdministradorStore';

interface Mesa {
  id: string;
  numero: number | '';
  capacidad: number | '';
  estado: 'LIBRE' | 'OCUPADA' | 'RESERVADA';
  sucursalId: string;
}
export default function MesasPage() {
  const { user } = useAuthStore();

  const {
    activo: vistaAdministradorActiva,
    sucursalActivaId,
    sucursalActivaNombre,
  } = useVistaAdministradorStore();

  const isDuenoEnVistaAdministrador =
    user?.rol === 'DUENO' &&
    vistaAdministradorActiva &&
    Boolean(sucursalActivaId);

  const sucursalIdOperativa =
    isDuenoEnVistaAdministrador
      ? sucursalActivaId
      : user?.sucursalId;

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
  }, [sucursalIdOperativa]);

  const cargarMesas = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (isDuenoEnVistaAdministrador && sucursalIdOperativa) {
        params.append('sucursalId', sucursalIdOperativa);
      }

      const query = params.toString();

      const { data } = await api.get<Mesa[]>(
        query ? `/mesas?${query}` : '/mesas'
      );

      setMesas(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error: any) {
      console.error(
        'ERROR:',
        error.response?.data ||
        error.message
      );

      setMesas([]);
    } finally {
      setLoading(false);
    }
  };
  const mesasLibres = mesas.filter(m => m.estado === 'LIBRE').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA').length;

  const crearMesa = async () => {
    try {
      const numero = Number(
        nuevaMesa.numero
      );

      const capacidad = Number(
        nuevaMesa.capacidad
      );

      if (!numero || !capacidad) {
        toast.error('Completa todos los campos');
        return;
      }

      if (numero < 1 || numero > 99) {
        toast.error('El número de mesa debe estar entre 1 y 99');
        return;
      }

      if (capacidad < 1 || capacidad > 12) {
        toast.error('La capacidad debe ser entre 1 y 12 personas');
        return;
      }

      const { data } =
        await api.post<Mesa>(
          '/mesas',
          {
            numero,
            capacidad,
            sucursalId: isDuenoEnVistaAdministrador
              ? sucursalIdOperativa
              : undefined,
          }
        );

      setMesas((prev) => [
        ...prev,
        data,
      ]);

      setNuevaMesa({
        numero: '',
        capacidad: '',
      });

      setModalNuevaMesa(false);
      toast.success('Mesa agregada correctamente');

    } catch (error: any) {
      console.error(
        error.response?.data ||
        error.message
      );
    }
  };
  const actualizarMesa = async () => {
    try {
      if (!mesaEditando) return;
      if (
        mesaEditando.numero === '' ||
        mesaEditando.numero < 1 ||
        mesaEditando.numero > 99
      ) {
        toast.error(
          'El número de mesa debe estar entre 1 y 99'
        );
        return;
      }

      if (
        mesaEditando.capacidad === '' ||
        mesaEditando.capacidad < 1 ||
        mesaEditando.capacidad > 12
      ) {
        toast.error(
          'La capacidad debe ser entre 1 y 12 personas'
        );
        return;
      }

      const { data } =
        await api.patch<Mesa>(
          `/mesas/${mesaEditando.id}`,
          {
            numero: mesaEditando.numero,
            capacidad: mesaEditando.capacidad,
            estado: mesaEditando.estado,
            sucursalId: isDuenoEnVistaAdministrador
              ? sucursalIdOperativa
              : undefined,
          }
        );

      setMesas((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? data
            : m
        )
      );

      setMesaEditando(null);
      setModalEditarMesa(false);
      toast.success('Mesa actualizada correctamente');

    } catch (error: any) {
      console.error(
        error.response?.data ||
        error.message
      );
    }
  };

  const eliminarMesa = async () => {
    try {
      if (!mesaEditando) return;

      await api.delete(
        `/mesas/${mesaEditando.id}`
      );

      setMesas((prev) =>
        prev.filter(
          (m) => m.id !== mesaEditando.id
        )
      );

      setMesaEditando(null);
      setModalEditarMesa(false);

      toast.success(
        'Mesa eliminada correctamente'
      );

    } catch (error: any) {
      console.error(
        error.response?.data ||
        error.message
      );

      toast.error(
        'No se pudo eliminar la mesa'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {mesas.map(mesa => (
          <div
            key={mesa.id}
            className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >

            <div className="flex items-start justify-between mb-5">

              <div>
                <h2 className="text-2xl font-bold text-text">
                  Mesa {mesa.numero}
                </h2>

                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-3 h-3 rounded-full ${mesa.estado === 'LIBRE'
                      ? 'bg-sky-400'
                      : mesa.estado === 'OCUPADA'
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                      }`}
                  />

                  <span
                    className={`text-sm font-medium ${mesa.estado === 'LIBRE'
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
              type="text"
              inputMode="numeric"
              placeholder="Número"
              value={nuevaMesa.numero}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^\d*$/.test(value)) return;

                if (
                  value === '' ||
                  (Number(value) >= 1 && Number(value) <= 99)
                ) {
                  setNuevaMesa({
                    ...nuevaMesa,
                    numero: value,
                  });
                }
              }}
              className="w-full border border-border rounded-xl px-4 py-3 mb-3"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Capacidad"
              value={nuevaMesa.capacidad}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^\d*$/.test(value)) return;

                if (
                  value === '' ||
                  (Number(value) >= 1 && Number(value) <= 12)
                ) {
                  setNuevaMesa({
                    ...nuevaMesa,
                    capacidad: value,
                  });
                }
              }}
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
              type="text"
              inputMode="numeric"
              value={mesaEditando.numero}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^\d*$/.test(value)) return;

                if (
                  value === '' ||
                  (Number(value) >= 1 && Number(value) <= 99)
                ) {
                  setMesaEditando({
                    ...mesaEditando!,
                    numero:
                      value === ''
                        ? ''
                        : Number(value),
                  });
                }
              }}
              className="w-full border border-border rounded-xl px-4 py-3 mb-3"
            />

            <input
              type="text"
              inputMode="numeric"
              value={mesaEditando.capacidad}
              onChange={(e) => {
                const value = e.target.value;

                if (!/^\d*$/.test(value)) return;

                if (
                  value === '' ||
                  (Number(value) >= 1 && Number(value) <= 12)
                ) {
                  setMesaEditando({
                    ...mesaEditando!,
                    capacidad:
                      value === ''
                        ? ''
                        : Number(value),
                  });
                }
              }}
              className="w-full border border-border rounded-xl px-4 py-3 mb-5"
            />

            <button
              onClick={actualizarMesa}
              className="bg-primary text-white w-full py-3 rounded-xl">
              Guardar cambios
            </button>
            <button
              onClick={eliminarMesa}
              className="mt-3 w-full py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition"
            >
              Eliminar mesa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}