import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTechStore } from '../store/useTechStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { toArray } from '@/core/types/normalized.types';
import { Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStringMetrics } from '../utils/electricalMath';

export const VoltageRangeChart: React.FC<{ className?: string, entityId?: string }> = ({ className, entityId }) => {
    const { inverters: invertersNormalized, selectedModuleId } = useTechStore();
    const inverters = toArray(invertersNormalized);
    const modules = useSolarStore(selectModules);
    const settings = useSolarStore(state => state.settings);
    const catalogInverters = useCatalogStore(state => state.inverters);
    
    // Fallback to first module if none selected
    const selectedModule = modules.find(m => m.id === selectedModuleId) || modules[0];

    const chartData = useMemo(() => {
        if (!selectedModule || inverters.length === 0 || !entityId) return [];

        const data: any[] = [];
        const parts = entityId.split('-mppt-');
        const targetInverterId = parts[0];
        const targetMpptId = parts.length === 2 ? parseInt(parts[1], 10) : null;

        // Use project settings for min temp (Ação 2a); max cell temp stays 70°C (IEC 61215)
        const minAmbientTemp = settings?.minHistoricalTemp ?? 0;
        const maxCellTemp = 70;

        inverters.forEach(inv => {
            // If an entityId is provided, filter out unrelated inverters
            if (targetInverterId && inv.id !== targetInverterId && inv.catalogId !== targetInverterId) return;

            const spec = catalogInverters.find(i => i.id === inv.catalogId);
            if (!spec) return;

            inv.mpptConfigs.forEach(mppt => {
                if (mppt.modulesPerString === 0) return;
                // If an entityId explicitly targets an MPPT, filter out the others
                if (targetMpptId !== null && mppt.mpptId !== targetMpptId) return;

                // Robust Calculation Logic usage
                const metrics = calculateStringMetrics(
                    {
                        voc: selectedModule.voc,
                        vmp: selectedModule.vmp,
                        isc: selectedModule.isc,
                        tempCoeffVoc: selectedModule.tempCoeff || -0.29,
                    },
                    mppt.modulesPerString,
                    minAmbientTemp,
                    maxCellTemp
                );

                const mpptSpec = spec.mppts?.find(m => m.mpptId === mppt.mpptId) || spec.mppts?.[0];
                const minMpptVoltage = mpptSpec?.minMpptVoltage || 80;
                const maxMpptVoltage = mpptSpec?.maxMpptVoltage || 550;
                const maxInputVoltage = mpptSpec?.maxInputVoltage || 600;

                data.push({
                    name: `MPPT ${mppt.mpptId} (${spec.model.slice(0, 10)})`,
                    minMppt: minMpptVoltage,
                    maxMppt: maxMpptVoltage,
                    maxInput: maxInputVoltage,
                    
                    // Operating Window
                    vmpMin: metrics.vmpMin, // @ 70°C
                    vmpMax: metrics.vmpMax, // @ 0°C
                    vmpNominal: metrics.vmpNominal,
                    
                    // Safety check
                    vocMax: metrics.vocMax, // @ 0°C
                    isSafe: metrics.vocMax <= maxInputVoltage,
                    isMpptOk: metrics.vmpMin >= minMpptVoltage && metrics.vmpMax <= maxMpptVoltage
                });
            });
        });

        return data;

    }, [inverters, selectedModule, settings]);

    if (chartData.length === 0) {
        return null; // Do not render if there's no selected string or no data
    }

    return (
        <Card className={cn("h-auto min-h-[50px] bg-slate-900/90 backdrop-blur-md border-slate-800 flex flex-col overflow-hidden relative shadow-2xl", className)}>
             <div className="absolute top-2 left-3 z-10 flex flex-col">
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Zap size={10} className="text-emerald-400" />
                    Janela Operacional MPPT
                </span>
             </div>

             {/* Custom HTML Visualization Overlay - precise control */}
             <div className="pt-6 lg:pt-8 px-2 lg:px-3 pb-2 lg:pb-3 space-y-1.5 lg:space-y-2">
                 {chartData.map((d, i) => (
                     <div key={i} className="flex items-center gap-2 text-xs">
                         <div className="w-14 sm:w-20 lg:w-24 shrink-0 text-right truncate text-[7px] xs:text-[8px] lg:text-[9px] font-bold text-slate-400" title={d.name}>{d.name}</div>
                         
                         <div className="flex-1 h-3 bg-slate-950/50 rounded-sm relative border border-slate-800/50 mt-0.5">
                             
                             {/* 1. MPPT Range (Safe Zone) - Green Zone */}
                             <div 
                                 className="absolute h-full bg-emerald-500/10 border-x border-emerald-500/30 transition-all"
                                 style={{
                                     left: `${(d.minMppt / d.maxInput) * 100}%`,
                                     width: `${((d.maxMppt - d.minMppt) / d.maxInput) * 100}%`
                                 }}
                                 title={`MPPT Range: ${d.minMppt}V - ${d.maxMppt}V`}
                             />

                             {/* 2. String Operating Window (Vmp Min to Vmp Max) - The Bar */}
                             <div 
                                 className={cn(
                                     "absolute top-1.5 h-2 rounded-full transition-all opacity-80",
                                      d.isMpptOk ? "bg-blue-500" : "bg-amber-500" // Warning color if outside MPPT
                                 )}
                                 style={{
                                     left: `${(d.vmpMin / d.maxInput) * 100}%`,
                                     width: `${Math.max(2, ((d.vmpMax - d.vmpMin) / d.maxInput) * 100)}%`
                                 }}
                                 title={`Operação: ${d.vmpMin.toFixed(0)}V (70°C) a ${d.vmpMax.toFixed(0)}V (0°C)`}
                             />

                             {/* 3. Voc Max Indicator (Red Tick) */}
                             <div 
                                 className={cn("absolute top-0 h-full w-0.5 z-20 transition-all", d.isSafe ? "bg-slate-300" : "bg-red-600 w-1")}
                                 style={{ left: `${(d.vocMax / d.maxInput) * 100}%` }}
                                 title={`Voc Max (0°C): ${d.vocMax.toFixed(0)}V`}
                             />

                         </div>

                         {/* Value Label */}
                         <div className="w-12 shrink-0 text-[10px] font-mono font-bold text-slate-300 flex justify-end">
                            {!d.isSafe && <AlertTriangle size={10} className="text-red-500 mr-1" />}
                            {d.vmpNominal.toFixed(0)}V
                         </div>
                     </div>
                 ))}
             </div>
        </Card>
    );
};
