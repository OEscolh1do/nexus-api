/**
 * =============================================================================
 * TOP RIBBON — Comandos O(1) e Contexto Global (UX-001 Fase 3)
 * =============================================================================
 *
 * Barra horizontal fixada no topo do Workspace.
 * Abriga os controlos globais e disparadores de simulação.
 * Modos de ferramenta: Cursor, Desenhar Polígono, Medir, Colocar Módulos.
 *
 * Consome `activeTool` do Zustand Store (ou via props para isolamento).
 * =============================================================================
 */

import {
  MousePointer2, Pentagon, Ruler, LayoutGrid,
  Sun, Zap, Info, CheckCircle2, AlertTriangle, Scale,
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  Undo2, Redo2, Download, LayoutDashboard,
  Activity, ChevronDown, Flag, Check, type LucideIcon
} from 'lucide-react';
import React from 'react';
import { useSolarStore, selectModules, selectInverters, selectClientData } from '@/core/state/solarStore';
import { useTemporalStore } from '@/core/state/useTemporalStore';
import { useTechKPIs } from '../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../hooks/useElectricalValidation';
import { useProjectContext } from '@/hooks/useProjectContext';
import { cn } from '@/lib/utils';
import { useUIStore, type Tool } from '@/core/state/uiStore';
import { useTechStore } from '../../store/useTechStore';
import { toArray } from '@/core/types/normalized.types';

// =============================================================================
// TOOL CONFIG
// =============================================================================

interface ToolConfig {
  id: Tool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'SELECT', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
  { id: 'POLYGON', icon: Pentagon, label: 'Desenhar Polígono', shortcut: 'P' },
  { id: 'MEASURE', icon: Ruler, label: 'Medir Distância', shortcut: 'M' },
  { id: 'PLACE_MODULE', icon: LayoutGrid, label: 'Colocar Módulos', shortcut: 'L' },
];

// =============================================================================
// PROPS
// =============================================================================

