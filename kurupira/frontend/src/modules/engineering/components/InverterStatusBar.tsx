import React, { useMemo } from 'react';
import { 
    Zap, 
    Activity, 
    CheckCircle2, 
    AlertTriangle,
    Server,
    TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';
import { INVERTER_CATALOG } from '../constants/inverters';
import { toArray } from '@/core/types/normalized.types';

export const InverterStatusBar: React.FC<{ className?: string }> = ({ className }) => {
    // 1. Consumer Stores
    const modules = useSolarStore(selectModules);
    const { inverters: invertersNormalized } = useTechStore();
    const inverters = toArray(invertersNormalized);

    // 2. Calculate KPIs
    const kpi = useMemo(() => {
        // ... (existing implementation)
        // Total DC (kWp)
        const totalDC = modules.reduce((acc, m) => acc + (m.quantity * m.power), 0) / 1000;

        // Total AC (kW)
        const totalAC = inverters.reduce((acc, inv) => {
            const spec = INVERTER_CATALOG.find(i => i.id === inv.catalogId);
            return acc + ((spec?.nominalPowerW || 0) * inv.quantity);
        }, 0) / 1000;

        // Total Modules Count
        const totalModCount = modules.reduce((acc, m) => acc + m.quantity, 0);

        // Total Inverters Count
        const totalInvCount = inverters.reduce((acc, inv) => acc + inv.quantity, 0);

        // FDI (DC/AC Ratio)
        // Note: usage of getDCACRatio might need watts input, let's verify store signature. 
        // Store: getDCACRatio: (totalModulePowerW) => number
        const dcAcRatio = totalAC > 0 ? totalDC / totalAC : 0; 
        const fdiPercentage = dcAcRatio * 100;

        return { totalDC, totalAC, dcAcRatio, fdiPercentage, totalModCount, totalInvCount };
    }, [modules, inverters]);

    // 3. Status Logic
    let status = { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, label: 'Ideal' };
    
    if (kpi.fdiPercentage < 75) {
        status = { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle, label: 'Subdimensionado' };
    } else if (kpi.fdiPercentage > 130) {
        status = { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: Activity, label: 'Sobrecarga' };
    }

    const StatusIcon = status.icon;

    return (
        <div className={cn("flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 transition-all", className)}>
            
            {/* GROUP 1: SYSTEM OVERVIEW (AC POWER) */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Zap size={12} className="text-blue-500" />
                        <span>Potência AC</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                        {kpi.totalAC.toFixed(2)} <span className="text-xs font-medium text-slate-400">kW</span>
                    </div>
                </div>

                <Separator orientation="vertical" className="h-8 bg-slate-100" />
                
                {/* INVERTER COUNT */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Server size={12} className="text-slate-400" />
                        <span>Inversores</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-bold text-slate-800 leading-none">
                            {kpi.totalInvCount}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full">
                            {inverters.length} Tipos
                        </span>
                    </div>
                </div>
            </div>

            {/* GROUP 2: FDI (DC/AC RATIO) STATUS */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end mr-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Fator de Dimensionamento</span>
                        <TrendingUp size={12} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-xl font-black leading-none", status.color)}>
                            {(kpi.fdiPercentage).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <Badge 
                    variant="outline" 
                    className={cn(
                        "h-9 px-3 flex flex-col items-start justify-center gap-0.5 border",
                        status.bg, status.border, status.color
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <StatusIcon size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{status.label}</span>
                    </div>
                    <span className="text-[9px] opacity-80 font-normal normal-case">
                        Relação DC/AC: {kpi.dcAcRatio.toFixed(2)}x
                    </span>
                </Badge>
            </div>
        </div>
    );
};
