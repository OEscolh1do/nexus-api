import React from 'react';
import { Plus, Minus, Trash2, Zap, Ruler, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { Badge } from '@/components/ui/badge';

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

/**
 * ModuleInventoryItem - Modern Tech Card for PV Modules
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
    
    // Determine Cell Type from model name (ModuleCatalogItem doesn't have a 'type' field)
    const modelLower = module.model.toLowerCase();
    const isMono = modelLower.includes('mono') || modelLower.includes('m10') || modelLower.includes('m12') || modelLower.includes('p-type');
    const typeLabel = isMono ? 'MONO' : 'POLY';
    const typeColor = isMono 
        ? 'bg-slate-800 text-slate-100 border-slate-700' 
        : 'bg-blue-100 text-blue-700 border-blue-200';

    // Compute area from physical dimensions (mm → m²)
    const areaM2 = ((module.physical.widthMm * module.physical.heightMm) / 1_000_000).toFixed(2);
    // Display efficiency: prefer electrical.efficiency (fraction), fallback to N/A
    const efficiencyDisplay = module.electrical.efficiency 
        ? (module.electrical.efficiency * 100).toFixed(1) 
        : ((module.electrical.pmax / (module.physical.widthMm * module.physical.heightMm / 1_000_000) / 10).toFixed(1));

    return (
        <div 
            className={cn(
                "group relative flex flex-col justify-between bg-white rounded-lg transition-all duration-300 overflow-hidden",
                "border border-slate-200 shadow-sm",
                isSelected && "border-blue-500 ring-1 ring-blue-500 shadow-md bg-blue-50/10",
                !isSelected && "hover:shadow-md hover:border-blue-300/50 hover:-translate-y-0.5",
                mode === 'inventory' && "cursor-pointer"
            )}
            onClick={mode === 'inventory' ? onSelect : undefined}
        >
            {/* 1. TOP BAR: Manufacturer & Tech Type */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50/50 border-b border-slate-100">
                <Badge variant="outline" className="bg-white text-[9px] font-bold text-slate-600 uppercase tracking-wider border-slate-200 shadow-sm px-1.5 h-4">
                    {module.manufacturer}
                </Badge>
                <div className={cn("text-[8px] font-bold px-1 py-0.5 rounded border tracking-tight", typeColor)}>
                    {typeLabel}
                </div>
            </div>

            {/* 2. HERO: Power Output */}
            <div className="flex flex-col items-center justify-center py-2 px-2 relative">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {module.electrical.pmax}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Wp</span>
                </div>
                <div className="w-full text-center mt-0.5 px-2">
                     <p className="text-[9px] font-medium text-slate-500 truncate" title={module.model}>
                        {module.model}
                    </p>
                </div>
                
                {/* Visual Accent: Efficiency Badge */}
                <div className="flex items-center gap-1 mt-1.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100">
                    <Zap size={8} className="fill-emerald-600 stroke-none" />
                    <span className="text-[8px] font-bold">{efficiencyDisplay}% Eficiência</span>
                </div>
            </div>

            {/* 3. SPECS GRID */}
            <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-center gap-1 py-1.5" title="Dimensões">
                    <Ruler size={10} className="text-slate-400" />
                    <span className="text-[9px] font-semibold text-slate-600">
                        {areaM2} <span className="font-normal text-slate-400">m²</span>
                    </span>
                </div>
                <div className="flex items-center justify-center gap-1 py-1.5" title="Células">
                    <SlidersHorizontal size={10} className="text-slate-400" />
                    <span className="text-[9px] font-semibold text-slate-600">
                         {module.physical.cells || 144} <span className="font-normal text-slate-400">Cél.</span>
                    </span>
                </div>
            </div>



            {/* 4. ACTIONS */}
            <div className="p-1.5 border-t border-slate-100 bg-white">
                {mode === 'catalog' ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd?.();
                        }}
                        className={cn(
                            "w-full h-7 flex items-center justify-center gap-1.5 rounded-md transition-all",
                            "bg-slate-900 text-white shadow-sm",
                            "hover:bg-blue-600 active:scale-[0.98]",
                            "text-[10px] font-bold tracking-wide"
                        )}
                    >
                        <Plus size={12} className="stroke-[3]" />
                        Adicionar
                    </button>
                ) : (
                   <div className="flex items-center gap-1.5">
                        {/* Quantity Stepper */}
                            <div className="flex items-center border border-slate-200 rounded-md bg-white">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onQuantityChange?.(-1); }}
                                    className="p-1 hover:bg-slate-100 text-slate-500"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-xs font-medium text-slate-700">{quantity}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onQuantityChange?.(1); }}
                                    className="p-1 hover:bg-slate-100 text-slate-500"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            
                        {/* Remove */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                   </div>
                )}
            </div>
        </div>
    );
};
