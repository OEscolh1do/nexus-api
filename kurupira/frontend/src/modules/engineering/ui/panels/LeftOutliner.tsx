import { Zap, MapPin, Sun, Cpu, Lock, ChevronsLeft, TrendingUp } from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { ComposerBlockModule } from './canvas-views/composer/ComposerBlockModule';
import { ComposerBlockInverter } from './canvas-views/composer/ComposerBlockInverter';
import { ComposerBlockProjection } from './canvas-views/composer/ComposerBlockProjection';
import { ComposerBlockProposal } from './canvas-views/composer/ComposerBlockProposal';
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { usePanelStore } from '../../store/panelStore';
import { useSystemComposition } from '@/core/state/slices/systemCompositionSlice';

// =============================================================================
// FLOW CONNECTOR — Lego Tab
// =============================================================================

const FlowConnector: React.FC<{ colorClass: string }> = ({ colorClass }) => (
    <div className="flex justify-center h-1.5 relative shrink-0">
        <div className={cn("w-6 h-full border-x border-black/40 shadow-sm opacity-100", colorClass)} />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white/20 blur-[1px]" />
        </div>
    </div>
);

// =============================================================================
// LOCKED GHOST BLOCK — Peça faltante no quebra-cabeça
// =============================================================================

interface LockedBlockProps {
    label: string;
    icon: React.ReactNode;
    hint: string;
}

const LockedBlock: React.FC<Omit<LockedBlockProps, 'hint'>> = ({ label, icon }) => (
    <div className="flex flex-col opacity-80 shrink-0">
        <div className="relative mx-3 rounded-sm border border-dashed border-slate-700 bg-slate-900/20 flex flex-col overflow-visible transition-all duration-500 pointer-events-none select-none z-0">
            <div className="px-3 py-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center border border-slate-700/50 text-slate-500 shadow-inner">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-500">
                    {label}
                </span>
                <Lock size={9} className="ml-auto text-slate-600" />
            </div>
        </div>
    </div>
);

// =============================================================================
// SITE BLOCK — Identificação do Contexto (Ponto de Entrada)
// =============================================================================

