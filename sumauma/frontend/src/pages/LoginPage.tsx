import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogto, useHandleSignInCallback } from '@logto/react';
import api from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const logto = useLogto();
  const { signIn, isAuthenticated, isLoading, error } = logto;
  const loginStore = useAuthStore((s) => s.login);

  // Hook específico para processar o callback do Logto
  const { isLoading: isCallbackLoading } = useHandleSignInCallback();

  // Estados do Fallback Local
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const isForceLogout = sessionStorage.getItem('sumauma_force_logout') === 'true';

    // Quebra do loop infinito: se o backend rejeitou o token (401)
    if (isForceLogout) {
      if (isAuthenticated) {
        console.warn('[Login] Loop detectado. Forçando logout do Logto para limpar sessão...');
        logto.signOut(window.location.origin + '/login');
      } else {
        // Usuário já está deslogado do Logto, podemos limpar a flag e permitir novos logins
        sessionStorage.removeItem('sumauma_force_logout');
      }
      return;
    }

    if (!isAuthenticated || isLoading) return;

    // Quando o Logto completar o fluxo de retorno, extraímos o Token e os claims
    Promise.all([logto.getIdToken(), logto.getIdTokenClaims()]).then(([rawIdToken, claims]) => {
      if (!claims || !rawIdToken) return;

      const operator = {
        id: claims.sub,
        username: (claims.username as string) || (claims.email as string) || claims.sub,
        fullName: (claims.name as string) || (claims.username as string) || (claims.email as string) || '',
        role: (claims.role as string) || 'PLATFORM_ADMIN',
      };

      // Passamos o JWT real do Logto para o AuthStore
      loginStore(rawIdToken, operator);

      // Notificar o backend sobre o login via SSO para auditoria
      api.post('/auth/audit-login', {}, {
        headers: { Authorization: `Bearer ${rawIdToken}` }
      }).catch(err => console.warn('Falha ao auditar login SSO', err));

      navigate('/');
    });
  }, [isAuthenticated, isLoading, logto, loginStore, navigate]);

  const handleLogtoClick = () => {
    signIn(`${window.location.origin}/login`);
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      loginStore(data.token, data.operator);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.response?.data?.error || err.message || 'Credenciais inválidas');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
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

        {/* Form Container */}
        <div className="rounded-sm border border-slate-800 bg-slate-900 p-6 flex flex-col items-center">
          
          {/* LOGTO SECTION */}
          <div className="w-full">
            {error && (
              <div className="flex w-full items-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 mb-4">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error.message || 'Erro ao conectar com servidor SSO'}</span>
              </div>
            )}
            <p className="text-center text-xs text-slate-400 mb-4">
              A autenticação primária é gerenciada pelo <strong>Logto IAM</strong>.
            </p>
            <button
              type="button"
              onClick={handleLogtoClick}
              disabled={isLoading || isCallbackLoading || localLoading}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading || isCallbackLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Redirecionando...</>
              ) : (
                'Entrar com Logto (SSO)'
              )}
            </button>
          </div>

          {/* DIVIDER */}
          <div className="relative my-6 w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Ou (Local Dev)</span>
            </div>
          </div>

          {/* LOCAL FALLBACK SECTION */}
          <form onSubmit={handleLocalLogin} className="w-full space-y-4">
            {localError && (
              <div className="flex w-full items-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{localError}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="sr-only" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="Username do operador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-sm border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="password">Senha</label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={localLoading || isLoading || isCallbackLoading}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {localLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Autenticando...</>
              ) : (
                <><KeyRound className="h-4 w-4" /> Login Local de Emergência</>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            Acesso estritamente restrito e auditado
          </p>
        </div>
      </div>
    </div>
  );
}
