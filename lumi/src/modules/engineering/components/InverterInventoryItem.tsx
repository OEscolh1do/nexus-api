import React from 'react';
import { Plus, Minus, Trash2, Zap, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Inverter } from '@/modules/crm/store/useEquipmentStore';
import { Badge } from '@/components/ui/badge';

interface InverterInventoryItemProps {
    inverter: Inverter;
    mode?: 'catalog' | 'inventory';
    quantity?: number;
    onAdd?: () => void;
    onQuantityChange?: (delta: number) => void;
    onRemove?: () => void;
}

/**
 * InverterInventoryItem - Modern Tech Card
 */
export const InverterInventoryItem: React.FC<InverterInventoryItemProps> = ({
    inverter,
    mode = 'catalog',
    quantity = 0,
    onAdd,
    onQuantityChange,
    onRemove
}) => {
    
    // Determine Phase Color/Label
    const isThreePhase = inverter.connectionType === 'TRIFÁSICO';
    const phaseLabel = isThreePhase ? '3Φ' : '1Φ';
    const phaseColor = isThreePhase 
        ? 'bg-orange-100 text-orange-700 border-orange-200' 
        : 'bg-blue-100 text-blue-700 border-blue-200';

    return (
        <div 
            className={cn(
                "group relative flex flex-col justify-between bg-white rounded-lg transition-all duration-300 overflow-hidden",
                "border border-slate-200 shadow-sm",
                "hover:shadow-md hover:border-blue-300/50 hover:-translate-y-0.5"
            )}
        >
            {/* 1. TOP BAR: Manufacturer & Phase */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50/50 border-b border-slate-100">
                <Badge variant="outline" className="bg-white text-[9px] font-bold text-slate-600 uppercase tracking-wider border-slate-200 shadow-sm px-1.5 h-4">
                    {inverter.manufacturer}
                </Badge>
                <div className={cn("text-[9px] font-black px-1 py-0.5 rounded border leading-none", phaseColor)}>
                    {phaseLabel}
                </div>
            </div>

            {/* 2. HERO: Power Output */}
            <div className="flex flex-col items-center justify-center py-2 px-2 relative">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                        {inverter.nominalPower.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">kW</span>
                </div>
                <div className="w-full text-center mt-0.5 px-2">
                     <p className="text-[9px] font-medium text-slate-500 truncate" title={inverter.model}>
                        {inverter.model}
                    </p>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Activity size={10} className="text-blue-400" />
                </div>
            </div>

            {/* 3. SPECS GRID */}
            <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-center gap-1 py-1.5">
                    <Cpu size={10} className="text-slate-400" />
                    <span className="text-[9px] font-semibold text-slate-600">
                        {inverter.mppts || 1} <span className="font-normal text-slate-400">MPPTs</span>
                    </span>
                </div>
                <div className="flex items-center justify-center gap-1 py-1.5">
                    <Zap size={10} className="text-slate-400" />
                    <span className="text-[9px] font-semibold text-slate-600">
                         {inverter.maxInputVoltage} <span className="font-normal text-slate-400">V</span>
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
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                )}
            </div>
        </div>
    );
};
