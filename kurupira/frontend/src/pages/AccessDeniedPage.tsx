import React from 'react';
import { useLogto } from '@logto/react';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react';

const AccessDeniedPage: React.FC = () => {
  const { signOut } = useLogto();

  const handleSignOut = async () => {
    sessionStorage.removeItem('kurupira_token');
    localStorage.removeItem('token');
    // Força o logout total do Logto para limpar a sessão "tóxica"
    await signOut(window.location.origin + '/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center">
        {/* Icon Header */}
        <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-8 animate-pulse">
          <ShieldAlert className="w-10 h-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Acesso Pendente
        </h1>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Sua conta foi autenticada via <span className="text-indigo-400 font-medium">Neonorte ID</span>, 
          mas ainda não foi provisionada no ecossistema Ywara. 
          <br /><br />
          Isso geralmente acontece quando seu cadastro ainda está em fase de aprovação pela coordenação.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.open('https://wa.me/5591999999999', '_blank')}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-medium transition-all border border-slate-700 hover:border-slate-600 group"
          >
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            Falar com Suporte
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-medium transition-all shadow-lg shadow-indigo-500/20 group"
          >
            <LogOut className="w-5 h-5 text-indigo-200 group-hover:-translate-x-1 transition-transform" />
            Tentar outra conta
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Neonorte Ywara — Security Layer
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-600 text-xs">
        &copy; 2026 Neonorte Engenharia. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default AccessDeniedPage;
