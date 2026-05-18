import React, { useState } from 'react';
import {
    Zap,
    TrendingUp,
    Calendar,
    Wallet,
    AlertTriangle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useProposalCalculator } from '../hooks/useProposalCalculator';
import { useSolarStore } from '@/core/state/solarStore';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';
import { cn } from '@/lib/utils';

export const ProposalStatusBar: React.FC = () => {
    const { metrics, pricing, financials } = useProposalCalculator();
    const projectStatus = useSolarStore(state => state.project.projectStatus);
    const approveProject = useSolarStore(state => state.approveProject);
    const getApprovalBlockers = useSolarStore(state => state.getApprovalBlockers);
    const { isReadyForApproval, unassignedModulesCount, orphanedInverterCount, dataQualityWarnings } = useElectricalValidation();

    const [blockers, setBlockers] = useState<string[]>([]);

    const handleApprove = () => {
        try {
            const currentBlockers = getApprovalBlockers();
            if (currentBlockers.length > 0) {
                setBlockers(currentBlockers);
                return;
            }
            setBlockers([]);
            approveProject();
        } catch (err) {
            console.error('[ProposalStatusBar] Erro ao validar aprovação:', err);
            setBlockers(['Erro interno ao validar o projeto. Tente novamente ou recarregue a página.']);
        }
    };

    return (
        <div className="flex flex-col bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
            {blockers.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 border-b border-rose-200">
                    <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-rose-600">
                        Aprovação bloqueada: {blockers.join(' · ')}
                    </span>
                    <button
                        onClick={() => setBlockers([])}
                        className="ml-auto text-rose-400 hover:text-rose-600 text-xs"
                    >✕</button>
                </div>
            )}
            <div className="flex items-center justify-between px-4 h-14 transition-all animate-in slide-in-from-top-2">

                {/* GRUPO 1: POTÊNCIA (SYSTEM SIZE) */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Zap size={12} className="text-amber-500" />
                            <span>Potência (Kit)</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                            {metrics.totalPowerkWp.toFixed(2)} <span className="text-xs font-medium text-slate-400">kWp</span>
                        </div>
                    </div>

                    <Separator orientation="vertical" className="h-8 bg-slate-100" />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span>Geração Mensal</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                            {financials.estimatedMonthlyGenKwh.toFixed(0)} <span className="text-xs font-medium text-slate-400">kWh</span>
                        </div>
                    </div>
                </div>

                {/* GRUPO 2: FINANCEIRO (PAYBACK & ROI) */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar size={12} className="text-neonorte-purple" />
                            <span>Payback</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                            {financials.paybackYears.toFixed(1)} <span className="text-xs font-medium text-slate-400">anos</span>
                        </div>
                    </div>

                    <Separator orientation="vertical" className="h-8 bg-slate-100" />

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <TrendingUp size={12} className="text-purple-500" />
                            <span>ROI</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                            {financials.roi.toFixed(0)} <span className="text-xs font-medium text-slate-400">%</span>
                        </div>
                    </div>
                </div>

                <Separator orientation="vertical" className="h-8 bg-slate-100" />

                {/* GRUPO 3: PREÇO FINAL (HERO METRIC) */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Wallet size={12} className="text-slate-600" />
                            <span>Investimento Total</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 leading-none mt-0.5 tracking-tight">
                            <span className="text-sm font-medium text-slate-400 mr-1">R$</span>
                            {pricing.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <Separator orientation="vertical" className="h-8 bg-slate-100 ml-4" />

                    <div className="ml-2">
                        {projectStatus === 'draft' ? (
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    onClick={handleApprove}
                                    className={cn(
                                        "px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2",
                                        isReadyForApproval
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    )}
                                >
                                    {isReadyForApproval
                                        ? <><span className="animate-pulse w-2 h-2 rounded-full bg-white/60"></span> Aprovar Projeto</>
                                        : <><span>⚠</span> Aprovar Projeto</>
                                    }
                                </button>
                                {!isReadyForApproval && (
                                    <span className="text-[9px] text-amber-500/80 font-semibold">
                                        {unassignedModulesCount > 0
                                            ? `${unassignedModulesCount} módulo(s) sem string`
                                            : orphanedInverterCount > 0
                                            ? `${orphanedInverterCount} inv. fantasma`
                                            : 'Verificar validação elétrica'}
                                    </span>
                                )}
                                {dataQualityWarnings.length > 0 && (
                                    <span className="text-[9px] text-amber-400/70 font-medium mt-0.5" title={dataQualityWarnings.join(' · ')}>
                                        ⚠ {dataQualityWarnings.length} aviso(s) de dados
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 cursor-not-allowed">
                                ✓ Projeto Aprovado (Read-Only)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
