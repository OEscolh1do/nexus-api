import React from 'react';
import {
    Zap,
    Maximize,
    Activity,
    Sun,
    Info,
    TrendingDown
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTechKPIs } from '../hooks/useTechKPIs';
import { LOSS_CONFIG } from '../constants/lossConfig';

export const TechStatusBar: React.FC = () => {
    // 1. Consume memoized calculations from hook
    const {
        kpi,
        displayedPr,
        displayedLabel,
        isAdditive,
        prValueIEC,
        prValueAdditive,
        lossProfile
    } = useTechKPIs();


    return (
        <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">

            {/* GRUPO 1: POTÊNCIAS (DC & AC) */}
            <div className="flex items-center gap-6">
                {/* DC Power */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Sun size={12} className="text-amber-500" />
                        <span>Potência DC</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                        {kpi.totalDC.toFixed(2)} <span className="text-xs font-medium text-slate-400">kWp</span>
                    </div>
                </div>

                <Separator orientation="vertical" className="h-8 bg-slate-100" />

                {/* AC Power */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Zap size={12} className="text-blue-500" />
                        <span>Potência AC</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-bold text-slate-800 leading-none">
                            {kpi.totalAC.toFixed(2)} <span className="text-xs font-medium text-slate-400">kW</span>
                        </span>

                        {/* Indicador de Overloading (FDI) */}
                        <Badge
                            variant="outline"
                            className={cn(
                                "h-5 px-1.5 text-[10px] font-mono border-0",
                                kpi.dcAcRatio > 1.35 ? "bg-red-50 text-red-600 border-red-100" :
                                    kpi.dcAcRatio < 0.8 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}
                            title={`Relação DC/AC: ${kpi.dcAcRatio.toFixed(2)}`}
                        >
                            FDI: {kpi.dcAcRatio.toFixed(2)}x
                        </Badge>
                    </div>
                </div>
            </div>

            {/* GRUPO 2: OCUPAÇÃO DE ÁREA */}
            <div className="flex items-center gap-4 w-1/5">
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Maximize size={12} />
                            <span>Uso de Área</span>
                        </div>
                        <span>
                            {kpi.usedArea.toFixed(1)} m²
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-slate-400">{kpi.availableArea ? kpi.availableArea.toFixed(0) : '--'} m²</span>
                        </span>
                    </div>
                    <Progress
                        value={kpi.areaUsagePercent}
                        className="h-1.5 bg-slate-100"
                        indicatorClassName={kpi.areaUsagePercent > 100 ? "bg-red-500" : "bg-blue-500"}
                    />
                </div>
            </div>

            <Separator orientation="vertical" className="h-8 bg-slate-100" />

            {/* GRUPO 3: META DE ENERGIA (Geração vs Consumo) */}
            <div className="flex items-center gap-4 w-1/4">
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className={cn(
                                kpi.generationCoverage > 110 ? "text-amber-500" :
                                    kpi.generationCoverage >= 95 ? "text-emerald-500" : "text-slate-400"
                            )} />
                            <span>Meta Energetica</span>
                        </div>
                        <span className="font-mono">
                            <span className={cn("font-bold", kpi.generationCoverage >= 95 ? "text-emerald-600" : "text-slate-600")}>
                                {kpi.estimatedGeneration.toFixed(0)}
                            </span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-slate-400">{kpi.targetConsumption.toFixed(0)} kWh</span>
                        </span>
                    </div>
                    <Progress
                        value={kpi.generationCoverage}
                        className="h-1.5 bg-slate-100"
                        indicatorClassName={cn(
                            kpi.generationCoverage > 110 ? "bg-amber-500" :
                                kpi.generationCoverage >= 95 ? "bg-emerald-500" : "bg-red-500"
                        )}
                    />
                </div>
            </div>

            {/* GRUPO 3: PERFORMANCE RATIO (Tooltip Rico) */}
            <div className="flex items-center gap-6">
                <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-end cursor-help group transition-all">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600">
                                    <span>{displayedLabel}</span>
                                    <Activity size={12} />
                                </div>
                                <div className="text-xl font-black text-slate-800 leading-none mt-0.5 flex items-center gap-1">
                                    {displayedPr}%
                                    <Info size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5" />
                                </div>
                            </div>
                        </TooltipTrigger>

                        {/* COMPOSIÇÃO DE PERDAS */}
                        <TooltipContent side="bottom" align="end" className="w-72 p-0 overflow-hidden shadow-xl border-slate-200 z-50">
                            {/* Header do Tooltip */}
                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <TrendingDown size={12} className="text-red-500" />
                                    Breakdown de Perdas
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">PR: {displayedPr}%</span>
                            </div>

                            {/* Lista de Perdas - Usando LOSS_CONFIG unificado */}
                            <div className="p-2 space-y-0.5 bg-white">
                                {LOSS_CONFIG.map((config) => {
                                    const value = lossProfile[config.key];

                                    // Cálculo de Exibição
                                    let displayLoss = 0;

                                    if (config.type === 'efficiency') {
                                        // Proteção para valores inválidos
                                        displayLoss = 100 - (value || 0);
                                        if (displayLoss < 0) displayLoss = 0;
                                    } else {
                                        displayLoss = value || 0;
                                    }

                                    return (
                                        <div key={config.key} className="flex items-center justify-between text-xs px-2 py-1 hover:bg-slate-50 rounded group">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600 font-medium">{config.label}</span>
                                            </div>
                                            <span className="font-mono font-medium text-red-500">
                                                -{displayLoss.toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                })}

                                <Separator className="my-2" />
                                <div className="px-2 pb-1 bg-slate-50/50 rounded p-1 space-y-2">

                                    {/* Comparativo de Metodologias */}
                                    <div className={cn("flex items-center justify-between", isAdditive ? "opacity-60" : "font-bold text-emerald-600")}>
                                        <p className="text-[9px] text-slate-500 leading-snug flex gap-1">
                                            IEC 61724 (Normativo)
                                        </p>
                                        <span className="text-xs">{prValueIEC}%</span>
                                    </div>

                                    <div className={cn("flex items-center justify-between border-t border-slate-200 pt-1 border-dashed", isAdditive ? "font-bold text-emerald-600" : "opacity-60")}>
                                        <p className="text-[9px] text-slate-500 leading-snug flex gap-1">
                                            Soma Simples (Aditivo)
                                        </p>
                                        <span className="text-xs">{prValueAdditive}%</span>
                                    </div>

                                    <p className="text-[9px] text-slate-400 leading-snug italic pt-1 mt-1 border-t border-slate-200">
                                        Modo ativo: <b>{isAdditive ? "Aditivo" : "Normativo (IEC)"}</b>.
                                        {isAdditive
                                            ? " Melhor para estimativas rápidas e conservadoras."
                                            : " Cálculo físico real, usado em contratos de performance."}
                                    </p>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};