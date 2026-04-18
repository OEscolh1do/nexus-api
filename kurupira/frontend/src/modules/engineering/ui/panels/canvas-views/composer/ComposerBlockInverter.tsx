import React, { useState, useMemo } from 'react';
import { Cpu, Trash2, AlertTriangle, Plus } from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { StatusChip, ChipSeverity } from '../../../../components/StatusChip';
import { cn } from '@/lib/utils';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore } from '@/modules/engineering/store/panelStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';

// =============================================================================
// COMPOSER BLOCK INVERTER — Bloco Materializado
// =============================================================================

const InverterInlineSelector: React.FC<{ onAdd: (item: InverterCatalogItem) => void }> = ({ onAdd }) => {
    const { inverters } = useCatalogStore();
    const [brand, setBrand] = useState('');
    const [modelId, setModelId] = useState('');

    const brands = useMemo(() =>
        [...new Set(inverters.map((i: InverterCatalogItem) => i.manufacturer))].sort(),
        [inverters]
    );
    const modelsForBrand = useMemo(() =>
        inverters.filter((i: InverterCatalogItem) => i.manufacturer === brand),
        [inverters, brand]
    );
    const selectedItem = inverters.find((i: InverterCatalogItem) => i.id === modelId);

    const handleAdd = () => {
        if (selectedItem) {
            onAdd(selectedItem);
            setBrand('');
            setModelId('');
        }
    };

    return (
        <div className="space-y-3">
            {/* Brand */}
            <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase font-black text-emerald-500/60 tracking-widest px-1">Fabricante</label>
                <select
                    value={brand}
                    onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
                    className="w-full h-8 px-2 bg-slate-950 border border-slate-800 rounded-sm text-[11px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors font-mono"
                >
                    <option value="">SELECIONAR MARCA...</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {/* Model */}
            {brand && (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[11px] uppercase font-black text-emerald-500/60 tracking-widest px-1">Modelo de Conversão</label>
                    <select
                        value={modelId}
                        onChange={(e) => setModelId(e.target.value)}
                        className="w-full h-8 px-2 bg-slate-950 border border-slate-800 rounded-sm text-[11px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors font-mono"
                    >
                        <option value="">SELECIONAR EQUIPAMENTO...</option>
                        {modelsForBrand.map((inv: InverterCatalogItem) => (
                            <option key={inv.id} value={inv.id}>
                                {inv.model} — {(inv.nominalPowerW / 1000).toFixed(2)}kW
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Add Button */}
            {selectedItem && (
                <button
                    onClick={handleAdd}
                    className="w-full h-8 mt-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-black rounded-sm transition-all animate-in zoom-in-95 duration-200 uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={12} strokeWidth={3} /> ADICIONAR AO PROJETO
                </button>
            )}
        </div>
    );
};

// =============================================================================
// COMPOSER BLOCK INVERTER — Desacoplado, Auto-gerencia placeholder
// =============================================================================

export const ComposerBlockInverter: React.FC = () => {
    const techInverters = useTechStore(s => s.inverters);
    const techInvertersList = toArray(techInverters);
    const removeInverter = useSolarStore(state => state.removeInverter);
    const projectInvertersArray = useSolarStore(selectInverters);

    // Fase 1: Apenas 1 Inversor
    const techInv = techInvertersList[0];
    const projectInv = projectInvertersArray.find((i: any) => i.id === techInv?.id);
    const { electrical } = useElectricalValidation();
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const restoreMap = usePanelStore(s => s.restoreMap);

    const isFocused = focusedBlock === 'inverter';
    const isDeemphasized = focusedBlock !== null && focusedBlock !== 'inverter';

    // ── Handler para adicionar inversor ──
    const handleAddInverter = (catalogItem: InverterCatalogItem) => {
        const newId = Math.random().toString(36).substr(2, 9);
        const mpptArray = Array.isArray(catalogItem.mppts) ? catalogItem.mppts : null;
        const mpptCount = mpptArray ? mpptArray.length : (catalogItem.mppts || 1);

        const mapped = {
            id: newId,
            quantity: 1,
            manufacturer: catalogItem.manufacturer,
            model: catalogItem.model,
            imageUrl: catalogItem.imageUrl,
            nominalPower: catalogItem.nominalPowerW ? catalogItem.nominalPowerW / 1000 : 0,
            maxEfficiency: typeof catalogItem.efficiency === 'object' ? (catalogItem.efficiency?.euro || 0) : (catalogItem.efficiency || 0),
            maxInputVoltage: catalogItem.maxInputVoltage || (mpptArray ? mpptArray[0]?.maxInputVoltage : 600) || 600,
            minInputVoltage: mpptArray ? mpptArray[0]?.minMpptVoltage || 40 : 40,
            maxInputCurrent: mpptArray ? Math.round(mpptArray.reduce((sum: number, m: any) => sum + (m.maxCurrentPerMPPT || 0), 0) * 10) / 10 : 0,
            outputVoltage: catalogItem.outputVoltage || 220,
            outputFrequency: catalogItem.outputFrequency || 60,
            maxOutputCurrent: catalogItem.maxOutputCurrent || 0,
            weight: catalogItem.weight || 0,
            connectionType: catalogItem.connectionType || 'Monofásico',
            mppts: mpptCount,
        };
        useSolarStore.getState().addInverter(mapped);
        useTechStore.getState().addInverter(catalogItem, newId);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EMPTY STATE — Placeholder compacto com seletor inline
    // ═══════════════════════════════════════════════════════════════════════

    if (!techInv || !projectInv) {
        return (
            <div 
                onClick={() => setFocusedBlock('inverter')}
                className={cn(
                    "relative rounded-none border-x border-b flex flex-col transition-all duration-300 z-10 cursor-pointer overflow-visible -mt-px",
                    isFocused
                        ? "border-emerald-500 bg-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
                        : isDeemphasized
                            ? "border-emerald-900/30 bg-emerald-950/40 opacity-40 select-none"
                            : "border-dashed border-emerald-600/30 bg-emerald-950 hover:bg-emerald-900/20 active:bg-emerald-950 transition-colors"
                )}
            >
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-emerald-500/10">
                    <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-emerald-500" />
                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Seleção Inversor</span>
                    </div>
                </div>

                <div className="p-4">
                    <InverterInlineSelector onAdd={handleAddInverter} />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILLED STATE — Bloco Inversor Materializado
    // ═══════════════════════════════════════════════════════════════════════

    const displayManufacturer = projectInv.manufacturer || 'Inversor';
    const displayModel = projectInv.model || 'Modelo';
    const displayPower = projectInv.nominalPower || 0;
    const maxEfficiency = projectInv.maxEfficiency || 0;

    const modules = useSolarStore(selectModules);
    let totalDcKwp = 0;
    modules.forEach(m => {
        totalDcKwp += (m.power || 0) / 1000;
    });

    const inverterEntries = electrical?.entries?.filter((e: any) => e.inverterId === techInv.id) || [];
    const hasError = inverterEntries.some((e: any) => e.status === 'error');
    const hasWarning = inverterEntries.some((e: any) => e.status === 'warning');

    const allMessages = Array.from(new Set(
        inverterEntries.flatMap((e: any) => e.messages || [])
    )).slice(0, 3) as string[];

    const ratioValue = displayPower > 0 ? totalDcKwp / displayPower : 0;
    const ratioSeverity: ChipSeverity =
        ratioValue >= 1.10 && ratioValue <= 1.25 ? 'ok'
        : ratioValue >= 1.05 && ratioValue <= 1.35 ? 'warn'
        : ratioValue > 0 ? 'error' : 'neutral';

    const maxVoc = inverterEntries.length > 0 ? Math.max(...inverterEntries.map((e: any) => e.vocMax)) : 0;
    const maxInputVoltage = projectInv.maxInputVoltage || 600;
    const vocMargin = maxInputVoltage > 0 ? maxVoc / maxInputVoltage : 0;
    const vocSeverity: ChipSeverity = maxVoc === 0 ? 'neutral' : vocMargin <= 0.95 ? 'ok' : vocMargin <= 1.00 ? 'warn' : 'error';

    const maxIsc = inverterEntries.length > 0 ? Math.max(...inverterEntries.map((e: any) => e.iscTotal)) : 0;
    const iscHasError = allMessages.some((msg: string) => msg.includes('Isc(') || msg.includes('Isc'));
    const iscSeverity: ChipSeverity = maxIsc === 0 ? 'neutral' : iscHasError ? 'warn' : 'ok';

    const statusColor = hasError ? 'border-red-500/50' : hasWarning ? 'border-amber-500/50' : 'border-emerald-500';
    const headerBg = hasError ? 'bg-red-500/5' : hasWarning ? 'bg-amber-500/5' : 'bg-emerald-500/5';

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeInverter(techInv.id);
        useTechStore.getState().removeInverter(techInv.id);
    };

    return (
        <div 
            onClick={() => { setFocusedBlock('inverter'); restoreMap(); }}
            className={cn(
                "relative rounded-none border-x border-b flex flex-col overflow-visible transition-all duration-300 z-10 cursor-pointer -mt-px shadow-lg",
                statusColor,
                isFocused
                    ? "bg-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
                    : isDeemphasized
                        ? "border-emerald-900/30 bg-emerald-950/40 opacity-40 select-none"
                        : "bg-slate-950/90 hover:bg-slate-950 backdrop-blur-sm"
        )}>
            {/* Header: CONVERSÃO AC */}
            <div className={cn("px-4 py-3 flex items-center justify-between border-b border-slate-800/40 transition-colors gap-3", headerBg)}>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-sm flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Cpu size={13} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">Conversão AC</span>
                           <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm font-bold font-mono">
                             {techInv.mpptConfigs.length} MPPT
                           </span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[140px] mt-1 uppercase tracking-tight">
                            {displayManufacturer} {displayModel}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={handleRemove} 
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded-sm transition-all shadow-inner active:scale-95" 
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Instrument Display: Dual Panel */}
            <div className="flex border-b border-slate-800/40 bg-slate-900/10">
                <div className="flex-1 p-3 flex flex-col items-center border-r border-slate-800/40 group hover:bg-emerald-500/[0.02] transition-colors">
                    <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest mb-1">Ac Output</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
                            {displayPower.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">kW</span>
                    </div>
                </div>
                <div className="flex-1 p-3 flex flex-col items-center group hover:bg-amber-500/[0.02] transition-colors">
                    <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest mb-1">Efficiency</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-mono font-bold text-amber-500 tabular-nums">
                            {(maxEfficiency * 100).toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 uppercase">%</span>
                    </div>
                </div>
            </div>

            {/* Status Chips Refinados */}
            {modules.length > 0 && (
                <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-slate-950 text-[11px]">
                    {ratioValue > 0 && <StatusChip label="Ratio" value={ratioValue.toFixed(2)} severity={ratioSeverity} />}
                    {maxVoc > 0 && <StatusChip label="Voc" value={`${maxVoc.toFixed(2)}V`} severity={vocSeverity} />}
                    {maxIsc > 0 && <StatusChip label="Isc" value={`${maxIsc.toFixed(2)}A`} severity={iscSeverity} />}
                </div>
            )}

            {/* Validation Logs */}
            {(hasError || hasWarning) && allMessages.length > 0 && (
                <div className={cn("px-3 py-2 border-t text-[11px] flex items-start gap-2 font-mono leading-tight",
                    hasError ? 'border-red-900/50 bg-red-950/20 text-red-400' : 'border-amber-900/50 bg-amber-950/20 text-amber-500'
                )}>
                    <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        {allMessages.map((msg: any, idx) => (
                           <div key={idx} className="flex gap-1.5">
                              <span className="opacity-40">[{idx + 1}]</span>
                              <span>{String(msg).toUpperCase()}</span>
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
