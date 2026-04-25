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
                "relative rounded-none border flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-hidden shrink-0",
                isFocused
                    ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                    : "border-dashed border-amber-600/30 bg-amber-950/60 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] shadow-lg"
            )}
        >
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/15 to-transparent h-10">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner shrink-0">
                    <Sun size={11} />
                </div>
                <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
                    Módulos FV
                </span>
            </div>

            <div className={cn(
                "flex flex-col transition-all duration-300",
                isFocused ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none"
            )}>
                <div className="px-5 py-8 flex flex-col items-center justify-center text-center gap-3 bg-black/20">
                    <Sun size={24} className="text-amber-500/20 animate-pulse" />
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed max-w-[150px]">
                        Utilize o Catálogo no painel principal para adicionar módulos ao projeto
                    </p>
                </div>
            </div>
        </div>
        );
    }

    return (
        <div 
            onClick={() => { setFocusedBlock('module'); restoreMap(); }}
            className={cn(
                "relative rounded-none border flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-hidden shrink-0",
                isFocused
                    ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                    : "border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            {/* Header Técnico */}
            <div className="px-4 py-2.5 flex items-center border-b border-slate-800/50 bg-gradient-to-r from-amber-900/15 to-transparent gap-3 h-10">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-inner shrink-0">
                    <Sun size={11} />
                </div>
                <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
                    Gerador FV
                </span>
            </div>

            {/* Summary Bar (Semi-Resumido) */}
            {!isFocused && totalModules > 0 && (
                <div className="px-4 py-1.5 flex items-center gap-2 bg-amber-950/40 border-b border-amber-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                        <span className="text-[11px] font-black text-amber-400 tracking-tighter">
                            {totalDcKwp.toFixed(1)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">kWp</span>
                    </div>
                    <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                        <span className="text-[11px] font-black text-amber-500 tracking-tighter">
                            {Math.round(totalDcKwp * hspAvgManual * 30 * (Number(prValueAdditive) / 100)).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">kWh</span>
                    </div>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                </div>
            )}

            <div className={cn(
                "flex flex-col transition-all duration-300",
                isFocused ? "opacity-100 max-h-[800px]" : "opacity-0 max-h-0 pointer-events-none"
            )}>

            {/* Inventário de Módulos (Movido para cima) */}
            <div className="divide-y divide-slate-800/40 bg-slate-950/20 border-b border-amber-900/10">
                {moduleGroups.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-900/50 transition-colors gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-[12px] font-black text-amber-400 font-mono tabular-nums w-8 text-right shrink-0">{group.quantity}×</span>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[12px] font-black text-slate-100 truncate leading-tight uppercase tracking-tight">
                                    {group.specs.manufacturer} <span className="text-amber-500/80">{group.specs.power}Wp</span>
                                </span>
                                <span className="text-[11px] font-bold text-slate-500/80 truncate uppercase tracking-tight">{group.specs.model}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 transition-transform duration-200">
                            <div className="flex items-center bg-slate-950 rounded-[4px] border border-slate-800 p-0.5 shadow-lg">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDecrement(group); }} 
                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-sm transition-all active:scale-90"
                                >
                                    −
                                </button>
                                <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleIncrement(group); }} 
                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-sm transition-all active:scale-90"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveGroup(group); }}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Display de Instrumento (Potência vs Geração) */}
            <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-800/60 bg-black/40 backdrop-blur-md">
                {/* Potência DC */}
                <div className="p-4 flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest leading-none">Potência Gerador</span>
                    <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className={cn("text-xl font-black font-mono tabular-nums tracking-tighter leading-none transition-colors", isKwpMet ? "text-emerald-400" : "text-amber-400")}>
                            {totalDcKwp.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWp</span>
                    </div>
                </div>
                
                {/* Geração Estimada */}
                <div className="p-4 flex flex-col gap-1 items-end text-right min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Prod. Mensal</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-amber-400 font-mono tabular-nums tracking-tighter leading-none">
                            {Math.round(totalDcKwp * hspAvgManual * 30 * (Number(prValueAdditive) / 100)).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWh</span>
                    </div>
                </div>
            </div>


        </div>
    </div>
);
};
