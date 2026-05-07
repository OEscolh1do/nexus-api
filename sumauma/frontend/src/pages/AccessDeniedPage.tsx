import React from 'react';
import { useLogto } from '@logto/react';
import { ShieldX, LogOut, ExternalLink } from 'lucide-react';

const AccessDeniedPage: React.FC = () => {
  const { signOut } = useLogto();

  const handleSignOut = async () => {
    sessionStorage.clear();
    localStorage.clear();
    await signOut(window.location.origin + '/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full border border-red-900/30 bg-[#0f0f0f] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6 border-b border-red-900/20 pb-4">
          <ShieldX className="text-red-600 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tighter text-white uppercase">
            Access Forbidden
          </h1>
        </div>

        <div className="space-y-4 text-sm text-slate-400 mb-8">
          <p>
            <span className="text-red-500 font-bold">[!] ERROR_CODE:</span> UNAUTHORIZED_OPERATOR
          </p>
          <p>
            Seu Neonorte ID está autenticado, mas seu perfil não possui as permissões necessárias 
            para acessar o **Painel Administrativo Sumaúma**.
          </p>
          <p className="bg-red-900/10 p-3 border-l-2 border-red-600 italic">
            "Este ambiente é restrito a operadores da plataforma Neonorte Engenharia."
          </p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Switch Account
          </button>
          
          <button
            onClick={() => window.location.href = 'https://kurupira.neonorte-ywara.tech'}
            className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800 text-slate-300 py-3 px-4 transition-colors text-xs uppercase tracking-widest"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Kurupira (Engineering)
          </button>
        </div>

        <div className="mt-10 pt-4 border-t border-slate-900 flex justify-between items-center opacity-40">
          <span className="text-[10px]">SUMAUMA_BFF_SECURITY</span>
          <span className="text-[10px]">v1.0.4-PROD</span>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
