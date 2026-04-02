import React from 'react';
import { Plus, Minus, Trash2, Ruler, SlidersHorizontal, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';

interface ModuleInventoryItemProps {
    module: ModuleCatalogItem;
    mode?: 'catalog' | 'inventory';
    isSelected?: boolean;
    quantity?: number;
    onSelect?: () => void;
    onAdd?: () => void;
    onQuantityChange?: (delta: number) => void;
    onRemove?: () => void;
}

const FALLBACK_IMAGE = '/assets/images/solar-module.png';

/**
 * ModuleInventoryItem — Premium Engineering Card (P8 Visual Refactor)
 * Dark glass surface with product thumbnail, efficiency ring, data-dense specs.
 */
export const ModuleInventoryItem: React.FC<ModuleInventoryItemProps> = ({
    module,
    mode = 'catalog',
    isSelected,
    quantity = 0,
    onSelect,
    onAdd,
    onQuantityChange,
    onRemove
}) => {
    const modelLower = module.model.toLowerCase();
    const isMono = modelLower.includes('mono') || modelLower.includes('m10') || modelLower.includes('m12') || modelLower.includes('p-type');
    const typeLabel = isMono ? 'MONO' : 'POLY';
    const imageUrl = (module as any).imageUrl || FALLBACK_IMAGE;

    const areaM2 = ((module.physical.widthMm * module.physical.heightMm) / 1_000_000).toFixed(2);
    const efficiencyPercent = module.electrical.efficiency
        ? (module.electrical.efficiency * 100).toFixed(1)
        : ((module.electrical.pmax / (module.physical.widthMm * module.physical.heightMm / 1_000_000) / 10).toFixed(1));

    // Efficiency color coding
    const effNum = parseFloat(efficiencyPercent);
    const effColor = effNum >= 21 ? 'text-emerald-300' : effNum >= 19 ? 'text-green-300' : 'text-yellow-300';
    const effBg = effNum >= 21 ? 'bg-emerald-500/15 border-emerald-500/30' : effNum >= 19 ? 'bg-green-500/15 border-green-500/30' : 'bg-yellow-500/15 border-yellow-500/30';

    return (
        <div
            className={cn(
                "group relative flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl transition-all duration-300 overflow-hidden",
                "border border-slate-700/60 shadow-md",
                isSelected && "border-blue-500 ring-1 ring-blue-500/50 shadow-blue-500/20",
                !isSelected && "hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/40 hover:-translate-y-1 hover:scale-[1.02]",
                mode === 'inventory' && "cursor-pointer"
            )}
            onClick={mode === 'inventory' ? onSelect : undefined}
        >
            {/* ── THUMBNAIL + BADGE OVERLAY ── */}
            <div className="relative h-28 bg-slate-800/50 flex items-center justify-center overflow-hidden border-b border-slate-700/40">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent z-10" />

                {/* Product Image */}
                <img
                    src={imageUrl}
                    alt={module.model}
                    className="w-full h-full object-contain p-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />

                {/* Tech Type Badge - Top Left */}
                <div className={cn(
                    "absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider border backdrop-blur-sm",
                    isMono
                        ? "bg-slate-600/40 text-slate-200 border-slate-500/40"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                )}>
                    {typeLabel}
                </div>

                {/* Efficiency Badge - Top Right */}
                <div className={cn(
                    "absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded border backdrop-blur-sm",
                    effBg
                )}>
                    <Sun size={8} className={effColor} />
                    <span className={cn("text-[9px] font-bold", effColor)}>{efficiencyPercent}%</span>
                </div>

                {/* Power - Bottom Center (overlaid) */}
                <div className="absolute bottom-2 left-0 right-0 z-20 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
                        {module.electrical.pmax}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Wp</span>
                </div>
            </div>

            {/* ── MODEL INFO ── */}
            <div className="px-3 pt-2.5 pb-1.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                    {module.manufacturer}
                </p>
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight" title={module.model}>
                    {module.model}
                </p>
            </div>

            {/* ── SPECS GRID ── */}
            <div className="mx-2 mb-2 grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-slate-700/30">
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/60" title="Área">
                    <Ruler size={10} className="text-cyan-400" />
                    <span className="text-[9px] font-semibold text-slate-300">
                        {areaM2} <span className="text-slate-500">m²</span>
                    </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/60" title="Células">
                    <SlidersHorizontal size={10} className="text-violet-400" />
                    <span className="text-[9px] font-semibold text-slate-300">
                        {module.physical.cells || 144} <span className="text-slate-500">Cél.</span>
                    </span>
                </div>
            </div>

            {/* ── ACTIONS ── */}
            <div className="p-2 pt-0 mt-auto">
                {mode === 'catalog' ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
                        className={cn(
                            "w-full h-8 flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200",
                            "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm shadow-emerald-500/20",
                            "hover:from-emerald-500 hover:to-emerald-400 hover:shadow-md hover:shadow-emerald-500/30",
                            "active:scale-[0.97]",
                            "text-[10px] font-bold tracking-wide uppercase"
                        )}
                    >
                        <Plus size={13} className="stroke-[2.5]" />
                        Adicionar
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-slate-600 rounded-lg bg-slate-800/80 overflow-hidden">
                            <button
                                onClick={(e) => { e.stopPropagation(); onQuantityChange?.(-1); }}
                                className="px-2 py-1 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onQuantityChange?.(1); }}
                                className="px-2 py-1 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
