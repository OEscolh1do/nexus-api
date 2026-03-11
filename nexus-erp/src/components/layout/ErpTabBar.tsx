import { NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, HardHat, ExternalLink } from "lucide-react";

export function ErpTabBar({ onLogout }: { onLogout: () => void }) {
  // Hub URL for returning
  const hubUrl = import.meta.env.VITE_HUB_URL || "http://localhost:5175";

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80 z-50 flex items-end px-2 gap-1 overflow-x-auto select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* TAB 1: GESTÃO */}
      <NavLink 
        to="/executive" 
        className={({isActive}) => 
            `flex items-center gap-2 px-6 py-2 rounded-t-xl border border-b-0 border-slate-700/50 transition-all cursor-pointer ${
                isActive ? 'bg-[#0a0a16] text-[#2563eb] border-b-2 border-b-blue-500 block shadow-[0_-8px_20px_rgba(37,99,235,0.15)] relative' : 'bg-slate-800/20 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`
        }
      >
        <LayoutDashboard size={14} />
        <span className="text-xs font-semibold tracking-wide uppercase">Gestão à Vista</span>
      </NavLink>

      {/* TAB 2: COMERCIAL */}
      <NavLink 
        to="/commercial" 
        className={({isActive}) => 
            `flex items-center gap-2 px-6 py-2 rounded-t-xl border border-b-0 border-slate-700/50 transition-all cursor-pointer ${
                isActive ? 'bg-[#0a0a16] text-[#9333ea] border-b-2 border-b-purple-500 block shadow-[0_-8px_20px_rgba(147,51,234,0.15)] relative' : 'bg-slate-800/20 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`
        }
      >
        <Briefcase size={14} />
        <span className="text-xs font-semibold tracking-wide uppercase">Mission Control</span>
      </NavLink>

      {/* TAB 3: OBRAS */}
      <NavLink 
        to="/ops" 
        className={({isActive}) => 
            `flex items-center gap-2 px-6 py-2 rounded-t-xl border border-b-0 border-slate-700/50 transition-all cursor-pointer ${
                isActive ? 'bg-[#0a0a16] text-[#ea580c] border-b-2 border-b-orange-500 block shadow-[0_-8px_20px_rgba(234,88,12,0.15)] relative' : 'bg-slate-800/20 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`
        }
      >
        <HardHat size={14} />
        <span className="text-xs font-semibold tracking-wide uppercase">Fábrica de Projetos</span>
      </NavLink>

      <div className="flex-1" />

      {/* ACTION: VOLTAR AO HUB/LOGOUT */}
      <a 
        onClick={(e) => {
            e.preventDefault();
            // Volta para o Hub passando o token de volta se necessário, mas o Hub já tem lá.
            // Para "Logout" real, limpamos e vamos para o hub na raiz.
            onLogout();
            window.location.href = hubUrl;
        }}
        href={hubUrl}
        className="flex items-center gap-2 px-6 py-2 rounded-t-xl border border-b-0 border-rose-900/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer ml-4"
      >
        <ExternalLink size={14} />
        <span className="text-xs font-semibold tracking-wide uppercase">Sair p/ Hub</span>
      </a>

    </div>
  );
}
