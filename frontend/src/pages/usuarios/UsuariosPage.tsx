import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCircle, Trash2, Pencil, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usuariosService } from '../../services/usuarios.service';
import { sucursalesService } from '../../services/sucursales.service';
import { useAuthStore } from '../../store/authStore';
import type { Usuario } from '../../types';
import toast from 'react-hot-toast';

type Rol = 'ADMIN' | 'MESERO' | 'COCINERO';

interface FormState {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  sucursalId: string;
}

const emptyForm: FormState = {
  nombre: '', email: '', password: '', rol: 'MESERO', sucursalId: '',
};

const ROL_LABELS: Record<Rol, string> = {
  ADMIN: 'Administrador',
  MESERO: 'Mesero',
  COCINERO: 'Cocinero',
};

const ROL_VARIANTS: Record<Rol, 'success' | 'warning' | 'info'> = {
  ADMIN: 'success',
  MESERO: 'info',
  COCINERO: 'warning',
};

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isDueno = user?.rol === 'DUENO';

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.getAll(),
  });

  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: sucursalesService.getAll,
    enabled: isDueno,
  });

  const crear = useMutation({
    mutationFn: () => usuariosService.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error al crear usuario'),
  });

  const actualizar = useMutation({
    mutationFn: () => usuariosService.update(editing!.id, {
      nombre: form.nombre,
      rol: form.rol,
      sucursalId: form.sucursalId || undefined,
      ...(form.password ? { password: form.password } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error al actualizar'),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => usuariosService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Error al eliminar'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sucursalId: isDueno ? '' : (user?.sucursalId ?? '') });
    setShowModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol as Rol,
      sucursalId: u.sucursalId ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); };
  const handleChange = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editing ? actualizar.mutate() : crear.mutate();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Usuarios</h2>
          <p className="text-sm text-text-muted">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Nuevo usuario</Button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse h-16" />)}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <UserCircle size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay usuarios aún</p>
          <p className="text-sm mt-1">Crea el primer usuario para tu equipo</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text truncate">{u.nombre}</p>
                    <p className="text-xs text-text-muted truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {isDueno && u.sucursal && (
                    <span className="text-xs text-text-muted hidden sm:block">{u.sucursal.nombre}</span>
                  )}
                  <Badge variant={ROL_VARIANTS[u.rol as Rol] ?? 'neutral'}>
                    {ROL_LABELS[u.rol as Rol] ?? u.rol}
                  </Badge>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar a ${u.nombre}?`)) eliminar.mutate(u.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-error transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
            <h3 className="font-semibold text-text text-lg mb-5">
              {editing ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text block mb-1">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => handleChange('nombre', e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {!editing && (
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-text block mb-1">
                  {editing ? (
                    <span className="flex items-center gap-1.5"><KeyRound size={13} /> Nueva contraseña (dejar vacío para no cambiar)</span>
                  ) : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'}
                  required={!editing}
                  minLength={editing ? undefined : 6}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1">Rol *</label>
                <select
                  value={form.rol}
                  onChange={e => handleChange('rol', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MESERO">Mesero</option>
                  <option value="COCINERO">Cocinero</option>
                </select>
              </div>

              {isDueno && (
                <div>
                  <label className="text-sm font-medium text-text block mb-1">Sucursal *</label>
                  <select
                    value={form.sucursalId}
                    onChange={e => handleChange('sucursalId', e.target.value)}
                    required
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">Selecciona una sucursal</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" loading={crear.isPending || actualizar.isPending}>
                  {editing ? 'Guardar cambios' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