interface TopRibbonProps {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const TopRibbon: React.FC<TopRibbonProps> = ({
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}) => {
  const setActiveModule = useSolarStore(state => state.setActiveModule);
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  // Zundo Temporal Store for Undo/Redo
  const pastStates = useTemporalStore((state: any) => state.pastStates);
  const futureStates = useTemporalStore((state: any) => state.futureStates);
  const undo = useTemporalStore((state: any) => state.undo);
  const redo = useTemporalStore((state: any) => state.redo);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // UI State for P7-2 Backend Persistence
  const [isExporting, setIsExporting] = React.useState(false);

  // Engineering KPIs (P1-2)
  const { kpi, displayedPr } = useTechKPIs();

  return (
    <div className="h-full w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 select-none">

      {/* ── LEFT: Panel Toggles + Module Context ── */}
      <div className="flex items-center gap-1">
        {/* Back to Hub */}
        <button
          onClick={() => setActiveModule('hub')}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors mr-1"
          title="Voltar ao Explorador"
        >
          <LayoutDashboard size={14} />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Panel toggles */}
        <button
          onClick={onToggleLeft}
          className={`p-1.5 rounded-md transition-colors ${leftOpen ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
          title={leftOpen ? 'Ocultar Outliner' : 'Mostrar Outliner'}
        >
          {leftOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
        <button
          onClick={onToggleRight}
          className={`p-1.5 rounded-md transition-colors ${rightOpen ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
          title={rightOpen ? 'Ocultar Inspector' : 'Mostrar Inspector'}
        >
          {rightOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
      </div>

      {/* ── CENTER: Tool Palette ── */}
      {/* P2-1: Tool Buttons */}
      <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                activeTool === tool.id
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon size={12} className={activeTool === tool.id ? "text-slate-900" : "text-slate-500"} />
              <span className="hidden xl:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── METRICS WIDGETS (P1-2) ── */}
      <div className="flex items-center gap-2 mr-auto ml-4 hidden md:flex">
        {/* kWp Widget */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/50 border border-slate-700/50 min-w-[110px] max-w-[180px]">
           <Sun size={12} className="text-amber-400" />
           <div className="flex flex-col leading-none">
             <span className="text-[8px] font-bold text-slate-500 uppercase">Potência DC</span>
             <span className="text-[10px] font-bold text-slate-200">{kpi.totalDC.toFixed(2)} <span className="font-normal text-slate-500">kWp</span></span>
           </div>
        </div>

        {/* FDI Widget */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/50 border border-slate-700/50 min-w-[110px] max-w-[180px]">
           <Zap size={12} className={kpi.dcAcRatio > 1.35 ? "text-red-400" : kpi.dcAcRatio < 0.8 ? "text-amber-400" : "text-emerald-400"} />
           <div className="flex flex-col leading-none">
             <span className="text-[8px] font-bold text-slate-500 uppercase">FDI (DC/AC)</span>
             <span className="text-[10px] font-bold text-slate-200">{kpi.dcAcRatio.toFixed(2)}x <span className="font-normal text-slate-500">({kpi.totalAC.toFixed(1)}kW)</span></span>
           </div>
        </div>

        {/* PR Widget */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/50 border border-slate-700/50 min-w-[110px] max-w-[180px]">
           <Activity size={12} className="text-blue-400" />
           <div className="flex flex-col leading-none">
             <span className="text-[8px] font-bold text-slate-500 uppercase">Performance</span>
             <span className="text-[10px] font-bold text-slate-200">PR: {displayedPr}%</span>
           </div>
        </div>
      </div>

      {/* ── RIGHT: Validation, Undo/Redo + Export ── */}
      <div className="flex items-center gap-1.5 min-w-max pr-1">
        
        {/* P3-3: Engineering Guidelines */}
        <EngineeringGuidelinesWidget />

        {/* P3-2: System Health Check */}
        <HealthCheckWidget />

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* P3-1: Approval Flow */}
        <ApprovalDropdown />

        <div className="h-5 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => canUndo && undo()}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-800 cursor-not-allowed'}`}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => canRedo && redo()}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-800 cursor-not-allowed'}`}
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <button
          onClick={async () => {
            if (isExporting) return;
            setIsExporting(true);
            try {
              console.log('[TopRibbon] Iniciando geração da proposta...');
              const { captureViewport } = await import('@/modules/proposal/utils/captureViewport');
              const { ProjectService } = await import('@/services/ProjectService');

              const dataUrl = await captureViewport();
              if (dataUrl) {
                const success = await ProjectService.saveDesign(dataUrl);
                if (success) {
                  // Salva a foto em base64 na store de UI para que o ProposalModule possa exibi-la
                  useUIStore.getState().setViewportSnapshot(dataUrl);
                  
                  // Muda a tela para a Tab de Proposta
                  setActiveModule('proposal');
                } else {
                  alert('Erro ao salvar projeto no servidor. Verifique o console.');
                }
              } else {
                console.error('[TopRibbon] Falha ao capturar mapa (dataUrl vazio).');
                alert('Erro ao gerar imagem térmica do telhado.');
              }
            } catch (err) {
              console.error('[TopRibbon] Erro durante exportação:', err);
              alert('Erro fatal durante exportação da proposta.');
            } finally {
              setIsExporting(false);
            }
          }}
          disabled={isExporting}
          className={`flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-md text-[11px] font-bold border transition-all ${
            isExporting 
              ? 'text-slate-400 bg-slate-800 border-slate-700 cursor-not-allowed opacity-70' 
              : 'text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700'
          }`}
          title="Salvar Projeto & Exportar Proposta PDF"
        >
          {isExporting ? (
            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={12} className="text-emerald-400" />
          )}
          <span className="hidden xl:inline">{isExporting ? 'Salvando...' : 'Exportar API'}</span>
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS FOR P3
// =============================================================================

// P3-1: Fluxo de Aprovação
const ApprovalDropdown: React.FC = () => {
    const projectStatus = useSolarStore(s => s.project.projectStatus);
    const setProjectStatus = useSolarStore(s => s.setProjectStatus);
    const [isOpen, setIsOpen] = React.useState(false);

    const STATUS_MAP = {
        draft: { label: 'Rascunho (Destravado)', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' },
        approved: { label: 'Aprovado (Travado)', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/50' },
    };

    const current = STATUS_MAP[projectStatus] || STATUS_MAP.draft;

    return (
        <div className="relative" onMouseLeave={() => setIsOpen(false)}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors", current.color, current.bg, current.border)}
            >
                <Flag size={10} />
                <span>{current.label}</span>
                <ChevronDown size={10} className="ml-1 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 right-0 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    {(Object.keys(STATUS_MAP) as Array<keyof typeof STATUS_MAP>).map(s => (
                        <button
                            key={s}
                            onClick={() => { setProjectStatus(s); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                        >
                            <span className={STATUS_MAP[s].color}>{STATUS_MAP[s].label}</span>
                            {projectStatus === s && <Check size={10} className="text-slate-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const HealthCheckWidget: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);
    const placedModules = useSolarStore(state => state.project.placedModules);
    useTechKPIs(); // Subscribes to general KPIs
    const { validateMPPT, systemMinTemp } = useElectricalValidation();
    const { inverters: techInvertersNorm } = useTechStore();
    const techInverters = toArray(techInvertersNorm);

    const totalModulePowerWp = modules.reduce((acc, m) => acc + (m.power), 0);
    const totalInverterPowerKw = inverters.reduce((acc, i) => acc + (i.nominalPower * i.quantity), 0);
    const overloadRatio = totalInverterPowerKw > 0 ? (totalModulePowerWp / 1000) / totalInverterPowerKw : 0;

    // Evaluate Oversizing limits
    const isHighOverload = overloadRatio > 1.35;
    const isLowOverload = overloadRatio > 0 && overloadRatio < 0.75;
    
    let isVocUnsafe = false;
    const currentViolations: string[] = [];
    let maxVocGenerated = 0;
    let logicalModuleCount = 0;
    
    // Calculate Component Limits via Thermal Engine Hook (P6-2)
    techInverters.forEach(techInv => {
        techInv.mpptConfigs.forEach(mppt => {
            const validation = validateMPPT(techInv.id, mppt.mpptId);
            if (!validation) return;

            if (validation.logicalCount > 0 || validation.physicallyAssigned > 0) {
                logicalModuleCount += validation.logicalCount;
                
                if (validation.isVocUnsafe) isVocUnsafe = true;
                if (validation.vocMax > maxVocGenerated) maxVocGenerated = validation.vocMax;
                
                if (validation.isCurrentUnsafe) {
                    currentViolations.push(`MPPT ${mppt.mpptId}: ${validation.iscMax.toFixed(1)}A > ${validation.inverterMaxCurrent}A máx.`);
                }
            }
        });
    });

    // Physical vs Logical Cross-check (Ação 3)
    const isMismatch = placedModules.length > 0 && logicalModuleCount > 0 && placedModules.length !== logicalModuleCount;

    const isCurrentUnsafe = currentViolations.length > 0;
    const hasCritical = isVocUnsafe || isHighOverload || isCurrentUnsafe;
    const hasWarning = isLowOverload || isMismatch;
    const isEmpty = modules.length === 0 || inverters.length === 0;

    const iconColor = isEmpty ? 'text-slate-600' : hasCritical ? 'text-red-50' : hasWarning ? 'text-amber-500' : 'text-emerald-500';
    const bgColor = isEmpty ? 'bg-slate-800/50' : hasCritical ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] border-red-400' : hasWarning ? 'bg-amber-500/10' : 'bg-emerald-500/10';

    return (
        <div className="relative group">
            <div className={cn("p-1.5 rounded cursor-help transition-all duration-300 border hover:border-slate-700", bgColor)}>
                <Activity size={14} className={iconColor} />
                {hasCritical && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </div>

            {/* Popover */}
            <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                    <Activity size={10} /> Health Check
                </h4>

                {isEmpty ? (
                    <p className="text-[10px] text-slate-500">Adicione módulos e inversores para ver o status sistêmico.</p>
                ) : (
                    <div className="space-y-2">
                        {/* Overload */}
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500">FDI (Fator de Dimensionamento)</span>
                            <div className="flex flex-col mt-0.5">
                                <span className={cn("text-xs font-bold", isHighOverload ? 'text-red-400' : isLowOverload ? 'text-amber-400' : 'text-emerald-400')}>
                                    {(overloadRatio * 100).toFixed(1)}% {isHighOverload ? '(Clipping)' : isLowOverload ? '(Oversized AC)' : '(Ideal)'}
                                </span>
                            </div>
                        </div>
                        {/* Electrical Integrity */}
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500">Integridade Elétrica</span>
                            <div className="flex flex-col mt-0.5 space-y-1">
                                <span className={cn("text-xs font-bold", isVocUnsafe ? 'text-red-400' : 'text-emerald-400')}>
                                    Voc Inverno ({systemMinTemp}°C): {maxVocGenerated.toFixed(0)}V {isVocUnsafe && '(Risco Violado!)'}
                                </span>
                                <span className={cn("text-xs font-bold", isCurrentUnsafe ? 'text-red-400' : 'text-emerald-400')}>
                                    Corrente MPPT (Isc): {isCurrentUnsafe ? 'Excedida (Risco!)' : 'Ok'}
                                </span>
                                {currentViolations.map((msg, idx) => (
                                    <span key={idx} className="text-[10px] text-red-400/80 leading-tight">
                                        • {msg}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {/* Physical vs Logical (Ação 3) */}
                        <div className="flex flex-col border-t border-slate-800 pt-2 mt-2">
                            <span className="text-[9px] text-slate-500">Modelagem Físico-Lógica</span>
                            <div className="flex flex-col mt-0.5">
                                <span className={cn("text-xs font-bold", isMismatch ? 'text-amber-400' : 'text-emerald-400')}>
                                    Módulos Lógicos: {logicalModuleCount} <br/>
                                    Módulos no Telhado: {placedModules.length}
                                    {isMismatch && <span className="block text-[10px] uppercase font-bold text-amber-500/80 mt-1">Status: Inconsistente</span>}
                                    {!isMismatch && placedModules.length > 0 && <span className="block text-[10px] uppercase font-bold text-emerald-500/80 mt-1">Status: Sincronizado</span>}
                                    {!isMismatch && placedModules.length === 0 && <span className="block text-[10px] uppercase font-bold text-slate-500/80 mt-1">Status: Físico Vazio</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// P3-3: Engineering Guidelines Popover
const EngineeringGuidelinesWidget: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const { energyGoal } = useProjectContext();

    const currentQty = modules.length;
    const totalAreaM2 = modules.reduce((acc, m) => acc + (m.area), 0);
    const totalWeightKg = modules.reduce((acc, m) => acc + (m.weight), 0);

    const refPowerKw = modules.length > 0 ? modules[0].power / 1000 : 0.55;
    const validHsp = (clientData.monthlyIrradiation || []).filter(v => v > 0);
    const avgHsp = validHsp.length > 0 ? validHsp.reduce((a, b) => a + b, 0) / validHsp.length : 4.5;

    const targetGeneration = energyGoal.monthlyTarget || 0;
    const minModules = refPowerKw > 0 && avgHsp > 0
        ? Math.ceil(targetGeneration / (avgHsp * 30 * refPowerKw * 0.75))
        : 0;

    const isUnderSized = currentQty < minModules;

    return (
        <div className="relative group">
            <div className={cn("p-1.5 rounded cursor-help transition-colors border border-transparent hover:border-slate-700 text-blue-400 hover:bg-blue-900/10")}>
                <Info size={14} />
            </div>

            {/* Popover */}
            <div className="absolute top-full mt-2 right-0 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                    <Scale size={10} className="text-blue-400" /> Diretrizes de Projeto
                </h4>

                <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Min. Módulos p/ Meta:</span>
                        <span className="font-bold text-slate-300">{minModules} unid.</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Contagem Atual:</span>
                        <span className={cn("font-bold flex items-center gap-1", isUnderSized ? "text-amber-400" : "text-emerald-400")}>
                            {currentQty} {isUnderSized ? <AlertTriangle size={8}/> : <CheckCircle2 size={8}/>}
                        </span>
                    </div>
                    <div className="h-px bg-slate-800 my-1" />
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Área Exigida:</span>
                        <span className="font-bold text-slate-300">{totalAreaM2.toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Peso no Telhado:</span>
                        <span className="font-bold text-slate-300">{totalWeightKg.toFixed(0)} kg</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
