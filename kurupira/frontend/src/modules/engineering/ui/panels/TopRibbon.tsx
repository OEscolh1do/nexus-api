/**
 * =============================================================================
 * TOP RIBBON — Ribbon Consolidado (U-01 / TRL 7-8)
 * =============================================================================
 *
 * Barra única do workspace de engenharia. Após U-01, o header global do
 * ProfileOrchestrator é ocultado em modo engineering — este componente
 * assume Logo, navegação de canvas views, ações de engenharia e controles
 * de usuário em uma única barra de 40px.
 *
 * Layout True Center (UX-013):
 * │ LEFT: Logo + Hub + Cliente + Toggles │ CENTER: Canvas Nav │ RIGHT: Tools + User │
 *
 * =============================================================================
 */

import {
  CheckCircle2,
  Undo2, Redo2, Save, LayoutDashboard,
  Activity, ChevronDown, Flag, Check, User,
  ShieldCheck, ShieldAlert, Minimize2, Maximize2, Loader2
} from 'lucide-react';
import { usePanelStore } from '../../store/panelStore';
import { ClientDataModal } from '../components/ClientDataModal';
import React from 'react';
import { useSolarStore, selectModules, selectInverters, selectClientData } from '@/core/state/solarStore';
import { useTemporalStore } from '@/core/state/useTemporalStore';
import { useTechKPIs } from '../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../hooks/useElectricalValidation';
import { useProjectContext } from '@/hooks/useProjectContext';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { getFdiStatus, FDI_STATUS_CONFIG } from '../../constants/thresholds';
import { useAuth } from '@/core/auth/useAuth';


// =============================================================================
// TYPES
// =============================================================================

interface TopRibbonProps {}

// Canvas views removidas do TopRibbon — migraram para WorkspaceTabs.tsx (Bottom Excel-like)

// =============================================================================
// COMPONENT
// =============================================================================

