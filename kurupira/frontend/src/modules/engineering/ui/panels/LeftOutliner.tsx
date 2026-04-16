import React from 'react';
import { Zap, MapPin, Sun, Cpu, Lock } from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { LegoTab, LegoNotch, SemanticColor } from './canvas-views/composer/LegoConnectors';
import { ComposerBlockModule } from './canvas-views/composer/ComposerBlockModule';
import { ComposerBlockInverter } from './canvas-views/composer/ComposerBlockInverter';
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { usePanelStore } from '../../store/panelStore';

// =============================================================================
// LOCKED GHOST BLOCK — Peça faltante no quebra-cabeça
// =============================================================================

interface LockedBlockProps {
    label: string;
    icon: React.ReactNode;
    notchColor: SemanticColor;
    tabLabel: string;
    hint: string;
}

const LockedBlock: React.FC<LockedBlockProps> = ({ label, icon, notchColor, tabLabel, hint }) => (
    <div className="relative rounded-xl border border-dashed border-slate-700/40 bg-slate-900/20 flex flex-col overflow-visible transition-all duration-500 pointer-events-none select-none mt-6 z-0">
        <LegoNotch color={notchColor} dashed />
        <LegoTab label={tabLabel} color="slate" dashed />

        <div className="px-3 py-2.5 flex items-center gap-2 opacity-25">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 text-slate-600 border border-slate-700/50">
                {icon}
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
            <Lock size={8} className="ml-auto text-slate-700" />
        </div>

        <div className="px-3 pb-3 -mt-0.5">
            <p className="text-[7px] text-slate-700 font-medium text-center italic">{hint}</p>
        </div>
    </div>
);

// =============================================================================
// CONSUMPTION BLOCK — Primeiro bloco da pilha (topo arredondado, base reta)
// =============================================================================

const ConsumptionBlock: React.FC = () => {
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const restoreMap = usePanelStore(s => s.restoreMap);

    const clientData = useSolarStore(s => s.clientData);
    const kWpAlvo = useSolarStore(s => s.kWpAlvo); // Derivado pelo journeySlice via ConsumptionCanvasView
    const consumption = clientData?.averageConsumption || 0;
    const city = clientData?.city || '';
    const state = clientData?.state || '';
    const connectionType = clientData?.connectionType || '';
    const monthlyIrradiation = clientData?.monthlyIrradiation || [];

    const validHsp = monthlyIrradiation.filter((v: number) => v > 0);
    const avgHsp = validHsp.length > 0
        ? validHsp.reduce((s: number, v: number) => s + v, 0) / validHsp.length
        : 0;

    const annualKwh = consumption * 12;
    const connectionLabel = connectionType === 'trifasico' ? 'Trifásico'
        : connectionType === 'bifasico' ? 'Bifásico'
        : connectionType === 'monofasico' ? 'Monofásico'
        : '';

    const isFocused = focusedBlock === 'consumption';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'consumption';

    const hasData = consumption > 0;

    return (
        <div 
            onClick={() => { setFocusedBlock('consumption'); restoreMap(); }}
            className={cn(
                "relative rounded-t-sm rounded-b-none border flex flex-col overflow-visible transition-all duration-300 z-30 cursor-pointer",
                isFocused 
                    ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50" 
                    : isDeemphasized 
                        ? "border-amber-900/30 bg-amber-950/40 opacity-50 grayscale select-none"
                        : "border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            {/* Header — Limpo, sem chip */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/50 bg-gradient-to-r from-amber-900/10 to-transparent">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-200 leading-tight">Consumo</span>
                    {city ? (
                        <span className="text-[9px] text-slate-500 flex items-center gap-1 font-medium">
                            <MapPin size={8} className="shrink-0" />
                            {city}/{state}
                        </span>
                    ) : (
                        <span className="text-[9px] text-slate-600 italic font-medium">Localização não informada</span>
                    )}
                </div>
            </div>

            {hasData ? (
                <>
                    {/* Stats Compact Row — Consumo Médio + kWp Alvo */}
                    <div className="px-5 py-2.5 flex items-center justify-between border-b border-amber-900/40 bg-amber-950/30 shadow-inner shadow-black/10">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-0.5 opacity-90">Consumo Médio</span>
                            <span className="text-sm font-black text-amber-300 tabular-nums tracking-tight leading-none">
                                {consumption.toLocaleString('pt-BR')} <span className="font-bold text-[10px] opacity-80 ml-0.5 tracking-normal">kWh/mês</span>
                            </span>
                        </div>
                        {kWpAlvo !== null && (
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider mb-0.5">kWp Alvo</span>
                                <span className="text-sm font-black text-emerald-400 tabular-nums tracking-tight leading-none">
                                    {kWpAlvo} <span className="font-bold text-[10px] opacity-80 ml-0.5 tracking-normal">kWp</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Metadata Row — Badges compactos */}
                    <div className="px-4 py-2 flex flex-wrap gap-1.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-950/60 border border-amber-900/50 rounded-sm text-slate-400 whitespace-nowrap">
                            {annualKwh.toLocaleString('pt-BR')} kWh/ano
                        </span>
                        {connectionLabel && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-950/60 border border-amber-900/50 rounded-sm text-slate-400">
                                {connectionLabel}
                            </span>
                        )}
                        {avgHsp > 0 && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-950/60 border border-amber-900/50 rounded-sm text-amber-600/80">
                                HSP {avgHsp.toFixed(1)}h
                            </span>
                        )}
                    </div>
                </>
            ) : (
                <div className="px-5 py-5 flex flex-col items-center text-center gap-1.5">
                    <Zap size={16} className="text-amber-800/50 mb-1" />
                    <p className="text-[9px] text-amber-700/60 font-medium italic leading-relaxed max-w-[160px]">
                        Informe o consumo médio no painel de setup para iniciar o dimensionamento do sistema.
                    </p>
                </div>
            )}

            {/* Lego Tab — kWh */}
            <LegoTab label="kWh" color={hasData ? "amber" : "slate"} />
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT — Compositor Lego (Pilha Encaixada)
// =============================================================================

export const LeftOutliner: React.FC = () => {
    const consumption = useSolarStore(s => s.clientData?.averageConsumption || 0);
    const modules = useSolarStore(selectModules);
    const totalModules = modules.length;

    const isConsumptionValid = consumption > 0;
    const isModulesValid = totalModules > 0;

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">


            {/* Body — Pilha Lego Encaixada (gap-0, blocos colados) */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20">
                <div className="flex flex-col">
                    {/* 1. Consumo — Sempre ativo */}
                    <ConsumptionBlock />

                    {/* 2. Módulos FV — Encaixa no Consumo */}
                    {isConsumptionValid ? (
                        <ComposerBlockModule />
                    ) : (
                        <LockedBlock
                            label="Módulos FV"
                            icon={<Sun size={11} />}
                            notchColor="slate"
                            tabLabel="DC"
                            hint="Informe o consumo médio para desbloquear"
                        />
                    )}

                    {/* 3. Inversor — Encaixa nos Módulos */}
                    {isModulesValid ? (
                        <ComposerBlockInverter />
                    ) : (
                        <LockedBlock
                            label="Inversor"
                            icon={<Cpu size={11} />}
                            notchColor="slate"
                            tabLabel="AC"
                            hint={isConsumptionValid
                                ? "Adicione módulos para desbloquear"
                                : "Preencha as etapas anteriores"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
