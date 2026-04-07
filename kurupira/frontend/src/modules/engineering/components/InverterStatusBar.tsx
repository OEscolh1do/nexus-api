import React from 'react';
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
import { useTechKPIs } from '../hooks/useTechKPIs';
import { useTechStore } from '../store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { FDI_LOW_PERCENT, FDI_HIGH_PERCENT, getFdiStatus, FDI_STATUS_CONFIG } from '../constants/thresholds';

export const InverterStatusBar: React.FC<{ className?: string }> = ({ className }) => {
    const { kpi } = useTechKPIs();
    const inverters = useTechStore(state => toArray(state.inverters));

    const fdiPercent = kpi.dcAcRatio * 100;
    const fdiStatus = getFdiStatus(kpi.dcAcRatio);
    const statusConfig = FDI_STATUS_CONFIG[fdiStatus];

    const totalInvCount = inverters.reduce((acc, inv) => acc + inv.quantity, 0);

    const statusIcon = fdiStatus === 'clipping' ? Activity 
        : fdiStatus === 'oversized' ? AlertTriangle 
        : CheckCircle2;
    const StatusIcon = statusIcon;

    const statusBg = fdiStatus === 'clipping' ? 'bg-red-50' 
        : fdiStatus === 'oversized' ? 'bg-amber-50' 
        : 'bg-emerald-50';
    const statusBorder = fdiStatus === 'clipping' ? 'border-red-100' 
        : fdiStatus === 'oversized' ? 'border-amber-100' 
        : 'border-emerald-100';
    const statusColor = fdiStatus === 'clipping' ? 'text-red-500' 
        : fdiStatus === 'oversized' ? 'text-amber-500' 
        : 'text-emerald-500';

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
                            {totalInvCount}
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
                        <span className={cn("text-xl font-black leading-none", statusColor)}>
                            {fdiPercent.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <Badge 
                    variant="outline" 
                    className={cn(
                        "h-9 px-3 flex flex-col items-start justify-center gap-0.5 border",
                        statusBg, statusBorder, statusColor
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <StatusIcon size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{statusConfig.label}</span>
                    </div>
                    <span className="text-[9px] opacity-80 font-normal normal-case">
                        Relação DC/AC: {kpi.dcAcRatio.toFixed(2)}x
                    </span>
                </Badge>
            </div>
        </div>
    );
};

