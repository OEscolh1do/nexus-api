import React from 'react';
import { Zap, MapPin, Sun, Cpu, Lock, ChevronsLeft } from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { ComposerBlockModule } from './canvas-views/composer/ComposerBlockModule';
import { ComposerBlockInverter } from './canvas-views/composer/ComposerBlockInverter';
import { ComposerBlockArrangement } from './canvas-views/composer/ComposerBlockArrangement';
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { usePanelStore } from '../../store/panelStore';
import { useSystemComposition } from '@/core/state/slices/systemCompositionSlice';

// =============================================================================
// LOCKED GHOST BLOCK — Peça faltante no quebra-cabeça
// =============================================================================

interface LockedBlockProps {
    label: string;
    icon: React.ReactNode;
    color: string;

    hint: string;
}

const LockedBlock: React.FC<LockedBlockProps> = ({ label, icon, color, hint }) => (
    <div className="flex flex-col">
        <div className="h-px bg-slate-800/10 mb-1" />
        <div className="relative rounded-none border-x border-b border-dashed border-slate-700/40 bg-slate-900/20 flex flex-col overflow-visible transition-all duration-500 pointer-events-none select-none z-0">
            <div className="px-3 py-2.5 flex items-center gap-2 opacity-25">
                <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border shadow-inner",
                    color === 'sky' ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                    color === 'amber' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    "bg-slate-800 text-slate-600 border-slate-700/50"
                )}>
                {icon}
            </div>
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest leading-none",
                    color === 'sky' ? "text-sky-500" :
                    color === 'amber' ? "text-amber-500" :
                    color === 'emerald' ? "text-emerald-500" :
                    "text-slate-600"
                )}>
                {label}
            </span>
            <Lock size={8} className="ml-auto text-slate-700" />
        </div>

            <div className="px-3 pb-3 -mt-0.5">
                <p className="text-[7px] text-slate-700 font-medium text-center italic">{hint}</p>
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
    const clientName = clientData?.clientName || '';
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
                "relative rounded-none border flex flex-col overflow-visible transition-all duration-300 z-40 cursor-pointer",
                isFocused 
                    ? "border-indigo-500 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50" 
                    : isDeemphasized 
                        ? "border-indigo-900/30 bg-indigo-950/40 opacity-40 select-none"
                        : "border-indigo-600/40 bg-indigo-950/70 hover:border-indigo-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-indigo-500/10 bg-gradient-to-r from-indigo-900/15 to-transparent">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                    <MapPin size={11} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider leading-none">Projeto</span>
                    <span className="text-[8px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-tight mt-0.5 truncate">
                        {clientName || 'Novo Projeto'}
                    </span>
                </div>
            </div>

            <div className="px-4 py-3 flex flex-col gap-1.5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center justify-between min-w-0">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[7px] text-indigo-500/80 font-bold uppercase tracking-[0.15em] mb-0.5">Localização</span>
                        <span className="text-[10px] font-black text-white font-mono uppercase truncate">
                            {hasLocation ? `${city} / ${state}` : 'Pendente'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {weatherData?.hsp_avg !== undefined && (
                            <div className="flex flex-col items-end border-r border-slate-800/50 pr-3">
                                <span className="text-[7px] text-amber-500/80 font-bold uppercase tracking-[0.15em] mb-0.5">HSP</span>
                                <span className="text-[10px] font-black text-amber-400 font-mono tracking-tighter tabular-nums">
                                    {weatherData.hsp_avg.toFixed(2)}
                                </span>
                            </div>
                        )}
                        {weatherData?.ambient_temp_avg !== undefined && (
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] text-rose-500/80 font-bold uppercase tracking-[0.15em] mb-0.5">Temp</span>
                                <span className="text-[10px] font-black text-rose-400 font-mono tracking-tighter tabular-nums">
                                    {weatherData.ambient_temp_avg.toFixed(1)}°C
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {address && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                        <span className="text-[8px] text-slate-400 font-medium truncate uppercase tracking-tighter">
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
                "relative rounded-none border-x border-b flex flex-col overflow-visible transition-all duration-300 z-30 cursor-pointer -mt-px",
                isFocused 
                    ? "border-sky-500 bg-sky-950/80 shadow-[0_0_15px_rgba(14,165,233,0.25)] ring-1 ring-sky-500/50" 
                    : isDeemphasized 
                        ? "border-sky-900/30 bg-sky-950/40 opacity-40 select-none"
                        : "border-sky-600/40 bg-sky-950/70 hover:border-sky-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-sky-500/10 bg-gradient-to-r from-sky-900/15 to-transparent">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
                    <Zap size={11} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-sky-500 uppercase tracking-wider leading-none">Consumo</span>
                </div>
            </div>

            {hasData ? (
                <>
                    {/* Display Principal — Layout de Instrumento */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-amber-900/40 bg-black/20 backdrop-blur-md">
                        {/* Medidor Consumo */}
                        <div className="flex flex-col">
                            <span className="text-[7px] text-sky-500/80 font-bold uppercase tracking-[0.15em] mb-1">Consumo Médio</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-sky-300 font-mono tabular-nums tracking-tighter leading-none">
                                    {Math.round(consumption).toLocaleString('pt-BR')}
                                </span>
                                <span className="text-[9px] font-bold text-sky-600/80 uppercase tracking-normal">kWh<span className="opacity-40">/</span>mês</span>
                            </div>
                        </div>

                        {/* Divisor Vertical de Instrumento */}
                        <div className="w-px h-8 bg-gradient-to-b from-transparent via-sky-900/40 to-transparent" />

                        {/* Medidor kWp Alvo */}
                        {kWpAlvo !== null && (
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] text-emerald-500/80 font-bold uppercase tracking-[0.15em] mb-1">kWp Alvo</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-400 font-mono tabular-nums tracking-tighter leading-none">
                                        {kWpAlvo.toFixed(2)}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-normal">kWp</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="px-5 py-6 flex flex-col items-center text-center gap-2">
                    <Zap size={14} className="text-sky-900/40 animate-pulse" />
                    <p className="text-[8px] text-sky-800/60 font-bold uppercase tracking-widest leading-relaxed max-w-[150px]">
                        Aguardando Dados de Consumo
                    </p>
                </div>
            )}
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
    const { consumptionBlock, arrangementBlock } = useSystemComposition();

    const hasLocation = city !== '' && state !== '';
    const isConsumptionValid = consumptionBlock.status === 'complete';
    const isArrangementValid = arrangementBlock.status !== 'empty';
    const isModulesValid = totalModules > 0;

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">

            {/* Header com botão de colapso — oculto no mobile sheet */}
            {!hideHeader && (
                <div className="flex items-center justify-between px-3 h-8 border-b border-slate-800/60 shrink-0 bg-slate-950">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Painel</span>
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
                <div className="flex flex-col">
                    {/* 1. Local — Sempre ativo no topo */}
                    <SiteBlock />

                    {/* 2. Consumo — Junta entre Local e Consumo */}
                    <div className="h-1" />

                    {hasLocation ? (
                        <ConsumptionBlock />
                    ) : (
                        <LockedBlock
                            label="Consumo"
                            icon={<Zap size={11} />}
                            color="sky"
                            hint="Defina a localização para liberar consumo"
                        />
                    )}

                    {isConsumptionValid ? (
                        <ComposerBlockModule />
                    ) : (
                        <LockedBlock
                            label="Módulos FV"
                            icon={<Sun size={11} />}
                            color="emerald"
                            hint={hasLocation ? "Informe o consumo para liberar módulos" : "Preencha as etapas anteriores"}
                        />
                    )}

                    {/* 4. Arranjo Físico — Junta entre Módulos e Arranjo */}
                    <div className="h-1" />

                    {isModulesValid ? (
                        <ComposerBlockArrangement />
                    ) : (
                        <LockedBlock
                            label="Arranjo Físico"
                            icon={<MapPin size={11} />}
                            color="sky"
                            hint="Selecione os módulos no catálogo para liberar o desenho do arranjo"
                        />
                    )}

                    {/* 5. Inversor — Junta entre Módulos e Inversor */}
                    <div className="h-1" />

                    {isArrangementValid ? (
                        <ComposerBlockInverter />
                    ) : (
                        <LockedBlock
                            label="Inversor"
                            icon={<Cpu size={11} />}
                            color="amber"
                            hint={isArrangementValid ? "Tudo pronto" : "Desenhe o arranjo no mapa para liberar inversor"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
