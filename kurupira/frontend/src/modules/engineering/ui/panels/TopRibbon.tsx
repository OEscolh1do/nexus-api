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
  Undo2, Redo2, Save, ChevronLeft,
  Activity, ChevronDown, Flag, Check, User,
  ShieldCheck, ShieldAlert, Minimize2, Maximize2, Loader2, Zap
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
  const clientCity = useSolarStore(s => s.clientData.city) || '—';
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const toggleSettingsDrawer = useUIStore(state => state.toggleSettingsDrawer);

  // @ts-ignore
  const { signOut } = useAuth();

  const pastStates = useTemporalStore((state: any) => state.pastStates);
  const futureStates = useTemporalStore((state: any) => state.futureStates);
  const undo = useTemporalStore((state: any) => state.undo);
  const redo = useTemporalStore((state: any) => state.redo);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

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
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="relative h-full w-full bg-slate-900 border-b border-slate-800 flex items-center px-0 select-none">

      {/* ── LEFT: Branded Hub Return ── */}
      <div className="flex items-center h-full min-w-0">
        <button 
          onClick={() => setActiveModule('hub')} 
          className="group/hub flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 h-full hover:bg-slate-800/60 transition-all border-r border-slate-800/80 shrink-0 active:scale-[0.97]" 
          title="Voltar ao Explorador de Projetos"
        >
          {/* Chevron direcional — desliza no hover */}
          <ChevronLeft 
            size={12} 
            className="text-slate-600 group-hover/hub:text-emerald-400 transition-all duration-200 group-hover/hub:-translate-x-0.5" 
          />
          {/* Logo icon */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[4px] flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover/hub:shadow-[0_0_16px_rgba(16,185,129,0.4)] transition-shadow">
            <Zap size={11} className="text-slate-950 fill-slate-950" />
          </div>
          {/* Wordmark — hidden on ultra-narrow */}
          <span className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] text-slate-300 group-hover/hub:text-white transition-colors hidden xs:block">
            NEONORTE
          </span>
        </button>
        
        <div className="px-3 sm:px-4 flex items-center h-full border-r border-slate-800/40 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none hidden sm:inline">Projeto Ativo</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)] hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-100 uppercase tracking-widest truncate max-w-[80px] xs:max-w-[140px] sm:max-w-[240px] lg:max-w-[480px]">
                {projectName}
              </span>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden md:block">/ {clientCity}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* ── RIGHT: Telemetry & Controls ── */}
      <div className="flex items-center h-full">
        
        {/* History Control Group */}
        <div className="hidden md:flex items-center h-full border-l border-slate-800/80 bg-slate-950/20">
          <button 
            onClick={() => canUndo && undo()} 
            disabled={!canUndo} 
            className={cn(
              "px-3 h-full transition-all", 
              canUndo ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700' : 'text-slate-800 pointer-events-none opacity-20'
            )} 
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button 
            onClick={() => canRedo && redo()} 
            disabled={!canRedo} 
            className={cn(
              "px-3 h-full transition-all border-l border-slate-800/40", 
              canRedo ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700' : 'text-slate-800 pointer-events-none opacity-20'
            )} 
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Diagnostic & Status Hub */}
        <div className="h-full border-l border-slate-800/80 overflow-visible">
           <ProjectStatusHub />
        </div>

        {/* Workflow Approval */}
        <div className="h-full border-l border-slate-800/80 overflow-visible">
           <ApprovalDropdown />
        </div>

        {/* System Group */}
        <div className="flex items-center h-full border-l border-slate-800/80">
          <button 
            onClick={() => setIsClientModalOpen(true)} 
            className="hidden sm:flex px-2.5 sm:px-3 h-full hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-all active:bg-slate-700 items-center justify-center" 
            title="Ficha do Cliente"
          >
            <User size={14} />
          </button>
          <button 
            onClick={toggleSettingsDrawer} 
            className="hidden sm:flex px-2.5 sm:px-3 h-full hover:bg-slate-800 text-slate-500 hover:text-amber-400 transition-all border-l border-slate-800/40 active:bg-slate-700 items-center justify-center" 
            title="Configurações de Premissas"
          >
            <Activity size={14} />
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="px-3 h-full hover:bg-slate-800 text-slate-500 hover:text-white transition-all border-l border-slate-800/40 hidden lg:flex items-center active:bg-slate-700" 
            title="Alternar Tela Cheia"
          >
             {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* PERMANENCE CTA (SAVE) */}
        <button 
          onClick={handleSave} 
          disabled={saveStatus === 'saving' || saveStatus === 'success'} 
          className={cn(
            'flex items-center justify-center gap-2 px-3 sm:px-6 min-w-[40px] sm:min-w-[110px] h-full text-[10px] font-black uppercase tracking-[0.2em] border-l border-slate-700 transition-all duration-300',
            saveStatus === 'idle' && 'text-slate-100 bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]',
            saveStatus === 'saving' && 'text-slate-500 bg-slate-800 cursor-not-allowed',
            saveStatus === 'success' && 'text-white bg-blue-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]',
            saveStatus === 'error' && 'text-white bg-rose-600'
          )}
        >
          {saveStatus === 'idle' && <><Save size={13} /><span className="hidden sm:inline">Salvar</span></>}
          {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Sincronizando</span></>}
          {saveStatus === 'success' && <><CheckCircle2 size={13} className="animate-in zoom-in" /><span className="hidden sm:inline">Concluído</span></>}
          {saveStatus === 'error' && <><ShieldAlert size={13} /><span className="hidden sm:inline">Erro</span></>}
        </button>

        {/* User Auth Context */}
        <div className={cn(
          "hidden xl:flex items-center gap-2 px-4 h-full border-l border-slate-800/80",
          userRole === 'ADMIN' ? 'bg-rose-950/20' : 'bg-emerald-950/10'
        )}>
          {userRole === 'ADMIN' ? <ShieldAlert size={12} className="text-rose-500" /> : <ShieldCheck size={12} className="text-emerald-500" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none">Operador</span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none truncate max-w-[60px]">{userRole}</span>
          </div>
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

    const fdiStatus = getFdiStatus(kpi.dcAcRatio);
    const fdiConfig = FDI_STATUS_CONFIG[fdiStatus];
    const fdiPercent = kpi.dcAcRatio * 100;
    const isMismatch = !inventory.isSynced;
    const isEmpty = modules.length === 0 || inverters.length === 0;

    const iconColor = isEmpty ? 'text-slate-600' : 
                     globalHealth === 'error' ? 'text-rose-400' : 
                     globalHealth === 'warning' || isUnderSized ? 'text-amber-500' : 
                     'text-emerald-500';

    const statusLabel = isEmpty ? 'Vazio' :
                       globalHealth === 'error' ? 'Falha Elétrica' :
                       isUnderSized ? 'Subdimensionado' :
                       'Sistema OK';

    return (
        <div className="relative group h-full">
            <button className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 h-full hover:bg-slate-800 transition-all border-r border-slate-800/80 group/btn">
                <div className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-all shrink-0",
                  isEmpty ? 'bg-slate-800' : 
                  globalHealth === 'error' ? 'bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse' :
                  isUnderSized ? 'bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                  'bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                )}>
                  <Activity size={9} className={cn("transition-all sm:w-[10px] sm:h-[10px]", iconColor)} />
                </div>
                <div className="flex flex-col items-start gap-0">
                  <span className={cn("text-[7px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] leading-none hidden xs:inline", iconColor)}>
                      {statusLabel}
                  </span>
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Central de Diagnóstico</span>
                    <ChevronDown size={8} className="text-slate-600 group-hover/btn:text-slate-400 transition-colors" />
                  </div>
                </div>
            </button>

            {/* ── Popover SCADA ── */}
            <div className="absolute top-full right-0 w-80 bg-slate-900 border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000] overflow-hidden translate-y-1 group-hover:translate-y-0">
                {/* Header SCADA */}
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", iconColor.replace('text-', 'bg-'))} />
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Painel de Diagnóstico</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 tracking-widest">v3.8.1_ATIVO</span>
                </div>

                <div className="p-4 space-y-5 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent)]">
                    {isEmpty ? (
                        <div className="py-4 text-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nenhum componente detectado</p>
                          <p className="text-[9px] text-slate-600 mt-1">O motor de análise aguarda a inserção de módulos e inversores.</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 rounded-sm overflow-hidden">
                                <div className="bg-slate-900 p-3 space-y-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">FDI (DC/AC)</span>
                                    <div className={cn("text-lg font-black tabular-nums leading-none", fdiConfig.color)}>
                                        {fdiPercent.toFixed(1)}%
                                    </div>
                                    <div className="text-[7px] font-bold text-slate-600 uppercase">{fdiStatus}</div>
                                </div>
                                <div className="bg-slate-900 p-3 space-y-1 border-l border-slate-800">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Geração Est.</span>
                                    <div className="text-lg font-black text-slate-100 tabular-nums leading-none">
                                        {kpi.estimatedGeneration.toFixed(0)} <span className="text-[10px] text-slate-500">kWh</span>
                                    </div>
                                    <div className="text-[7px] font-bold text-slate-600 uppercase">Média Mensal</div>
                                </div>
                            </div>

                            {/* Detailed Telemetry Tables */}
                            <div className="space-y-4">
                                {/* Row: Elétrica */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-px flex-1 bg-slate-800" />
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Parâmetros Elétricos</span>
                                      <div className="h-px flex-1 bg-slate-800" />
                                    </div>
                                    <div className="space-y-1 font-mono text-[10px]">
                                         <div className="flex justify-between items-center py-1 border-b border-slate-800/30">
                                             <span className="text-slate-500 uppercase tracking-tighter">Voc Máx Estendido ({systemMinTemp}°C)</span>
                                             <span className={cn("font-bold tabular-nums", globalHealth === 'error' ? 'text-rose-400' : 'text-emerald-500')}>
                                                {electrical?.entries?.[0]?.vocMax.toFixed(2) || 0}V
                                             </span>
                                         </div>
                                         <div className="flex justify-between items-center py-1">
                                             <span className="text-slate-500 uppercase tracking-tighter">Sincronia Inventário</span>
                                             <span className={cn("font-bold", isMismatch ? 'text-amber-400' : 'text-emerald-500')}>
                                                {isMismatch ? '⚠ DESALINHADO' : '✓ SINCRONIZADO'}
                                             </span>
                                         </div>
                                    </div>
                                </div>

                                {/* Row: Físico */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-px flex-1 bg-slate-800" />
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Carga & Superfície</span>
                                      <div className="h-px flex-1 bg-slate-800" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-bold text-slate-600 uppercase">Módulos (Inst/Alvo)</span>
                                        <span className={cn("text-[11px] font-black tabular-nums", isUnderSized ? 'text-amber-400' : 'text-slate-200')}>
                                          {currentQty} <span className="text-slate-600">/</span> {minModules}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[8px] font-bold text-slate-600 uppercase">Massa do Arranjo</span>
                                        <span className="text-[11px] font-black text-slate-200 tabular-nums">
                                          {totalWeightKg.toFixed(1)} <span className="text-slate-600 font-bold">kg</span>
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-bold text-slate-600 uppercase">Área Total</span>
                                        <span className="text-[11px] font-black text-slate-200 tabular-nums">
                                          {totalAreaM2.toFixed(2)} <span className="text-slate-600 font-bold">m²</span>
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[8px] font-bold text-slate-600 uppercase">Potência Instalada</span>
                                        <span className="text-[11px] font-black text-emerald-400 tabular-nums">
                                          {(modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000).toFixed(2)} <span className="font-bold text-emerald-900/60 text-[9px]">kWp</span>
                                        </span>
                                      </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Footer SCADA */}
                <div className="bg-slate-950/50 px-4 py-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">Motor de Engenharia de Precisão</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-emerald-500/20" />
                    <div className="w-1 h-1 bg-emerald-500/40" />
                    <div className="w-1 h-1 bg-emerald-500/60" />
                  </div>
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
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora (corrigido para 'click' para evitar conflito com onClick)
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]); 

    const STATUS_MAP = {
        draft: { 
          label: 'Rascunho', 
          color: 'text-slate-400', 
          bg: 'bg-slate-900', 
          icon: Flag,
          border: 'border-slate-800'
        },
        approved: { 
          label: 'Aprovado', 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/5', 
          icon: CheckCircle2,
          border: 'border-emerald-500/20'
        },
    };

    const current = STATUS_MAP[projectStatus] || STATUS_MAP.draft;

    const handleSelect = (s: 'draft' | 'approved') => {
        if (s === 'approved' && globalHealth === 'error') {
            if (window.confirm("O sistema detectou falhas críticas. Confirmar aprovação técnica mesmo assim?")) {
                setProjectStatus(s);
            }
        } else {
            setProjectStatus(s);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative h-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className={cn(
                    "flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 h-full transition-all border-r border-slate-800/80 hover:bg-slate-800/50 z-10 relative",
                    current.color, current.bg
                )}
            >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all shrink-0",
                  projectStatus === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'
                )} />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] hidden xs:inline">{current.label}</span>
                <ChevronDown size={10} className={cn("transition-transform duration-200 opacity-30 hidden sm:block", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div 
                  className="absolute top-[calc(100%+4px)] right-0 w-48 bg-slate-900 border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[1000] py-1 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                    <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fluxo de Aprovação</span>
                    </div>
                    {(Object.keys(STATUS_MAP) as Array<'draft' | 'approved'>).map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-[10px] font-bold transition-colors flex items-center justify-between group/item",
                              projectStatus === s ? 'bg-slate-800/50 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            )}
                        >
                            <div className="flex items-center gap-2">
                              <span className={cn("transition-colors", projectStatus === s ? STATUS_MAP[s].color : 'text-slate-500 group-hover/item:text-slate-300')}>
                                {STATUS_MAP[s].label}
                              </span>
                            </div>
                            {projectStatus === s && <Check size={10} className="text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
