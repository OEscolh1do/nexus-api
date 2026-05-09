import React, { useState } from 'react';
import { EngineeringKPIStrip } from './EngineeringKPIStrip';
import { EngineeringTabs } from './EngineeringTabs';
import { 
  Undo2, Redo2, Save, Loader2, CheckCircle2
} from 'lucide-react';
import { useTemporalStore } from '@/core/state/useTemporalStore';
import { useSolarStore } from '@/core/state/solarStore';
import { cn } from '@/lib/utils';
import { ProjectService } from '@/services/ProjectService';

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
        <div className="flex items-center gap-3 shrink-0">
          
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
        </div>
      </div>
    </div>
  );
};
