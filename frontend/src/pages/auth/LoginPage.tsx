import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [contador, setContador] = useState(0);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);

  useEffect(() => {
    if (!bloqueado) return;

    const interval = setInterval(() => {
      setContador((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setBloqueado(false);
          setIntentosRestantes(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bloqueado]);

  const handleSubmit = async () => {
    if (bloqueado) return;

    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user, token } = await authService.login(email, password);

      setAuth(user, token);
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      const data = err?.response?.data;
      const status = err?.response?.status;

      if (status === 403 && data?.code === 'ASISTENCIA_REQUERIDA') {
        setError('⚠ Debes marcar tu asistencia antes de ingresar al sistema');
        return;
      }

      if (status === 429) {
        setBloqueado(true);
        setContador(data?.segundosRestantes ?? 60);
        setError('');
        return;
      }

      const msg = data?.error ?? 'Credenciales incorrectas';
      setError(msg);

      if (data?.intentosRestantes !== undefined) {
        setIntentosRestantes(data.intentosRestantes);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">RestaurantOS</h1>
          <p className="text-text-muted text-sm mt-1">
            Sistema de gestión para restaurantes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          <h2 className="text-lg font-semibold text-text mb-6">
            Iniciar sesión
          </h2>

          <div className="space-y-4">

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm"
                disabled={bloqueado}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm"
                  disabled={bloqueado}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ERROR / BLOQUEO */}
            {bloqueado ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center">
                ⚠ Límite de intentos alcanzado<br />
                Reintenta en <b>{contador}s</b>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                ⚠ {error}
                {intentosRestantes !== null && (
                  <div className="text-xs mt-1 text-red-400">
                    {intentosRestantes} intentos restantes
                  </div>
                )}
              </div>
            ) : null}

            {/* BUTTON */}
            <Button
              onClick={handleSubmit}
              className="w-full"
              loading={loading}
              disabled={bloqueado}
            >
              Entrar
            </Button>

          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Si la sucursal está cerrada, contacta al administrador.
        </p>

      </div>
    </div>
  );
}