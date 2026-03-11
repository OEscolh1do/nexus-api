import React from 'react';
import { 
    Zap,
    TrendingUp, 
    Calendar,
    Wallet
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useProposalCalculator } from '../hooks/useProposalCalculator';

export const ProposalStatusBar: React.FC = () => {
    // 1. Consume Data
    const { metrics, pricing, financials } = useProposalCalculator();

    return (
        <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 transition-all animate-in slide-in-from-top-2">
            
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

                {/* GERAÇÃO ESTIMADA */}
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
                        <Calendar size={12} className="text-blue-500" />
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
            </div>
        </div>
    );
};
