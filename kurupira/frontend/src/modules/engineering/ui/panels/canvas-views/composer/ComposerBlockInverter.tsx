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
import { LegoTab, LegoNotch } from './LegoConnectors';

// =============================================================================
// INLINE INVERTER SELECTOR — Compacto, embutido no placeholder Lego
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
        <div className="space-y-1.5">
            {/* Brand */}
            <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setModelId(''); }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
            >
                <option value="">Marca do inversor...</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Model */}
            {brand && (
                <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
                >
                    <option value="">Modelo...</option>
                    {modelsForBrand.map((inv: InverterCatalogItem) => (
                        <option key={inv.id} value={inv.id}>
                            {inv.model} — {inv.nominalPowerW / 1000}kW · {inv.mppts?.length || 1} MPPT
                        </option>
                    ))}
                </select>
            )}

            {/* Add Button */}
            {selectedItem && (
                <button
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded transition-colors animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                    <Plus size={10} /> Adicionar
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
                    "relative rounded-b-sm rounded-t-none border flex flex-col transition-all duration-300 z-10 cursor-pointer overflow-visible pt-[16px] -mt-px animate-lego-snap",
                    isFocused
                        ? "border-emerald-500 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50"
                        : isDeemphasized
                            ? "border-emerald-900/30 bg-emerald-950/40 opacity-50 grayscale select-none"
                            : "border-dashed border-emerald-600/30 bg-emerald-950/60 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]"
                )}
            >
                {/* Lego Notch (recebe tab DC do módulo) */}
                <LegoNotch color="emerald" dashed />

                {/* Lego Tab AC (base) */}
                <LegoTab label="AC" color="emerald" dashed />
                {/* Header compacto */}
                <div className="px-3 py-2 flex items-center gap-2 border-b border-emerald-500/10">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Cpu size={11} />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Inversor</span>
                </div>

                {/* Seletor inline */}
                <div className="p-2.5">
                    <InverterInlineSelector onAdd={handleAddInverter} />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILLED STATE — Bloco Inversor Materializado
    // ═══════════════════════════════════════════════════════════════════════

    const displayManufacturer = projectInv.manufacturer || 'Inversor';
    const displayModel = projectInv.model || 'Modelo Desconhecido';
    const displayPower = projectInv.nominalPower || 0;

    const modules = useSolarStore(selectModules);
    let totalDcKwp = 0;
    let totalModules = 0;
    modules.forEach(m => {
        totalDcKwp += (m.power || 0) / 1000;
        totalModules += 1;
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

    const statusColor = hasError ? 'border-red-500/40' : hasWarning ? 'border-amber-500/40' : 'border-emerald-500/30';
    const headerBg = hasError ? 'bg-red-500/5' : hasWarning ? 'bg-amber-500/5' : 'bg-emerald-950/30';

    const handleRemove = () => {
        removeInverter(techInv.id);
        useTechStore.getState().removeInverter(techInv.id);
    };

    return (
        <div 
            onClick={() => { setFocusedBlock('inverter'); restoreMap(); }}
            className={cn(
                "relative rounded-b-sm rounded-t-none border flex flex-col overflow-visible transition-all duration-300 z-10 cursor-pointer animate-lego-snap pt-[16px] -mt-px",
                statusColor,
                isFocused
                    ? "border-emerald-500 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50"
                    : isDeemphasized
                        ? "border-emerald-900/30 bg-emerald-950/40 opacity-50 grayscale select-none"
                        : "border-emerald-600/40 bg-emerald-950/70 hover:border-emerald-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
        )}>
            {/* Lego Notch (recebe tab DC do módulo) */}
            <LegoNotch color="emerald" />

            {/* Lego Tab AC (base) */}
            <LegoTab label="AC" color="emerald" />
            {/* Header */}
            <div className={cn("px-4 py-3 flex items-center justify-between border-b border-slate-800/50 transition-colors gap-3", headerBg)}>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Cpu size={13} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[140px]">
                            {displayManufacturer} {displayModel}
                        </span>
                        <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                            <span className="text-emerald-500/80">{displayPower}kW</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-600"></span>
                            <span className="text-slate-400 uppercase tracking-tighter">{techInv.mpptConfigs.length} MPPTs</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleRemove} 
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800/60 rounded transition-all" 
                    title="Remover inversor"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Status Chips */}
            {totalModules > 0 && (
                <div className="px-2.5 py-1.5 flex flex-wrap gap-1 bg-slate-950/30">
                    {ratioValue > 0 && <StatusChip label="Ratio" value={ratioValue.toFixed(2)} severity={ratioSeverity} />}
                    {maxVoc > 0 && <StatusChip label="Voc" value={`${maxVoc.toFixed(0)}V`} severity={vocSeverity} />}
                    {maxIsc > 0 && <StatusChip label="Isc" value={`${maxIsc.toFixed(1)}A`} severity={iscSeverity} />}
                </div>
            )}

            {/* Validation Messages */}
            {(hasError || hasWarning) && allMessages.length > 0 && (
                <div className={cn("px-2.5 py-1.5 border-t text-[8px] flex items-start gap-1 font-medium",
                    hasError ? 'border-red-900/50 bg-red-950/20 text-red-400' : 'border-amber-900/50 bg-amber-950/20 text-amber-500'
                )}>
                    <AlertTriangle size={9} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                        {allMessages.map((msg: any, idx) => <span key={idx}>{String(msg)}</span>)}
                    </div>
                </div>
            )}
        </div>
    );
};
