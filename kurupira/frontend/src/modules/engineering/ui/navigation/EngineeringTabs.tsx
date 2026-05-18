import React, { useRef } from 'react';
import { useUIStore, type FocusedBlock } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import {
  MapPin, Zap, Sun, Cpu, Layout, TrendingUp, FileSignature, Lock
} from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechKPIs } from '../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../hooks/useElectricalValidation';
import { useProposalCalculator } from '@/modules/proposal/hooks/useProposalCalculator';

interface TabItem {
  id: FocusedBlock;
  label: string;
  icon: React.ElementType<{ size?: number; className?: string }>;
  unit?: string;
}

const TABS: TabItem[] = [
  { id: 'site', label: 'Projeto', icon: MapPin, unit: 'hsp' },
  { id: 'consumption', label: 'Consumo', icon: Zap, unit: 'kwh' },
  { id: 'module', label: 'Módulos', icon: Sun, unit: 'kwh' },
  { id: 'inverter', label: 'Inversores', icon: Cpu, unit: 'fdi' },
  { id: 'arrangement', label: 'Arranjo', icon: Layout, unit: '' },
  { id: 'projection', label: 'Projeção', icon: TrendingUp, unit: 'mwh' },
  { id: 'proposal', label: 'Proposta', icon: FileSignature, unit: 'anos' },
];

export const EngineeringTabs: React.FC = () => {
  const activeTab = useUIStore(s => s.activeFocusedBlock);
  const setTab = useUIStore(s => s.setFocusedBlock);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Telemetry Hooks
  const clientData = useSolarStore(s => s.clientData);
  const project = useSolarStore(s => s.project);
  const totalModules = useSolarStore(s => selectModules(s).length);
  const totalInverters = useSolarStore(s => selectInverters(s).length);
  const { kpi } = useTechKPIs();
  const { globalHealth } = useElectricalValidation();
  const { financials } = useProposalCalculator();

  const isConsumptionValid = (clientData?.averageConsumption ?? 0) > 0;
  const isModulesValid = totalModules > 0;

  const isTabLocked = (id: FocusedBlock) => {
    if (id === 'module' && !isConsumptionValid) return true;
    if ((id === 'inverter' || id === 'arrangement') && !isModulesValid) return true;
    if (id === 'projection' && (!isConsumptionValid || !isModulesValid)) return true;
    return false;
  };

  const getIndicator = (id: FocusedBlock) => {
    switch (id) {
      case 'site':
        const hsp = (clientData?.monthlyIrradiation ?? []).reduce((a, b) => a + (b ?? 0), 0) / 12 || 0;
        return hsp > 0 ? hsp.toFixed(1) : '--';
      case 'consumption':
        return (clientData?.averageConsumption ?? 0) > 0 ? String(clientData.averageConsumption) : '--';
      case 'module':
        return totalModules > 0 ? (kpi.estimatedGeneration).toFixed(0) : '--';
      case 'inverter':
        return totalInverters > 0 ? (kpi.dcAcRatio * 100).toFixed(0) : '--';
      case 'arrangement':
        return project.placedModules.length > 0 ? (globalHealth === 'ok' ? 'ESTÁVEL' : 'AVISO') : '--';
      case 'projection':
        return kpi.estimatedGeneration > 0 ? (kpi.estimatedGeneration * 12 / 1000).toFixed(1) : '--';
      case 'proposal':
        return financials.paybackYears > 0 ? financials.paybackYears.toFixed(1) : '--';
      default:
        return null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + TABS.length) % TABS.length;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[newIndex];
    if (!isTabLocked(nextTab.id)) {
      setTab(nextTab.id);
      if (nextTab.id === 'arrangement') setCanvasViewMode('CONTEXT');
      tabRefs.current[newIndex]?.focus();
    }
  };

  return (
    <div 
      className="flex items-center h-full px-2 overflow-x-auto scrollbar-hide select-none"
      role="tablist"
    >
      {TABS.map((tab, i) => {
        const isActive = activeTab === tab.id;
        const locked = isTabLocked(tab.id);
        const Icon = tab.icon;
        const indicator = getIndicator(tab.id);

        return (
          <button
            key={tab.id}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={locked}
            onClick={() => {
              if (locked) return;
              setTab(tab.id);
              if (tab.id === 'arrangement') setCanvasViewMode('CONTEXT');
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "relative flex flex-col items-start justify-center min-w-[90px] flex-shrink-1 px-4 h-full transition-all duration-300 outline-none group border-r border-slate-800/20 pt-1 overflow-hidden",
              isActive 
                ? "bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent" 
                : locked 
                  ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(30,41,59,0.2)_8px,rgba(30,41,59,0.2)_16px)] cursor-not-allowed" 
                  : "hover:bg-slate-800/30"
            )}
          >
            {/* v6.0 VERTICAL INDICATOR */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-indigo-500 rounded-r-full shadow-[2px_0_15px_rgba(99,102,241,0.6)] animate-in slide-in-from-left-full duration-500" />
            )}

            <div className="flex items-center gap-2 mb-1 ml-1">
              {locked ? (
                <Lock size={11} className="text-slate-700" />
              ) : (
                <Icon size={13} className={cn(
                  "transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-0.5",
                  isActive 
                    ? "text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" 
                    : "text-slate-600 group-hover:text-indigo-300"
                )} />
              )}
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap transition-colors",
                isActive ? "text-white" : "text-slate-600 group-hover:text-slate-300",
                locked && "text-slate-700"
              )}>
                {tab.label}
              </span>
            </div>

            {/* MASTER KPI INDICATOR */}
            <div className={cn(
              "flex items-baseline gap-1 transition-colors ml-1",
              isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-500",
              indicator === '--' && "opacity-20",
              locked && "opacity-10"
            )}>
              <span className="text-[12px] font-black font-mono tabular-nums leading-none tracking-tight">
                {indicator}
              </span>
              {indicator !== '--' && !locked && (
                 <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">{tab.unit || ''}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
