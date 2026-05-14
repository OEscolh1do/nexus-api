import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MPPTConfigStrip } from './MPPTConfigStrip';
import { useTechStore, type MPPTConfig, type StringDef } from '../../../../store/useTechStore';
import { useSolarStore } from '@/core/state/solarStore';
import { calculateStringMetrics } from '../../../../utils/electricalMath';
import { getModuleSpecs } from '../../../../utils/specAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// MPPT INSPECTOR PANEL — Left-side collapsible panel (Opção E)
// Libera o canvas central para visualização em full-width dos gráficos de
// análise técnica, mantendo a configuração de strings/módulos acessível.
// ─────────────────────────────────────────────────────────────────────────────

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
  unitVmp: number;
  unitImp: number;
}

interface MPPTInspectorPanelProps {
  // ── MPPTConfigStrip passthrough ──
  inverterId: string;
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  updateMPPT: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  addStringToMPPT?: (inverterId: string, mpptId: number) => void;
  removeStringFromMPPT?: (inverterId: string, mpptId: number, stringId: string) => void;
  updateStringInMPPT?: (inverterId: string, mpptId: number, stringId: string, data: Partial<StringDef>) => void;
  limitVMax: number;
  limitVMpptMin: number;
  limitIscMaxMppt: number;
  startupVoltage: number;
  tmin: number;
  module?: any;
  // ── Inspector state ──
  isCollapsed: boolean;
  onToggle: () => void;
}

export const MPPTInspectorPanel: React.FC<MPPTInspectorPanelProps> = ({
  inverterId,
  mpptConfigs,
  mpptMetrics,
  updateMPPT,
  addStringToMPPT,
  removeStringFromMPPT,
  updateStringInMPPT,
  limitVMax,
  limitVMpptMin,
  limitIscMaxMppt,
  startupVoltage,
  tmin,
  module,
  isCollapsed,
  onToggle,
}) => {
  const configuredCount = mpptConfigs.filter(m => {
    const metrics = mpptMetrics[m.mpptId];
    return metrics && metrics.powerKwp > 0;
  }).length;

  const inverter = useSolarStore(s => s.inverters.entities[inverterId]);
  const inverterName = inverter?.model || 'MPPT Config';

  const currentTotalModules = mpptConfigs.reduce((total, mppt) => {
    return total + (mppt.strings || []).reduce((sum, str) => sum + str.modulesCount, 0);
  }, 0);

  const [targetModulesStr, setTargetModulesStr] = useState(currentTotalModules > 0 ? currentTotalModules.toString() : '');
  const autoDistributeModules = useTechStore(s => s.autoDistributeModules);

  const handleAutoDistribute = () => {
    const allModulesInProject = Object.keys(useSolarStore.getState().modules.entities).length;
    
    // Se o input estiver vazio ou zerado, ele pega magicamente a quantidade de módulos 3D já mapeada
    let total = parseInt(targetModulesStr || "0", 10);
    if (total <= 0 && allModulesInProject > 0) {
      total = allModulesInProject;
    }
    
    if (isNaN(total) || total <= 0) {
      alert('Por favor, informe uma quantidade total válida de módulos para distribuir ou adicione módulos na view 3D.');
      return;
    }

    let maxPerString = 40;
    const selObj = mpptConfigs[0]?.moduleModel 
      ? Object.values(useSolarStore.getState().modules.entities).find((m: any) => m.model === mpptConfigs[0].moduleModel)
      : module;
      
    if (selObj) {
      const repSpecs = getModuleSpecs(selObj);
      if (repSpecs) {
        const metrics1 = calculateStringMetrics(repSpecs, 1, tmin);
        if (metrics1.vocMax > 0) {
          maxPerString = Math.floor(limitVMax / metrics1.vocMax);
        }
      }
    } else {
      alert("Selecione um módulo fotovoltaico primeiro para calcular os limites térmicos.");
      return;
    }

    const { success, message } = autoDistributeModules(inverterId, total, maxPerString);
    
    if (!success) {
      alert(message);
    }
  };

  return (
    <div
      className={cn(
        // Oculto em telas < lg (mobile/tablet usa drawer separado)
        'hidden lg:flex flex-col shrink-0 border-r border-slate-800 bg-slate-950',
        'transition-[width] duration-300 ease-in-out relative',
        isCollapsed ? 'w-8' : 'w-[280px]'
      )}
    >
      {/* ── Toggle Button ─────────────────────────────────────────────── */}
      <button
        id="mppt-inspector-toggle"
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 z-20',
          'w-6 h-12 bg-slate-900 border border-slate-700 rounded-full',
          'flex items-center justify-center',
          'text-slate-500 hover:text-slate-200 hover:border-slate-500',
          'transition-all shadow-lg'
        )}
        title={isCollapsed ? 'Expandir Inspector MPPT' : 'Colapsar Inspector MPPT'}
        aria-expanded={!isCollapsed}
        aria-label="Toggle MPPT Inspector"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Estado Colapsado — label vertical ────────────────────────── */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <SlidersHorizontal size={13} className="text-slate-600" />
          {configuredCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-[8px] font-black text-emerald-400">{configuredCount}</span>
            </span>
          )}
          <span
            className="text-[8px] font-black uppercase tracking-widest text-slate-700 truncate max-h-48"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            title={inverterName}
          >
            {inverterName}
          </span>
        </div>
      )}

      {/* ── Estado Expandido ──────────────────────────────────────────── */}
      {!isCollapsed && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

          {/* Header do Inspector */}
          <div className="flex flex-col gap-2 px-3 py-2 border-b border-slate-800 shrink-0 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={11} className="text-slate-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate" title={inverterName}>
                {inverterName}
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[9px] font-mono text-slate-600">
                  {configuredCount}/{mpptConfigs.length}
                </span>
                {configuredCount === mpptConfigs.length && mpptConfigs.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                )}
              </div>
            </div>

            {/* Controle de Auto-Distribuição */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded p-1">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={targetModulesStr}
                onChange={(e) => setTargetModulesStr(e.target.value)}
                className="w-12 bg-transparent text-[11px] font-mono font-bold text-slate-300 px-1 outline-none text-center"
                title="Total de Módulos"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                módulos
              </span>
              <button
                onClick={handleAutoDistribute}
                className="ml-auto flex items-center gap-1 px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded transition-colors"
                title="Distribuir módulos inteligentemente"
              >
                <Sparkles size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">Auto</span>
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável — MPPTConfigStrip sem padding externo */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <MPPTConfigStrip
              inverterId={inverterId}
              mpptConfigs={mpptConfigs}
              mpptMetrics={mpptMetrics}
              updateMPPT={updateMPPT}
              addStringToMPPT={addStringToMPPT}
              removeStringFromMPPT={removeStringFromMPPT}
              updateStringInMPPT={updateStringInMPPT}
              limitVMax={limitVMax}
              limitVMpptMin={limitVMpptMin}
              limitIscMaxMppt={limitIscMaxMppt}
              startupVoltage={startupVoltage}
              tmin={tmin}
              module={module}
              forceSingleColumn={true}
            />
          </div>

        </div>
      )}
    </div>
  );
};
