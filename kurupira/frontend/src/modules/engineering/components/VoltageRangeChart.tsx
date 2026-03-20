import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTechStore } from '../store/useTechStore';
import { useSolarStore } from '@/core/state/solarStore';
import { INVERTER_CATALOG } from '../constants/inverters';
import { Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStringMetrics } from '../utils/electricalMath';

export const VoltageRangeChart: React.FC<{ className?: string }> = ({ className }) => {
    const { inverters, selectedModuleId } = useTechStore();
    const modules = useSolarStore(state => state.modules);
    
    const selectedModule = modules.find(m => m.id === selectedModuleId) || modules[0];

    const chartData = useMemo(() => {
        if (!selectedModule || inverters.length === 0) return [];

        const data: any[] = [];

        inverters.forEach(inv => {
            const spec = INVERTER_CATALOG.find(i => i.id === inv.catalogId);
            if (!spec) return;

            inv.mpptConfigs.forEach(mppt => {
                if (mppt.modulesPerString === 0) return;

                // Robust Calculation Logic usage
                const metrics = calculateStringMetrics(
                    {
                        voc: selectedModule.voc,
                        vmp: selectedModule.vmp,
                        isc: selectedModule.isc,
                        tempCoeffVoc: selectedModule.tempCoeff || -0.29,
                        // If selectedModule has specific Pmax coeff, use it, else undefined
                    },
                    mppt.modulesPerString,
                    0,  // Min Temp (Project Default?)
                    70  // Max Temp
                );

                data.push({
                    name: `${spec.model.slice(0, 10)}.. MPPT ${mppt.mpptId}`,
                    minMppt: spec.minMpptVoltage,
                    maxMppt: spec.maxMpptVoltage,
                    maxInput: spec.maxInputVoltage,
                    
                    // Operating Window
                    vmpMin: metrics.vmpMin, // @ 70°C
                    vmpMax: metrics.vmpMax, // @ 0°C
                    vmpNominal: metrics.vmpNominal,
                    
                    // Safety check
                    vocMax: metrics.vocMax, // @ 0°C
                    isSafe: metrics.vocMax <= spec.maxInputVoltage,
                    isMpptOk: metrics.vmpMin >= spec.minMpptVoltage && metrics.vmpMax <= spec.maxMpptVoltage
                });
            });
        });

        return data;

    }, [inverters, selectedModule]);

    if (chartData.length === 0) {
        return (
             <Card className={cn("h-56 bg-white border-slate-200 flex flex-col items-center justify-center text-slate-400", className)}>
                <Zap className="mb-2 opacity-20" size={32} />
                <span className="text-xs">Configure strings para visualizar tensões.</span>
            </Card>
        );
    }

    return (
        <Card className={cn("h-56 bg-white border-slate-200 flex flex-col overflow-hidden relative", className)}>
             <div className="absolute top-2 left-3 z-10 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Zap size={10} className="text-amber-500" />
                    Janela Operacional MPPT
                </span>
             </div>

             {/* Custom HTML Visualization Overlay - precise control */}
             <div className="absolute inset-0 top-8 px-4 pb-2 overflow-y-auto space-y-2 bg-white/50 backdrop-blur-[1px]">
                 {chartData.map((d, i) => (
                     <div key={i} className="flex items-center gap-2 text-xs">
                         <div className="w-24 shrink-0 text-right truncate text-[10px] font-medium text-slate-600" title={d.name}>{d.name}</div>
                         
                         <div className="flex-1 h-5 bg-slate-100 rounded-sm relative border border-slate-200 mt-0.5">
                             
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
                         <div className="w-16 shrink-0 text-[10px] font-mono text-slate-500 flex justify-end">
                            {!d.isSafe && <AlertTriangle size={10} className="text-red-500 mr-1" />}
                            {d.vmpNominal.toFixed(0)}V
                         </div>
                     </div>
                 ))}
             </div>
        </Card>
    );
};