export const TopRibbon: React.FC<TopRibbonProps> = () => {
  const setActiveModule = useSolarStore(state => state.setActiveModule);
  const userRole = useSolarStore(state => state.userRole);
  const projectName = useSolarStore(s => s.clientData.projectName) || 'Projeto Sem Nome';
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const toggleSettingsDrawer = useUIStore(state => state.toggleSettingsDrawer);

  // @ts-ignore — signOut type varies by auth provider
  const { signOut } = useAuth();

  // Zundo Temporal Store
  const pastStates = useTemporalStore((state: any) => state.pastStates);
  const futureStates = useTemporalStore((state: any) => state.futureStates);
  const undo = useTemporalStore((state: any) => state.undo);
  const redo = useTemporalStore((state: any) => state.redo);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // ── Fullscreen ──
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // ── Save Design (antigo Export) ──
  const handleSave = async () => {
    if (saveStatus === 'saving' || saveStatus === 'success') return;
    setSaveStatus('saving');
    try {
      const panelState = usePanelStore.getState();
      if (panelState.centerContent !== 'map') {
        panelState.restoreMap();
        await new Promise(r => setTimeout(r, 300));
      }
      const { captureViewport } = await import('@/modules/proposal/utils/captureViewport');
      const { ProjectService } = await import('@/services/ProjectService');
      const dataUrl = await captureViewport();
      if (dataUrl) {
        const success = await ProjectService.saveDesign(dataUrl);
        if (success) {
          useUIStore.getState().setViewportSnapshot(dataUrl);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          console.error('[TopRibbon] Erro no backend ao salvar projeto.');
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } else {
        console.error('[TopRibbon] Erro ao gerar Imagem de Snapshot.');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('[TopRibbon] Exceção estrutural ao salvar:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="relative h-full w-full bg-slate-900 border-b border-slate-800 flex items-center px-0 select-none">

      {/* ── LEFT: Identity & Hub ── */}
      <div className="flex items-center h-full min-w-0">
        <button 
          onClick={() => setActiveModule('hub')} 
          className="px-3 h-full hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors border-r border-slate-800/50" 
          title="Voltar ao Explorador (Hub)"
        >
          <LayoutDashboard size={14} />
        </button>
        
        <div className="px-2 sm:px-3 flex items-center gap-2 sm:gap-3">
          <img src="/logo-neonorte.png" alt="Neonorte" className="h-3.5 w-auto opacity-40 shrink-0 hidden md:block" />
          <div className="h-3 w-px bg-slate-800 shrink-0 hidden md:block" />
          <div className="flex flex-col min-w-0">
             <span className="text-[10px] font-black text-white uppercase tracking-[0.1em] truncate max-w-[80px] sm:max-w-[150px] lg:max-w-[300px]">
               {projectName}
             </span>
          </div>
        </div>
      </div>

      {/* ── CENTER: Clean Spacer (Future Global Menu) ── */}
      <div className="flex-1" />

      {/* ── RIGHT: Status & Quick Actions ── */}
      <div className="flex items-center h-full">
        {/* Undo/Redo Group — Destacado apenas em desktop/tablet */}
        <div className="hidden sm:flex items-center h-full border-l border-slate-800/50">
          <button onClick={() => canUndo && undo()} disabled={!canUndo} className={cn("px-2 h-full transition-colors", canUndo ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-800 opacity-30')} title="Desfazer">
            <Undo2 size={13} />
          </button>
          <button onClick={() => canRedo && redo()} disabled={!canRedo} className={cn("px-2 h-full transition-colors", canRedo ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-800 opacity-30')} title="Refazer">
            <Redo2 size={13} />
          </button>
        </div>

        {/* Telemetry & Health Center */}
        <div className="h-full border-l border-slate-800/50 flex flex-nowrap">
           <ProjectStatusHub />
        </div>

        <div className="h-full border-l border-slate-800/50">
           <ApprovalDropdown />
        </div>

        {/* System Settings & User Group */}
        <div className="flex items-center h-full border-l border-slate-800/50">
          <button onClick={() => setIsClientModalOpen(true)} className="px-2.5 h-full hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors" title="Dados do Cliente">
            <User size={14} />
          </button>
          <button onClick={toggleSettingsDrawer} className="px-2.5 h-full hover:bg-slate-800 text-slate-500 hover:text-amber-400 transition-colors" title="Premissas Globais">
            <Activity size={14} />
          </button>
          <button onClick={toggleFullscreen} className="px-2.5 h-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors hidden sm:flex items-center" title="Tela Cheia">
             {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* SAVE CTA */}
        <button 
          onClick={handleSave} 
          disabled={saveStatus === 'saving' || saveStatus === 'success'} 
          className={cn(
            'flex items-center justify-center gap-2 px-3 sm:px-5 md:min-w-[124px] h-full text-[10px] font-black uppercase tracking-widest border-l border-slate-700 transition-all duration-300',
            saveStatus === 'idle' && 'text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95',
            saveStatus === 'saving' && 'text-slate-500 bg-slate-900 cursor-not-allowed',
            saveStatus === 'success' && 'text-emerald-50 bg-emerald-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]',
            saveStatus === 'error' && 'text-rose-100 bg-rose-600/80'
          )}
        >
          {saveStatus === 'idle' && <><Save size={13} /><span className="hidden md:inline">Salvar</span></>}
          {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden md:inline">Salvando</span></>}
          {saveStatus === 'success' && <><CheckCircle2 size={13} className="animate-in zoom-in" /><span className="hidden md:inline">Salvo</span></>}
          {saveStatus === 'error' && <><ShieldAlert size={13} /><span className="hidden md:inline">Erro</span></>}
        </button>

        {/* User Role Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 h-full border-l border-slate-800/50",
          userRole === 'ADMIN' ? 'bg-red-950/20' : 'bg-emerald-950/10'
        )}>
          {userRole === 'ADMIN' ? <ShieldAlert size={12} className="text-red-500" /> : <ShieldCheck size={12} className="text-emerald-500" />}
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter hidden xl:inline">{userRole}</span>
        </div>
      </div>
      
      <ClientDataModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
    </div>
  );
};

// =============================================================================
// CONSOLIDATED PROJECT STATUS HUB (Consolidates Health + Guidelines)
// =============================================================================

const ProjectStatusHub: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);
    const clientData = useSolarStore(selectClientData);
    const systemMinTemp = useSolarStore(state => state.settings.minHistoricalTemp);
    const { energyGoal } = useProjectContext();
    const { kpi } = useTechKPIs();
    const { electrical, inventory, globalHealth } = useElectricalValidation();

    // ── Logic: Engineering Guidelines ──
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

    // ── Logic: Health Check ──
    const fdiStatus = getFdiStatus(kpi.dcAcRatio);
    const fdiConfig = FDI_STATUS_CONFIG[fdiStatus];
    const fdiPercent = kpi.dcAcRatio * 100;
    const isMismatch = !inventory.isSynced;
    const isEmpty = modules.length === 0 || inverters.length === 0;

    // Determine Global Visual State
    const iconColor = isEmpty ? 'text-slate-600' : 
                     globalHealth === 'error' ? 'text-red-400' : 
                     globalHealth === 'warning' || isUnderSized ? 'text-amber-500' : 
                     'text-emerald-500';

    const statusLabel = isEmpty ? 'Vazio' :
                       globalHealth === 'error' ? 'Erro Elétrico' :
                       isUnderSized ? 'Subdimens.' :
                       'Conforme';

    return (
        <div className="relative group h-full">
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-full hover:bg-slate-800 transition-colors border-r border-slate-800/50">
                <Activity size={14} className={cn("transition-all", iconColor, !isEmpty && globalHealth === 'error' && "animate-pulse")} />
                <span className={cn("text-[9px] font-black uppercase tracking-[0.15em] hidden lg:inline", iconColor)}>
                    {statusLabel}
                </span>
                <ChevronDown size={10} className="text-slate-600 group-hover:text-slate-300 hidden sm:block" />
            </button>

            {/* Combined Popover Overlay */}
            <div className="absolute top-full right-0 w-72 bg-slate-900 border border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {/* Header Sub-bar */}
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status do Projeto</span>
                    <Activity size={12} className={iconColor} />
                </div>

                <div className="p-4 space-y-4">
                    {isEmpty ? (
                        <p className="text-[10px] text-slate-500">Configure os componentes principais para gerar telemetria.</p>
                    ) : (
                        <>
                            {/* KPI Sector */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">FDI DC/AC</span>
                                    <div className={cn("text-xs font-black tabular-nums", fdiConfig.color)}>
                                        {fdiPercent.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Geração Estimada</span>
                                    <div className="text-xs font-black text-slate-100 tabular-nums">
                                        ~{kpi.estimatedGeneration.toFixed(0)} kWh/mês
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800" />

                            {/* Electrical Sector */}
                            <div className="space-y-2">
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Estabilidade Elétrica</h5>
                                <div className="space-y-1.5 font-mono">
                                     <div className="flex justify-between items-center text-[10px]">
                                         <span className="text-slate-500">Voc Max ({systemMinTemp}°C)::</span>
                                         <span className={cn("font-bold", globalHealth === 'error' ? 'text-red-400' : 'text-emerald-500')}>
                                            {electrical?.entries?.[0]?.vocMax.toFixed(0) || 0}V
                                         </span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px]">
                                         <span className="text-slate-500">Sincronia Telhado/Lógico:</span>
                                         <span className={cn("font-bold", isMismatch ? 'text-amber-400' : 'text-emerald-500')}>
                                            {isMismatch ? 'Descalibrado' : 'OK'}
                                         </span>
                                     </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800" />

                            {/* Dimensioning Sector */}
                            <div className="space-y-2">
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Dimensões & Pesos</h5>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                                     <span className="text-slate-500">Módulos:</span>
                                     <span className="text-right font-bold text-slate-200">{currentQty} / {minModules} <span className="text-[8px] text-slate-500">Alvo</span></span>
                                     
                                     <span className="text-slate-500">Área total:</span>
                                     <span className="text-right font-bold text-slate-200">{totalAreaM2.toFixed(1)} m²</span>

                                     <span className="text-slate-500">Carga total:</span>
                                     <span className="text-right font-bold text-slate-200">{totalWeightKg.toFixed(0)} kg</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// Approval Workflow
const ApprovalDropdown: React.FC = () => {
    const projectStatus = useSolarStore(s => s.project.projectStatus);
    const setProjectStatus = useSolarStore(s => s.setProjectStatus);
    const [isOpen, setIsOpen] = React.useState(false);
    const { globalHealth } = useElectricalValidation();

    const STATUS_MAP = {
        draft: { label: 'Rascunho', color: 'text-slate-400', bg: 'bg-slate-900', icon: Flag },
        approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    };

    const current = STATUS_MAP[projectStatus] || STATUS_MAP.draft;

    return (
        <div className="relative group h-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-full transition-colors",
                    current.color, current.bg
                )}
            >
                <current.icon size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">{current.label}</span>
                <ChevronDown size={10} className="opacity-30 hidden sm:block" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 w-44 bg-slate-900 border border-slate-700 shadow-xl overflow-hidden z-50 py-1">
                    {(Object.keys(STATUS_MAP) as Array<keyof typeof STATUS_MAP>).map(s => (
                        <button
                            key={s}
                            onClick={() => {
                                if (s === 'approved' && globalHealth === 'error') {
                                    if (window.confirm("O sistema possui erros. Confirmar aprovação?")) {
                                        setProjectStatus(s); setIsOpen(false);
                                    }
                                } else {
                                    setProjectStatus(s); setIsOpen(false);
                                }
                            }}
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-between"
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
