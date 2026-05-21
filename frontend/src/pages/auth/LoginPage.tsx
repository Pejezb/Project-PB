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
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true);
    try {
      const { user, token } = await authService.login(email, password);
      setAuth(user, token);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      const status = err?.response?.status;

      if (status === 429) {
        setBloqueado(true);
        setContador(data?.segundosRestantes ?? 60);
        setError('');
      } else {
        const msg = data?.error ?? 'Credenciales incorrectas';
        setError(msg);
        if (data?.intentosRestantes !== undefined) {
          setIntentosRestantes(data.intentosRestantes);
        }
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
          <p className="text-text-muted text-sm mt-1">Sistema de gestión para restaurantes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          <h2 className="text-lg font-semibold text-text mb-6">Iniciar sesión</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text block mb-1.5" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                autoComplete="email"
                disabled={bloqueado}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text block mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  autoComplete="current-password"
                  disabled={bloqueado}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {bloqueado ? (
              <div className="flex flex-col items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-3 text-center">
                <span className="font-semibold">⚠ Límite de intentos alcanzado</span>
                <span className="text-xs text-red-400">
                  Intenta de nuevo en <span className="font-bold text-red-600">{contador}s</span>
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span>⚠</span>
                  {error}
                </div>
                {intentosRestantes !== null && (
                  <span className="text-xs text-red-400 whitespace-nowrap">
                    {intentosRestantes} intento{intentosRestantes !== 1 ? 's' : ''} restante{intentosRestantes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ) : null}

            <Button type="button" onClick={handleSubmit} className="w-full mt-2" size="lg" loading={loading} disabled={bloqueado}>
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