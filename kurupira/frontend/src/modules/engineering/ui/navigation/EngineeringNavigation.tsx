import React, { useState, useRef, useEffect } from 'react';
import { EngineeringKPIStrip } from './EngineeringKPIStrip';
import { EngineeringTabs } from './EngineeringTabs';
import { 
  Undo2, Redo2, Save, Loader2, CheckCircle2, LogOut, ArrowLeft
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
  const setActiveModule = useSolarStore(s => s.setActiveModule);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const success = await ProjectService.saveDesign(null);
      setSaveStatus(success ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col shrink-0 z-40 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80">
      <div className="flex items-center justify-between h-10 px-2 gap-3">

        {/* ── LEFT: Breadcrumb Navigation ── */}
        <div className="flex items-center gap-0 shrink-0 h-full">
          {/* Hub Button */}
          <button
            onClick={() => setActiveModule('hub')}
            title="Voltar ao Hub de Projetos (Esc)"
            className={cn(
              "group flex items-center gap-1.5 px-2 h-full transition-all duration-150",
              "text-slate-600 hover:text-slate-200 hover:bg-slate-800/60",
              "border-r border-slate-800/40"
            )}
          >
            <ArrowLeft
              size={12}
              className="shrink-0 group-hover:-translate-x-0.5 transition-transform duration-150"
            />
            <span className="hidden lg:block text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap">
              Hub
            </span>
          </button>

          {/* Breadcrumb separator + Project Name */}
          <div className="hidden lg:flex items-center gap-2 px-3 h-full">
            <span className="text-slate-700 text-[10px]">/</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight truncate max-w-[180px]">
                {projectName || 'PROJETO_NOVO'}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* ── CENTER: Journey Tabs ── */}
        <div className="flex-1 flex justify-center min-w-0 h-full">
          <EngineeringTabs />
        </div>

        {/* ── RIGHT: Telemetry + Action Group ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Compact KPI Cluster — 2xl+ only */}
          <div className="hidden 2xl:flex items-center h-7 bg-slate-900/60 rounded border border-slate-800/60 px-1">
            <EngineeringKPIStrip compact />
          </div>

          {/* Unified Action Group: Undo / Redo / Save */}
          <div className="flex items-center h-7 bg-slate-900/60 border border-slate-800/70 rounded overflow-hidden">
            <button
              onClick={() => canUndo && undo()}
              disabled={!canUndo}
              title="Desfazer"
              className={cn(
                "flex items-center justify-center w-7 h-full transition-colors duration-150",
                canUndo
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  : "text-slate-800 cursor-not-allowed"
              )}
            >
              <Undo2 size={12} />
            </button>

            <div className="w-px h-3.5 bg-slate-800 shrink-0" />

            <button
              onClick={() => canRedo && redo()}
              disabled={!canRedo}
              title="Refazer"
              className={cn(
                "flex items-center justify-center w-7 h-full transition-colors duration-150",
                canRedo
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  : "text-slate-800 cursor-not-allowed"
              )}
            >
              <Redo2 size={12} />
            </button>

            <div className="w-px h-3.5 bg-slate-800 shrink-0" />

            {/* Save — integrated at the right of the group */}
            <button
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              title="Salvar projeto"
              className={cn(
                "flex items-center gap-1.5 px-3 h-full text-[10px] font-black uppercase tracking-widest transition-all duration-150",
                saveStatus === 'idle'   && "text-indigo-300 hover:text-white hover:bg-indigo-600/80",
                saveStatus === 'saving' && "text-slate-500 cursor-wait",
                saveStatus === 'success' && "text-emerald-400 bg-emerald-500/10",
                saveStatus === 'error'   && "text-rose-400 bg-rose-500/10"
              )}
            >
              {saveStatus === 'idle'    && <><Save size={11} /><span className="hidden min-[1100px]:inline">Salvar</span></>}
              {saveStatus === 'saving'  && <Loader2 size={11} className="animate-spin" />}
              {saveStatus === 'success' && <CheckCircle2 size={11} className="animate-in zoom-in-50 duration-150" />}
              {saveStatus === 'error'   && <span className="text-[9px]">Erro</span>}
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-800/70 shrink-0" />

          {/* User Identity Chip */}
          <UserIdentityChip />
        </div>
      </div>
    </div>
  );
};
