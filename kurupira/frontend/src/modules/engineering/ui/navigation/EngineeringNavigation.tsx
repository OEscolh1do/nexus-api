import React, { useState, useRef, useEffect } from 'react';
import { EngineeringKPIStrip } from './EngineeringKPIStrip';
import { EngineeringTabs } from './EngineeringTabs';
import { 
  Undo2, Redo2, Save, Loader2, CheckCircle2, LogOut
} from 'lucide-react';
import { useTemporalStore } from '@/core/state/useTemporalStore';
import { useSolarStore } from '@/core/state/solarStore';
import { useAuth } from '@/core/auth/useAuth';
import { cn } from '@/lib/utils';
import { ProjectService } from '@/services/ProjectService';

import { useIdentityStore } from '@/core/state/identityStore';

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const roleMeta = ROLE_META[profile.role] || ROLE_META.ENGINEER;

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Compact Trigger (Engineering Square Style) */}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-sm transition-all duration-200 border",
          open ? "border-indigo-500 scale-105 shadow-[0_0_12px_rgba(99,102,241,0.2)] bg-slate-800" : "border-slate-800 hover:border-slate-700 bg-slate-900/50"
        )}
      >
        <div className={cn(
          'w-full h-full rounded-[1px] flex items-center justify-center text-[10px] font-black text-white',
          profile.color
        )}>
          {profile.initials}
        </div>
        
        {/* Role Status Dot */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950",
          profile.role === 'ADMIN' ? 'bg-rose-500' : profile.role === 'ENGINEER' ? 'bg-indigo-500' : 'bg-emerald-500'
        )} />
      </button>

      {/* Engineering-Style Card Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {/* Header Card */}
          <div className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-slate-800/20 to-transparent">
            <div className={cn(
              'w-14 h-14 rounded-sm flex items-center justify-center text-lg font-black text-white mb-3 shadow-xl border-2 border-slate-800',
              profile.color
            )}>
              {profile.initials}
            </div>
            
            <div className="flex flex-col gap-0.5 mb-3">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">{profile.fullName}</h3>
            </div>

            <span className={cn(
              'px-2.5 py-0.5 rounded-[3px] text-[8px] font-black uppercase tracking-widest border',
              roleMeta.cls
            )}>
              {roleMeta.label}
            </span>
          </div>

          {/* Action List */}
          <div className="p-1.5 border-t border-slate-800/60 flex flex-col gap-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all group"
            >
              <div className="w-7 h-7 rounded-sm bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                <LogOut size={12} />
              </div>
              Encerrar Sessão
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800/40 text-center">
             <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.2em]">Ywara v1.0.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const EngineeringNavigation: React.FC = () => {
  const { undo, redo, pastStates, futureStates } = useTemporalStore(s => s);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const projectName = useSolarStore(s => s.clientData.projectName);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      console.log('[Trace Alpha] Botão Salvar clicado na UI');
      const success = await ProjectService.saveDesign(null);
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col shrink-0 z-40 bg-slate-950 border-b border-slate-800">
      <div className="flex items-center justify-between h-11 px-3 gap-4">
        
        {/* 1. BRANDING & PROJECT */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-600 rounded-sm flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <span className="text-[10px] font-black text-white italic">K</span>
            </div>
            <div className="hidden xl:flex flex-col leading-none">
              <span className="text-[11px] font-black text-slate-100 uppercase tracking-tighter truncate max-w-[100px]">
                {projectName || 'PROJETO_NOVO'}
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                ENGINE v6
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider (Left) */}
        <div className="w-px h-6 bg-slate-800/60 shrink-0 mx-1" />

        {/* 2. JOURNEY TABS (Center) */}
        <div className="flex-1 flex justify-center min-w-0">
          <EngineeringTabs />
        </div>

        {/* Vertical Divider (Right) */}
        <div className="w-px h-6 bg-slate-800/60 shrink-0 mx-1" />

        {/* 3. TELEMETRY & ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Compact KPI Cluster */}
          <div className="hidden 2xl:flex items-center h-8 bg-slate-900/50 rounded-sm border border-slate-800/50 px-1">
            <EngineeringKPIStrip compact />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm h-8 px-0.5">
            <button 
              onClick={() => canUndo && undo()} 
              disabled={!canUndo}
              className={cn(
                "p-1.5 transition-colors rounded-sm",
                canUndo ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-800 opacity-30"
              )}
              title="Desfazer"
            >
              <Undo2 size={12} />
            </button>
            <button 
              onClick={() => canRedo && redo()} 
              disabled={!canRedo}
              className={cn(
                "p-1.5 transition-colors rounded-sm border-l border-slate-800",
                canRedo ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-800 opacity-30"
              )}
              title="Refazer"
            >
              <Redo2 size={12} />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saveStatus !== 'idle'}
            className={cn(
              "flex items-center gap-2 px-3 h-8 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
              saveStatus === 'idle' && "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10",
              saveStatus === 'saving' && "bg-slate-800 text-slate-500 cursor-wait",
              saveStatus === 'success' && "bg-emerald-600 text-white",
              saveStatus === 'error' && "bg-rose-600 text-white"
            )}
          >
            {saveStatus === 'idle' && <><Save size={12} /> <span className="hidden min-[1200px]:inline">Salvar</span></>}
            {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveStatus === 'success' && <CheckCircle2 size={12} className="animate-in zoom-in" />}
          </button>

          {/* Divisor */}
          <div className="w-px h-5 bg-slate-800 shrink-0" />

          {/* User Identity Chip */}
          <UserIdentityChip />
        </div>
      </div>
    </div>
  );
};
