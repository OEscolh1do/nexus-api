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
  LogOut, ChevronRight
} from 'lucide-react';
import { useIdentityStore } from '@/core/state/identityStore';
import { useAuth } from '@/core/auth/useAuth';
import { cn } from '@/lib/utils';

// ── User Identity Chip (Google Style) ────────────────────────────────────────

const ROLE_META: Record<string, { label: string; cls: string }> = {
  ADMIN:    { label: 'Administrador', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  ENGINEER: { label: 'Engenheiro PV',  cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  SALES:    { label: 'Consultor',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const UserIdentityChip: React.FC = () => {
  const profile = useIdentityStore(state => state.profile);
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const roleMeta = ROLE_META[profile.role] || ROLE_META.ENGINEER;

  return (
    <div ref={ref} className="relative flex items-center h-full px-4 border-l border-slate-800/80">
      {/* Compact Trigger (Engineering Square) */}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "relative flex items-center justify-center w-7 h-7 rounded-sm transition-all duration-200 border",
          open ? "border-indigo-500 scale-105 shadow-[0_0_8px_rgba(99,102,241,0.2)] bg-slate-800" : "border-slate-800 hover:border-slate-700"
        )}
      >
        <div className={cn(
          'w-full h-full rounded-[1px] flex items-center justify-center text-[9px] font-black text-white',
          profile.color
        )}>
          {profile.initials}
        </div>
        
        {/* Role Status Dot */}
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950",
          profile.role === 'ADMIN' ? 'bg-rose-500' : profile.role === 'ENGINEER' ? 'bg-indigo-500' : 'bg-emerald-500'
        )} />
      </button>

      {/* Engineering-Style Card Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-slate-800/20 to-transparent">
            <div className={cn(
              'w-12 h-12 rounded-sm flex items-center justify-center text-lg font-black text-white mb-3 shadow-xl border border-slate-800',
              profile.color
            )}>
              {profile.initials}
            </div>
            
            <div className="flex flex-col gap-0.5 mb-3">
              <h3 className="text-xs font-bold text-slate-100 tracking-tight">{profile.fullName}</h3>
            </div>

            <span className={cn(
              'px-2 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest border',
              roleMeta.cls
            )}>
              {roleMeta.label}
            </span>
          </div>

          <div className="p-1 border-t border-slate-800/60">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all group"
            >
              <div className="w-7 h-7 rounded-sm bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                <LogOut size={12} />
              </div>
              Encerrar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const HubTopRibbon: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);

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

        {/* User Identity Chip (Google Style) */}
        <UserIdentityChip />

      </div>

    </header>
  );
};
