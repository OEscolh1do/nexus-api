import React, { useState, useMemo } from 'react';
import { Sun, Trash2, Plus } from 'lucide-react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { mapCatalogToSpecs } from '../../../../utils/catalogMappers';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';
import { useAutoSizing } from '@/modules/engineering/hooks/useAutoSizing';
import { useTechKPIs } from '@/modules/engineering/hooks/useTechKPIs';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore } from '@/modules/engineering/store/panelStore';
import { LegoTab, LegoNotch } from './LegoConnectors';

// =============================================================================
// INLINE MODULE SELECTOR — Compacto, sem dependência do CatalogSelectors
// =============================================================================

const ModuleInlineSelector: React.FC<{
    onAdd: (item: ModuleCatalogItem, qty: number) => void;
    onClose: () => void;
}> = ({ onAdd, onClose }) => {
    const { modules } = useCatalogStore();
    const [brand, setBrand] = useState('');
    const [modelId, setModelId] = useState('');
    const [qty, setQty] = useState(1);

    const autoSizing = useAutoSizing();
    const suggestedQty = autoSizing.requiredModuleQty;

    const brands = useMemo(() =>
        [...new Set(modules.map((m: ModuleCatalogItem) => m.manufacturer))].sort(),
        [modules]
    );
    const modelsForBrand = useMemo(() =>
        modules.filter((m: ModuleCatalogItem) => m.manufacturer === brand),
        [modules, brand]
    );
    const selectedItem = modules.find((m: ModuleCatalogItem) => m.id === modelId);

    // Auto-preencher sugestão quando selecionar modelo
    React.useEffect(() => {
        if (selectedItem && suggestedQty > 0 && qty === 1) {
            setQty(suggestedQty);
        }
    }, [selectedItem, suggestedQty]);

    const handleAdd = () => {
        if (selectedItem) {
            onAdd(selectedItem, qty);
            onClose();
        }
    };

    return (
        <div className="space-y-1.5">
            {/* Brand */}
            <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors"
            >
                <option value="">Marca...</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Model */}
            {brand && (
                <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
                >
                    <option value="">Modelo...</option>
                    {modelsForBrand.map((mod: ModuleCatalogItem) => (
                        <option key={mod.id} value={mod.id}>
                            {mod.model} — {mod.electrical?.pmax || 0}W
                        </option>
                    ))}
                </select>
            )}

            {/* Suggestion + Qty + Add */}
            {selectedItem && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* AutoSizing hint */}
                    {autoSizing.isCalculable && suggestedQty > 0 && (
                        <div className="flex items-center justify-between px-1 py-0.5 border-t border-slate-800/50">
                            <span className="text-[8px] text-slate-500">Sugestão p/ {autoSizing.requiredKwp.toFixed(1)} kWp</span>
                            <span className="text-[9px] font-bold text-amber-500">{suggestedQty} un.</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-slate-800 rounded overflow-hidden">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px]">−</button>
                            <span className="px-2 py-0.5 text-[10px] font-bold text-slate-200 bg-slate-950 min-w-[24px] text-center tabular-nums">{qty}</span>
                            <button onClick={() => setQty(Math.min(99, qty + 1))} className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px]">+</button>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold rounded transition-colors"
                        >
                            <Plus size={10} /> Adicionar {qty}x
                        </button>
                        <button onClick={onClose} className="px-1.5 py-1 text-slate-600 hover:text-slate-300 text-[10px] font-bold">✕</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// COMPOSER BLOCK MODULE — Desacoplado, Auto-gerencia placeholder
// =============================================================================

export const ComposerBlockModule: React.FC = () => {
    const [showSelector, setShowSelector] = useState(false);
    const modules = useSolarStore(selectModules);
    const addModule = useSolarStore(state => state.addModule);
    const removeModule = useSolarStore.getState().removeModule;
    const techState = useTechStore();
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const restoreMap = usePanelStore(s => s.restoreMap);
    
    const autoSizing = useAutoSizing();
    const { prValueAdditive } = useTechKPIs();
    // journeySlice é a fonte canônica — calculado com consumo real + HSP + crescimento
    // autoSizing.requiredKwp serve de fallback enquanto o usuário não passou pelo bloco Consumo
    const kWpAlvoJourney = useSolarStore(s => s.kWpAlvo);
    const kwpAlvo = kWpAlvoJourney ?? autoSizing.requiredKwp;

    const isFocused = focusedBlock === 'module';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'module';

    // Agrupar módulos do inventário global
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

    // Handlers
    const handleAddModules = (catalogItem: ModuleCatalogItem, qty: number) => {
        const mappedSpecs = mapCatalogToSpecs(catalogItem);
        const invertersList = Object.values(techState.inverters.entities) as any[];
        const firstInv = invertersList.length > 0 ? invertersList[0] : null;

        const moduleIds: string[] = [];
        for (let i = 0; i < qty; i++) {
            const mid = Math.random().toString(36).substr(2, 9);
            addModule({ ...mappedSpecs, id: mid, quantity: 1 });
            moduleIds.push(mid);
        }

        if (firstInv && firstInv.mpptConfigs.length > 0) {
            const configs = firstInv.mpptConfigs;
            const mpptCount = configs.length;
            const basePerMppt = Math.floor(qty / mpptCount);
            const remainder = qty % mpptCount;
            let ptr = 0;
            configs.forEach((mppt: any, index: number) => {
                const count = basePerMppt + (index < remainder ? 1 : 0);
                if (count > 0 && ptr < moduleIds.length) {
                    const chunk = moduleIds.slice(ptr, ptr + count);
                    techState.assignModulesToNewString(chunk, firstInv.id, mppt.mpptId);
                    ptr += count;
                }
            });
        }
        setShowSelector(false);
    };

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
        group.ids.forEach((mid: string) => removeModule(mid));
        techState.removeModules(group.ids);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EMPTY STATE — Placeholder compacto com seletor inline
    // ═══════════════════════════════════════════════════════════════════════

    if (totalModules === 0) {
        return (
            <div 
                onClick={() => { setFocusedBlock('module'); restoreMap(); }}
                className={cn(
                    "relative rounded-t-none rounded-b-none border flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-visible pt-[16px] -mt-px",
                    isFocused
                        ? "border-sky-500 bg-sky-950/80 shadow-[0_0_15px_rgba(14,165,233,0.25)] ring-1 ring-sky-500/50"
                        : isDeemphasized
                            ? "border-sky-900/30 bg-sky-950/40 opacity-50 grayscale select-none"
                            : "border-dashed border-sky-600/30 bg-sky-950/60 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] shadow-lg"
                )}
            >
                {/* Lego Notch (recebe tab do Consumo) */}
                <LegoNotch color="amber" dashed />

                {/* Lego Tab DC (base) */}
                <LegoTab label="DC" color="amber" dashed />

                {/* Header compacto */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-sky-900/10 to-transparent">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Sun size={13} />
                    </div>
                    <span className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">Módulos FV</span>
                    {kwpAlvo > 0 && (
                        <span className="ml-auto text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Alvo: {kwpAlvo.toFixed(1)} kWp</span>
                    )}
                </div>

                {/* Seletor inline */}
                <div className="p-2.5 pb-4">
                    <ModuleInlineSelector onAdd={handleAddModules} onClose={() => {}} />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILLED STATE — Bloco Módulos Materializado
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <div 
            onClick={() => { setFocusedBlock('module'); restoreMap(); }}
            className={cn(
                "relative rounded-t-none rounded-b-none border flex flex-col transition-all duration-300 z-20 cursor-pointer overflow-visible pt-[16px] -mt-px animate-lego-snap",
                isFocused
                    ? "border-sky-500 bg-sky-950/80 shadow-[0_0_15px_rgba(14,165,233,0.25)] ring-1 ring-sky-500/50"
                    : isDeemphasized
                        ? "border-sky-900/30 bg-sky-950/40 opacity-50 grayscale select-none"
                        : "border-sky-600/40 bg-sky-950/70 hover:border-sky-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            {/* Lego Notch (recebe tab do Consumo) */}
            <LegoNotch color="sky" />

            {/* Lego Tab DC (base) */}
            <LegoTab label="DC" color="sky" />

            {/* Header compacto */}
            <div className="px-4 py-3 flex items-center border-b border-slate-800/50 bg-gradient-to-r from-slate-800/20 to-transparent gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center border border-sky-500/30 bg-sky-500/10 text-sky-400">
                    <Sun size={13} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-100 leading-tight">Módulos FV</span>
                    <span className="text-[10px] text-sky-500/70 font-bold uppercase tracking-tight">{totalModules} unidades</span>
                </div>
            </div>

            {/* Stats Compact Row (Alta Legibilidade) */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-sky-900/40 bg-sky-950/30 shadow-inner shadow-black/10">
                {/* Potência */}
                <div className="flex flex-col">
                    <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider mb-0.5 opacity-90">Potência DC</span>
                    <span className={cn("text-sm font-black tabular-nums tracking-tight leading-none", isKwpMet ? "text-emerald-400" : "text-sky-300")}>
                        {totalDcKwp.toFixed(2)} <span className="font-bold text-[10px] opacity-80 ml-0.5 tracking-normal">kWp</span>
                    </span>
                </div>
                
                {/* Divisor Visual */}
                <div className="w-px h-6 bg-sky-900/60" />

                {/* Geração */}
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-0.5 opacity-90">Geração Est.</span>
                    <span className="text-sm font-black text-amber-400 tabular-nums tracking-tight leading-none">
                        {Math.round(totalDcKwp * 4.5 * 30 * (Number(prValueAdditive) / 100)).toLocaleString('pt-BR')} <span className="font-bold text-[10px] opacity-80 ml-0.5 tracking-normal">kWh/mês</span>
                    </span>
                </div>
            </div>

            {/* Body: Module Groups — Rows compactas */}
            <div className="divide-y divide-slate-800/30">
                {moduleGroups.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5 group hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-black text-sky-400 tabular-nums w-6 text-right shrink-0">{group.quantity}×</span>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-extrabold text-slate-200 truncate max-w-[140px] leading-tight uppercase tracking-tight">{group.specs.model}</span>
                                <span className="text-[10px] font-bold text-slate-500">{group.specs.power}W · {group.specs.brand}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] text-slate-500">{group.specs.manufacturer}</span>
                                    <span className="text-[7px] text-sky-400/80 font-bold">{group.specs.power}W</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleRemoveGroup(group)}
                                className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover"
                            >
                                <Trash2 size={10} />
                            </button>
                            <div className="flex items-center bg-slate-800/80 rounded border border-slate-700/50 overflow-hidden">
                                <button onClick={() => handleDecrement(group)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 text-[10px] transition-colors">−</button>
                                <div className="w-px h-3 bg-slate-700/50" />
                                <button onClick={() => handleIncrement(group)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 text-[10px] transition-colors">+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add More / Selector */}
            {showSelector ? (
                <div className="p-2 border-t border-slate-800/50 bg-slate-950/40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ModuleInlineSelector onAdd={handleAddModules} onClose={() => setShowSelector(false)} />
                </div>
            ) : (
                <button
                    onClick={() => setShowSelector(true)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-dashed border-slate-800/50 text-slate-600 hover:text-slate-300 hover:bg-slate-900/30 transition-colors"
                >
                    <Plus size={9} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Outro Modelo</span>
                </button>
            )}
        </div>
    );
};
