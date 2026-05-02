import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogto, useHandleSignInCallback } from '@logto/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const logto = useLogto();
  const { signIn, isAuthenticated, isLoading, error } = logto;
  const loginStore = useAuthStore((s) => s.login);

  // Hook específico para processar o callback do Logto
  const { isLoading: isCallbackLoading } = useHandleSignInCallback();

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    // Quando o Logto completar o fluxo de retorno, extraímos o Token e os claims
    Promise.all([logto.getIdToken(), logto.getIdTokenClaims()]).then(([rawIdToken, claims]) => {
      if (!claims || !rawIdToken) return;

      const operator = {
        id: claims.sub,
        username: claims.username as string || claims.email as string || claims.sub,
        fullName: (claims.name as string) || (claims.username as string) || (claims.email as string) || '',
        role: (claims.role as string) || 'PLATFORM_ADMIN',
      };

      // Passamos o JWT real do Logto para o AuthStore, e não uma string hardcoded
      loginStore(rawIdToken, operator);
      navigate('/');
    });
  }, [isAuthenticated, isLoading, logto, loginStore, navigate]);

  const handleLoginClick = () => {
    signIn(`${window.location.origin}/login`);
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
        <div className="space-y-4 rounded-sm border border-slate-800 bg-slate-900 p-6 flex flex-col items-center">
          {error && (
            <div className="flex w-full items-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 mb-4">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error.message || 'Erro ao conectar com o servidor de autenticação'}</span>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mb-2">
            A autenticação deste painel é gerenciada pelo <strong>Logto IAM</strong> — infraestrutura interna Ywara.
          </p>

          <button
            onClick={handleLoginClick}
            disabled={isLoading || isCallbackLoading}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 mt-4"
          >
            {isLoading || isCallbackLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              'Entrar com Logto (SSO)'
            )}
          </button>

          <p className="text-center text-[11px] text-slate-600 mt-4">
            Acesso restrito a operadores da plataforma
          </p>
        </div>
      </div>
    </div>
  );
}
