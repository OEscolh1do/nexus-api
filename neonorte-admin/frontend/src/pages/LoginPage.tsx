import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/admin/auth/login', { username, password });
      login(res.data.token, res.data.operator);
      navigate('/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao fazer login');
      } else {
        setError('Erro de conexão com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 ring-1 ring-slate-800">
            <Zap className="h-6 w-6 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-200">Neonorte Admin</h1>
            <p className="text-xs text-slate-500">Painel de Gestão e Supervisão</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-slate-800 bg-slate-900 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs font-medium text-slate-400">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              required
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-slate-400">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <p className="text-center text-[11px] text-slate-600">
            Acesso restrito a operadores da plataforma
          </p>
        </form>
      </div>
    </div>
  );
}