const SiteBlock: React.FC = () => {
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const selectEntity = useUIStore(s => s.selectEntity);
    
    const clientData = useSolarStore(s => s.clientData);
    const weatherData = useSolarStore(s => s.weatherData);
    
    const city = clientData?.city || '';
    const state = clientData?.state || '';
    const address = clientData?.street ? `${clientData.street}${clientData.number ? `, ${clientData.number}` : ''}` : '';

    const isFocused = focusedBlock === 'site';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'site';
    const hasLocation = city !== '' && state !== '';

    return (
        <div 
            onClick={() => {
                setFocusedBlock('site');
                selectEntity('site', 'project-site', 'Projeto');
            }}
            className={cn(
                "relative rounded-none border flex flex-col overflow-hidden transition-all duration-300 z-40 cursor-pointer shrink-0",
                isFocused 
                    ? "border-indigo-500 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50" 
                    : isDeemphasized 
                        ? "border-indigo-600/20 bg-indigo-950/70 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
                        : "border-indigo-600/40 bg-indigo-950/70 hover:border-indigo-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-indigo-500/10 bg-gradient-to-r from-indigo-900/15 to-transparent h-10">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner shrink-0">
                    <MapPin size={11} />
                </div>
                <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
                    Projeto
                </span>
            </div>

            {/* Summary Bar (Semi-Resumido) */}
            {!isFocused && hasLocation && (
                <div className="px-4 py-1.5 flex items-center gap-2 bg-indigo-950/40 border-b border-indigo-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center px-1.5 py-0.5 rounded-[4px] bg-slate-900/60 border border-slate-800/50 max-w-[120px]">
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter truncate">
                            {city}
                        </span>
                    </div>
                    {weatherData?.hsp_avg && (
                        <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                            <span className="text-[11px] font-black text-amber-400 tracking-tighter">
                                {weatherData.hsp_avg.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HSP</span>
                        </div>
                    )}
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                </div>
            )}

            <div className={cn(
                "flex flex-col transition-all duration-300",
                isFocused ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none"
            )}>
                <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-800/60 bg-black/40 border-b border-indigo-500/10 backdrop-blur-md">
                    {/* Localização */}
                    <div className="p-4 flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] text-indigo-400/80 font-black uppercase tracking-widest leading-none">Localização</span>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-slate-100 uppercase truncate leading-tight">
                                {city}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                                {state} / Brasil
                            </span>
                        </div>
                    </div>

                    {/* Métricas Climáticas */}
                    <div className="p-4 flex flex-col gap-3 items-end text-right min-w-[100px]">
                        {weatherData?.hsp_avg !== undefined && (
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">HSP</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-amber-400 font-mono tracking-tighter tabular-nums leading-none">
                                        {weatherData.hsp_avg.toFixed(2)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWh/m²</span>
                                </div>
                            </div>
                        )}
                        {weatherData?.ambient_temp_avg !== undefined && (
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Temp.</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-rose-400 font-mono tracking-tighter tabular-nums leading-none">
                                        {weatherData.ambient_temp_avg.toFixed(1)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">°C</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {address && (
                    <div className="px-4 py-2.5 flex items-center gap-2 bg-indigo-950/20 border-b border-indigo-500/5">
                        <MapPin size={10} className="text-indigo-400/40 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tight leading-none">
                            {address}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// CONSUMPTION BLOCK — Agora o segundo bloco da pilha
// =============================================================================

const ConsumptionBlock: React.FC = () => {
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const restoreMap = usePanelStore(s => s.restoreMap);

    const clientData = useSolarStore(s => s.clientData);
    const kWpAlvo = useSolarStore(s => s.kWpAlvo);
    const consumption = clientData?.averageConsumption || 0;
    const isFocused = focusedBlock === 'consumption';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'consumption';

    const hasData = consumption > 0;

    return (
        <div 
            onClick={() => { setFocusedBlock('consumption'); restoreMap(); }}
            className={cn(
                "relative rounded-none border flex flex-col overflow-hidden transition-all duration-300 z-30 cursor-pointer shrink-0",
                isFocused 
                    ? "border-sky-500 bg-sky-950/80 shadow-[0_0_15px_rgba(14,165,233,0.25)] ring-1 ring-sky-500/50" 
                    : isDeemphasized 
                        ? "border-sky-600/20 bg-sky-950/70 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
                        : "border-sky-600/40 bg-sky-950/70 hover:border-sky-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-sky-500/10 bg-gradient-to-r from-sky-900/15 to-transparent h-10">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner shrink-0">
                    <Zap size={11} />
                </div>
                <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
                    Consumo
                </span>
            </div>

            {/* Summary Bar (Semi-Resumido) */}
            {!isFocused && hasData && (
                <div className="px-4 py-1.5 flex items-center gap-2 bg-sky-950/40 border-b border-sky-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                        <span className="text-[11px] font-black text-sky-400 tracking-tighter">
                            {Math.round(consumption)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">kWh</span>
                    </div>
                    {kWpAlvo && (
                        <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                            <span className="text-[11px] font-black text-emerald-400 tracking-tighter">
                                {kWpAlvo.toFixed(1)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">kWp</span>
                        </div>
                    )}
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                </div>
            )}

            <div className={cn(
                "flex flex-col transition-all duration-300",
                isFocused ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none"
            )}>
                {hasData ? (
                    <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-800/60 bg-black/40 border-b border-sky-500/10 backdrop-blur-md">
                        {/* Medidor Consumo */}
                        <div className="p-4 flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest leading-none">Carga Mensal</span>
                            <div className="flex items-baseline gap-1.5 min-w-0">
                                <span className="text-xl font-black text-sky-400 font-mono tabular-nums tracking-tighter leading-none">
                                    {Math.round(consumption).toLocaleString('pt-BR')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWh</span>
                            </div>
                        </div>

                        {/* Medidor kWp Alvo */}
                        {kWpAlvo !== null && (
                            <div className="p-4 flex flex-col gap-1 items-end text-right min-w-[120px]">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">kWp Alvo</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-emerald-400 font-mono tabular-nums tracking-tighter leading-none">
                                        {kWpAlvo.toFixed(2)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWp</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-5 py-8 flex flex-col items-center text-center gap-3 bg-black/20">
                        <Zap size={24} className="text-sky-900/40 animate-pulse" />
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed max-w-[150px]">
                            Aguardando Definição de Carga
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT — Pilha de Blocos (Layout Vertical)
// =============================================================================

export const LeftOutliner: React.FC<{ onToggle?: () => void; hideHeader?: boolean }> = ({ onToggle, hideHeader = false }) => {
    const city = useSolarStore(s => s.clientData?.city || '');
    const state = useSolarStore(s => s.clientData?.state || '');
    const modules = useSolarStore(selectModules);
    const totalModules = modules.length;
    
    // Métricas da Composição (Gates de Progressão)
    const { consumptionBlock } = useSystemComposition();

    const hasLocation = city !== '' && state !== '';
    const isConsumptionValid = consumptionBlock.status === 'complete';
    const isModulesValid = totalModules > 0;
    const isProjectionUnlocked = isConsumptionValid && isModulesValid;

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">

            {/* Header com botão de colapso — oculto no mobile sheet */}
            {!hideHeader && (
                <div className="flex items-center justify-between px-3 h-8 border-b border-slate-800/60 shrink-0 bg-slate-950">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Painel</span>
                    {onToggle && (
                        <button
                            onClick={onToggle}
                            title="Recolher painel"
                            className="flex items-center justify-center w-5 h-5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all duration-150 rounded-sm"
                        >
                            <ChevronsLeft size={11} />
                        </button>
                    )}
                </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                <div className="flex flex-col gap-1.5 px-3 pt-3">
                    {/* 1. Local — Sempre ativo no topo */}
                    <SiteBlock />
                    {hasLocation && <FlowConnector colorClass="bg-indigo-500" />}

                    {/* 2. Consumo */}
                    {hasLocation ? (
                        <ConsumptionBlock />
                    ) : (
                        <LockedBlock
                            label="Consumo"
                            icon={<Zap size={11} />}
                        />
                    )}

                    {hasLocation && <FlowConnector colorClass="bg-sky-500" />}

                    {/* 3. Módulos FV */}
                    {isConsumptionValid ? (
                        <ComposerBlockModule />
                    ) : (
                        <LockedBlock
                            label="Módulos FV"
                            icon={<Sun size={11} />}
                        />
                    )}

                    {isConsumptionValid && <FlowConnector colorClass="bg-amber-500" />}

                    {/* 5. Inversor */}
                    {isModulesValid ? (
                        <ComposerBlockInverter />
                    ) : (
                        <LockedBlock
                            label="Inversor"
                            icon={<Cpu size={11} />}
                        />
                    )}

                    {isModulesValid && <FlowConnector colorClass="bg-emerald-500" />}

                    {/* 6. Projeção */}
                    {isProjectionUnlocked ? (
                        <ComposerBlockProjection />
                    ) : (
                        <LockedBlock
                            label="Projeção"
                            icon={<TrendingUp size={11} />}
                        />
                    )}

                    {isProjectionUnlocked && <FlowConnector colorClass="bg-teal-500" />}

                    {/* 7. Proposta — Sempre visível no final */}
                    <ComposerBlockProposal />
                </div>
            </div>
        </div>
    );
};
