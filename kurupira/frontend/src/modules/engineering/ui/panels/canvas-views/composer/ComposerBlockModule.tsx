import React from 'react';
import { Sun, Trash2 } from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { cn } from '@/lib/utils';
import { useAutoSizing } from '@/modules/engineering/hooks/useAutoSizing';
import { useTechKPIs } from '@/modules/engineering/hooks/useTechKPIs';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore } from '@/modules/engineering/store/panelStore';

// =============================================================================
// COMPOSER BLOCK MODULE — Bloco Materializado
// =============================================================================

export const ComposerBlockModule: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const addModule = useSolarStore(s => s.addModule);
    const removeModule = useSolarStore(s => s.removeModule);
    const techState = useTechStore();
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const restoreMap = usePanelStore(s => s.restoreMap);
    
    const autoSizing = useAutoSizing();
    const { prValueAdditive } = useTechKPIs();
    const kWpAlvoJourney = useSolarStore(s => s.kWpAlvo);
    const kwpAlvo = kWpAlvoJourney ?? autoSizing.requiredKwp;

    const clientData = useSolarStore(s => s.clientData);
    const hspAvgManual = (clientData.monthlyIrradiation && clientData.monthlyIrradiation.length > 0)
        ? clientData.monthlyIrradiation.reduce((a, b) => a + b, 0) / 12
        : 4.5;

    const isFocused = focusedBlock === 'module';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'module';

    const groupsMap: Record<string, { specs: any; quantity: number; ids: string[] }> = {};
    modules.forEach(mod => {
        const key = `${mod.manufacturer}-${mod.model}-${mod.power}`;
        if (!groupsMap[key]) {
            groupsMap[key] = { specs: mod, quantity: 0, ids: [] };
        }
        groupsMap[key].quantity += 1;
        groupsMap[key].ids.push(mod.id);
    });

    const moduleGroups = Object.values(groupsMap);
    const totalModules = moduleGroups.reduce((sum, g) => sum + g.quantity, 0);
    const totalDcKwp = moduleGroups.reduce((sum, g) => sum + (g.specs.power * g.quantity), 0) / 1000;
    const isKwpMet = kwpAlvo > 0 && totalDcKwp >= kwpAlvo * 0.98;

    // As funções de adição handleAddModules foram removidas
    // para centralizar a jornada no painel de Catálogo (75%).

    const handleIncrement = (group: any) => {
        const mid = Math.random().toString(36).substr(2, 9);
        addModule({ ...group.specs, id: mid });
    };

    const handleDecrement = (group: any) => {
        if (group.ids.length === 0) return;
        const midToRemove = group.ids[group.ids.length - 1];
        removeModule(midToRemove);
        techState.removeModules([midToRemove]);
    };

    const handleRemoveGroup = (group: any) => {
        const removeModuleAction = useSolarStore.getState().removeModule;
        group.ids.forEach((mid: string) => removeModuleAction(mid));
        techState.removeModules(group.ids);
    };

    if (totalModules === 0) {
        return (
            <div 
                onClick={() => { setFocusedBlock('module'); restoreMap(); }}
                className={cn(
                    "relative rounded-none border-x border-b flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-visible -mt-px",
                    isFocused
                        ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                        : isDeemphasized
                            ? "border-amber-900/30 bg-amber-950/40 opacity-50 grayscale select-none"
                            : "border-dashed border-amber-600/30 bg-amber-950/60 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] shadow-lg"
                )}
            >
                <div className="px-4 py-2.5 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/15 to-transparent">
                    <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                        <Sun size={11} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider leading-none">Módulos FV</span>
                        {kwpAlvo > 0 && (
                            <span className="text-[7px] text-amber-600 font-bold uppercase tracking-tight mt-0.5 opacity-60">Alvo Requerido: {kwpAlvo.toFixed(2)} kWp</span>
                        )}
                    </div>
                </div>

                <div className="p-4 py-8 flex flex-col items-center justify-center text-center gap-3">
                    <Sun size={24} className="text-amber-500/20 animate-pulse" />
                    <p className="text-[9px] text-amber-800/60 font-black uppercase tracking-widest leading-relaxed max-w-[150px]">
                        Utilize o Catálogo no painel principal para adicionar módulos ao projeto
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => { setFocusedBlock('module'); restoreMap(); }}
            className={cn(
                "relative rounded-none border-x border-b flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-visible -mt-px",
                isFocused
                    ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                    : isDeemphasized
                        ? "border-amber-900/30 bg-amber-950/40 opacity-40 select-none"
                        : "border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            {/* Header Técnico */}
            <div className="px-4 py-2.5 flex items-center border-b border-slate-800/50 bg-gradient-to-r from-amber-900/15 to-transparent gap-3">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-inner">
                    <Sun size={11} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-100 uppercase tracking-wider leading-none">Gerador FV</span>
                    <span className="text-[8px] text-amber-400 font-bold uppercase tracking-tight mt-0.5">{totalModules} un. instaladas</span>
                </div>
            </div>

            {/* Inventário de Módulos (Movido para cima) */}
            <div className="divide-y divide-slate-800/30 bg-slate-900/10 border-b border-amber-900/10">
                {moduleGroups.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 group hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-black text-amber-400 font-mono tabular-nums w-6 text-right shrink-0">{group.quantity}×</span>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-100 truncate max-w-[130px] leading-tight uppercase tracking-tight">
                                    {group.specs.manufacturer} <span className="text-amber-500/70 opacity-80">{group.specs.power}Wp</span>
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter">{group.specs.model}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0 transition-transform duration-200">
                            <div className="flex items-center bg-slate-950/80 rounded-[2px] border border-slate-800/80 overflow-hidden shadow-inner">
                                <button onClick={() => handleDecrement(group)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800 text-[10px] transition-all">−</button>
                                <div className="w-[1px] h-3 bg-slate-800/50" />
                                <button onClick={() => handleIncrement(group)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-slate-800 text-[10px] transition-all">+</button>
                            </div>
                            <button
                                onClick={() => handleRemoveGroup(group)}
                                className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Display de Instrumento (Potência vs Geração) */}
            <div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md">
                {/* Potência DC */}
                <div className="flex flex-col">
                    <span className="text-[7px] text-amber-500/80 font-bold uppercase tracking-[0.15em] mb-1">Potência DC</span>
                    <div className="flex items-baseline gap-1">
                        <span className={cn("text-lg font-black font-mono tabular-nums tracking-tighter leading-none transition-colors", isKwpMet ? "text-emerald-400" : "text-amber-300")}>
                            {totalDcKwp.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-normal">kWp</span>
                    </div>
                </div>
                
                {/* Divisor Visual */}
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-900/40 to-transparent" />

                {/* Geração Estimada */}
                <div className="flex flex-col items-end">
                    <span className="text-[7px] text-amber-500/80 font-bold uppercase tracking-[0.15em] mb-1">Geração Est.</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-amber-400 font-mono tabular-nums tracking-tighter leading-none">
                            {Math.round(totalDcKwp * hspAvgManual * 30 * (Number(prValueAdditive) / 100)).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-normal">kWh</span>
                    </div>
                </div>
            </div>


        </div>
    );
};
