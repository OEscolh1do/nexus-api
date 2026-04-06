import React from 'react';
import { Plus, Minus, Trash2, Zap, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Inverter } from '../store/useTechStore';
import { API_URL } from '@/services/NexusClient';

interface InverterInventoryItemProps {
    inverter: Inverter;
    mode?: 'catalog' | 'inventory';
    quantity?: number;
    onAdd?: () => void;
    onQuantityChange?: (delta: number) => void;
    onRemove?: () => void;
}

const FALLBACK_IMAGE = '/assets/images/solar-inverter.png';

/**
 * InverterInventoryItem — Premium Engineering Card (P8 Visual Refactor)
 * Dark glass surface with product thumbnail, data-dense specs grid.
 */
export const InverterInventoryItem: React.FC<InverterInventoryItemProps> = ({
    inverter,
    mode = 'catalog',
    quantity = 0,
    onAdd,
    onQuantityChange,
    onRemove
}) => {
    const isThreePhase = (inverter.connectionType || '').toUpperCase().includes('TRI');
    const phaseLabel = isThreePhase ? '3Φ' : '1Φ';
    const mpptCount = inverter.mppts || 1;
    
    const rawImageUrl = (inverter as any).imageUrl;
    const imageUrl = rawImageUrl ? (rawImageUrl.startsWith('http') ? rawImageUrl : `${API_URL}${rawImageUrl}`) : FALLBACK_IMAGE;

    return (
        <div
            className={cn(
                "group relative flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl transition-all duration-300 overflow-hidden",
                "border border-slate-700/60 shadow-md",
                "hover:shadow-xl hover:shadow-neonorte-purple/10 hover:border-neonorte-purple/40 hover:-translate-y-1 hover:scale-[1.02]"
            )}
        >
            {/* ── THUMBNAIL + BADGE OVERLAY ── */}
            <div className="relative h-28 bg-slate-800/50 flex items-center justify-center overflow-hidden border-b border-slate-700/40">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent z-10" />

                {/* Product Image */}
                <img
                    src={imageUrl}
                    alt={inverter.model}
                    className="w-full h-full object-contain p-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />

                {/* Phase Badge - Top Left */}
                <div className={cn(
                    "absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide border backdrop-blur-sm",
                    isThreePhase
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                        : "bg-neonorte-purple/20 text-neonorte-lightPurple border-neonorte-purple/40"
                )}>
                    {phaseLabel}
                </div>

                {/* MPPT Badge - Top Right */}
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/60 backdrop-blur-sm border border-slate-600/40">
                    <Cpu size={9} className="text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-300">{mpptCount} MPPT{mpptCount > 1 ? 's' : ''}</span>
                </div>

                {/* Power - Bottom Center (overlaid) */}
                <div className="absolute bottom-2 left-0 right-0 z-20 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
                        {inverter.nominalPower.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">kW</span>
                </div>
            </div>

            {/* ── MODEL INFO ── */}
            <div className="px-3 pt-2.5 pb-1.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                    {inverter.manufacturer}
                </p>
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight" title={inverter.model}>
                    {inverter.model}
                </p>
            </div>

            {/* ── SPECS GRID ── */}
            <div className="mx-2 mb-2 grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-slate-700/30">
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/60">
                    <Zap size={10} className="text-amber-400" />
                    <span className="text-[9px] font-semibold text-slate-300">
                        {inverter.maxInputVoltage} <span className="text-slate-500">V</span>
                    </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/60">
                    <Activity size={10} className="text-cyan-400" />
                    <span className="text-[9px] font-semibold text-slate-300">
                        {(inverter.nominalPower * 1000).toFixed(0)} <span className="text-slate-500">W</span>
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
                            "bg-neonorte-purple text-white shadow-sm shadow-neonorte-purple/20",
                            "hover:bg-neonorte-lightPurple hover:shadow-md hover:shadow-neonorte-purple/30",
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
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
