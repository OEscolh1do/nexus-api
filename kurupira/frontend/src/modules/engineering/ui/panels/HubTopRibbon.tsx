/**
 * =============================================================================
 * HUB TOP RIBBON — Global Navigation for Project Explorer
 * =============================================================================
 * 
 * Consistent with the engineering module's TopRibbon (40px height).
 * Provides identity, global status, and system-level actions.
 * 
 * =============================================================================
 */

import React, { useState } from 'react';
import { 
  Zap, Maximize2, Minimize2, 
  ShieldCheck, ShieldAlert, Lock,
  ChevronRight
} from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { useAuth } from '@/core/auth/useAuth';
import { cn } from '@/lib/utils';

export const HubTopRibbon: React.FC = () => {
  const { userRole } = useSolarStore();
  const [fullscreen, setFullscreen] = useState(false);
  // @ts-ignore
  const { signOut } = useAuth();

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  return (
    <header className="relative h-10 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-0 select-none shrink-0 z-50">
      
      {/* ── LEFT: Identity & Context ── */}
      <div className="flex items-center h-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-full border-r border-slate-800/80">
          {/* Branded Icon */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[4px] flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <Zap size={11} className="text-slate-950 fill-slate-950" />
          </div>
          
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] text-white hidden xs:block">
              KURUPIRA
            </span>
            <ChevronRight size={10} className="text-slate-600 hidden xs:block" />
            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.1em] text-slate-400 uppercase truncate">
              Hub de Projetos
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: System Actions ── */}
      <div className="flex items-center h-full">
        
        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen} 
          className="px-3 h-full hover:bg-slate-800 text-slate-500 hover:text-white transition-all border-l border-slate-800/40 flex items-center active:bg-slate-700" 
          title="Alternar Tela Cheia"
        >
           {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Role Badge */}
        <div className={cn(
          "flex items-center gap-2 px-3 sm:px-4 h-full border-l border-slate-800/80",
          userRole === 'ADMIN' ? 'bg-rose-950/10' : 'bg-emerald-950/10'
        )}>
          {userRole === 'ADMIN' ? <ShieldAlert size={12} className="text-rose-500" /> : <ShieldCheck size={12} className="text-emerald-500" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter leading-none">Acesso</span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
              {userRole}
            </span>
          </div>
        </div>

        {/* Logout Action */}
        <button 
          onClick={signOut}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 h-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all border-l border-slate-800/80 active:bg-rose-500/10"
          title="Encerrar Sessão"
        >
          <Lock size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sair</span>
        </button>

      </div>

    </header>
  );
};
