import React, { useEffect, useRef } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import NeonorteLoader from '../components/ui/NeonorteLoader';

const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error } = useLogto();
  const navigate = useNavigate();
  const redirected = useRef(false);

  // Detecta se o usuário veio de um logout intencional via storage local
  const isLogout = sessionStorage.getItem('just_logged_out') === 'true';

  // Redireciona para o app se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Se logou com sucesso, garantimos que a flag de logout seja limpa
      sessionStorage.removeItem('just_logged_out');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-redirect: dispara signIn() assim que o SDK termina de inicializar,
  // EXCETO se o usuário acabou de fazer logout.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !redirected.current && !isLogout) {
      redirected.current = true;
      signIn(`${window.location.origin}/callback`);
    }
  }, [isLoading, isAuthenticated, error, signIn, isLogout]);

  const handleSignIn = () => {
    sessionStorage.removeItem('just_logged_out');
    redirected.current = true;
    signIn(`${window.location.origin}/callback`);
  };

  // Se houver erro ou se for um logout intencional, mostramos a interface manual
  if (error || isLogout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-sm border border-slate-800 bg-slate-900 p-8 flex flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <span className="text-xl">☀️</span>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-200">Kurupira</h1>
              <p className="text-xs text-slate-500">Engenharia e Dimensionamento Solar</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 w-full rounded-sm border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              Falha na conexão com Ywara SSO: {error.message}
            </div>
          )}

          {isLogout && !error && (
            <div className="mb-6 w-full rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-400">
              Sessão encerrada com sucesso.
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            {isLogout ? 'Entrar Novamente' : 'Tentar novamente'}
          </button>

          <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-slate-600">
            Powered by Neonorte Ecosystem
          </p>
        </div>
      </div>
    );
  }

  // Durante o loading do SDK ou processo de redirecionamento automático
  return (
    <NeonorteLoader 
      size="fullscreen" 
      forceShow={true} 
      message="Iniciando sessão segura..." 
    />
  );
};

export default LoginPage;
