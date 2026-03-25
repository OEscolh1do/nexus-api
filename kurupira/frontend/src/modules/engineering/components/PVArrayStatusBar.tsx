import React, { useMemo } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';
import { Separator } from '@/components/ui/separator';
import { Ruler, Weight, Maximize, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PVArrayStatusBar: React.FC<{ className?: string }> = ({ className }) => {
    // Data Selectors
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const { prCalculationMode, getPerformanceRatio, getAdditivePerformanceRatio } = useTechStore();

    // Metrics Calculation
    const metrics = useMemo(() => {
        const currentQty = modules.length;
        const totalPowerKw = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;
        const totalAreaM2 = modules.reduce((acc, m) => acc + (m.area), 0);
        const totalWeightKg = modules.reduce((acc, m) => acc + (m.weight), 0);

        // Target Calculation
        const refPowerKw = modules.length > 0 ? modules[0].power / 1000 : 0.55; 
        const validHsp = (clientData.monthlyIrradiation || []).filter(v => v > 0);
        const avgHsp = validHsp.length > 0 ? validHsp.reduce((a, b) => a + b, 0) / validHsp.length : 4.5;
        
        // Calculate dynamic average from invoices if available
        const invoicesTotalAvg = (clientData.invoices || []).reduce((acc, inv) => {
             const annualSum = (inv.monthlyHistory || []).reduce((a, b) => a + b, 0);
             return acc + (annualSum / 12);
        }, 0);

        const targetGeneration = invoicesTotalAvg > 0 ? invoicesTotalAvg : (clientData.averageConsumption || 0); 
        
        // Dynamic PR based on selected mode
        const performanceRatio = prCalculationMode === 'additive' 
            ? getAdditivePerformanceRatio() 
            : getPerformanceRatio();

        const minModules = refPowerKw > 0 && avgHsp > 0 && performanceRatio > 0
            ? Math.ceil(targetGeneration / (avgHsp * 30 * refPowerKw * performanceRatio))
            : 0;

        return { currentQty, totalPowerKw, totalAreaM2, totalWeightKg, minModules, avgHsp, performanceRatio };
    }, [modules, clientData, prCalculationMode, getPerformanceRatio, getAdditivePerformanceRatio]); 



    const isUnderSized = metrics.currentQty < metrics.minModules;

    // Compact Stat Item
    const StatItem = ({ label, value, unit, icon: Icon }: { label: string, value: string | number, unit: string, icon: any }) => (
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <Icon size={14} className="text-slate-500" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
                <span className="text-sm font-bold text-slate-700">{value} <span className="text-[10px] text-slate-400 font-medium">{unit}</span></span>
            </div>
        </div>
    );

    return (
        <div className={cn("h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-20", className)}>
            
            <div className="flex items-center gap-6">
                {/* Title Identifier */}
                <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-6 h-8">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Ruler size={16} className="text-blue-600" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Dimensionamento</span>
                        <span className="text-xs font-semibold text-slate-600">Arranjo Fotovoltaico</span>
                    </div>
                </div>
                
                <StatItem label="Potência" value={metrics.totalPowerKw.toFixed(2)} unit="kWp" icon={Zap} />
                <Separator orientation="vertical" className="h-6" />
                <StatItem label="Área" value={metrics.totalAreaM2.toFixed(1)} unit="m²" icon={Maximize} />
                <Separator orientation="vertical" className="h-6" />
                <StatItem label="Peso" value={metrics.totalWeightKg.toFixed(0)} unit="kg" icon={Weight} />
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200 h-8">
                <div className="flex flex-col items-end leading-none">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Meta de Módulos</span>
                    <div className="flex items-baseline gap-1">
                        <span className={cn("text-lg font-bold leading-none", isUnderSized ? "text-amber-600" : "text-emerald-600")}>
                            {metrics.currentQty}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/ {metrics.minModules}</span>
                    </div>
                </div>
                
                {isUnderSized ? (
                     <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-100 text-amber-600">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Abaixo</span>
                     </div>
                ) : (
                     <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-600">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Atingido</span>
                     </div>    
                )}
            </div>
        </div>
    );
};

