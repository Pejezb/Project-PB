import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, User, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
  const { user } = useAuthStore();

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');

  const actualizarPerfil = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/usuarios/me', { nombre });
      return res.data;
    },
    onSuccess: (data) => {
      if (user) {
      }
      toast.success('Perfil actualizado');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? 'Error al actualizar perfil');
    },
  });

  const cambiarPassword = useMutation({
    mutationFn: async () => {
      await api.patch('/usuarios/me/password', {
        passwordActual: passActual,
        passwordNueva: passNueva,
      });
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      setPassActual('');
      setPassNueva('');
      setPassConfirm('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? 'Error al cambiar contraseña');
    },
  });

  const handlePerfilSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    actualizarPerfil.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passNueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passNueva !== passConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    cambiarPassword.mutate();
  };

  return (
    <div className="max-w-lg space-y-6">

      {/* PERFIL */}
      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-primary" />
          <h3 className="font-semibold">Información personal</h3>
        </div>

        <form onSubmit={handlePerfilSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full border border-border rounded-lg px-3 py-2 bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Rol</label>
            <input
              value={user?.rol ?? ''}
              disabled
              className="w-full border border-border rounded-lg px-3 py-2 bg-background"
            />
          </div>

          <Button
            type="submit"
            loading={actualizarPerfil.isPending}
            className="flex items-center gap-2"
          >
            <Save size={15} />
            Guardar cambios
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={18} className="text-primary" />
          <h3 className="font-semibold">Cambiar contraseña</h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">

          <input
            type="password"
            placeholder="Contraseña actual"
            value={passActual}
            onChange={(e) => setPassActual(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={passNueva}
            onChange={(e) => setPassNueva(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={passConfirm}
            onChange={(e) => setPassConfirm(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2"
          />

          <Button
            type="submit"
            loading={cambiarPassword.isPending}
          >
            Actualizar contraseña
          </Button>
        </form>
      </div>

      {user?.sucursal && (
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h3 className="font-semibold mb-3">Tu sucursal</h3>

          <div className="text-sm flex justify-between">
            <span className="text-text-muted">Nombre</span>
            <span className="font-medium">{user.sucursal.nombre}</span>
          </div>
        </div>
      )}
    </div>
  );
}