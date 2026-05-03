import React, { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error } = useLogto();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = () => {
    console.log('Iniciando redirecionamento sincrono para Logto:', import.meta.env.VITE_LOGTO_ENDPOINT);
    signIn(`${window.location.origin}/callback`);
  };

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

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Conectando...</>
          ) : (
            'Entrar com Ywara ID'
          )}
        </button>

        <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-slate-600">
          Powered by Neonorte Ecosystem
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
