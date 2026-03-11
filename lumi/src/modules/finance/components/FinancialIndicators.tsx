import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { ArrowUpRight, Clock, Coins, CircleDollarSign } from 'lucide-react';

export const FinancialIndicators: React.FC = () => {
    const results = useSolarStore(state => state.financeResults);
    
    // Formatting Helpers
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);
    const formatYear = (val: number) => `${val.toFixed(1).replace('.', ',')} anos`;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* VPL */}
            <DenseCard className="flex flex-col gap-1 p-3 border-l-4 border-l-emerald-500">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Coins size={12} /> V.P.L.
                </span>
                <span className={`text-xl font-bold ${results.npv >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCurrency(results.npv)}
                </span>
                <span className="text-[10px] text-slate-400">Valor Presente Líquido</span>
            </DenseCard>

            {/* Payback */}
            <DenseCard className="flex flex-col gap-1 p-3 border-l-4 border-l-blue-500">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                     <Clock size={12} /> Payback
                </span>
                <span className="text-xl font-bold text-slate-700">
                    {formatYear(results.payback)}
                </span>
                <span className="text-[10px] text-slate-400">Retorno Simples</span>
            </DenseCard>

            {/* TIR */}
            <DenseCard className="flex flex-col gap-1 p-3 border-l-4 border-l-purple-500">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                     <ArrowUpRight size={12} /> T.I.R.
                </span>
                <span className="text-xl font-bold text-slate-700">
                    {formatPercent(results.irr)}
                </span>
                <span className="text-[10px] text-slate-400">Taxa Interna Retorno</span>
            </DenseCard>

            {/* LCOE */}
            <DenseCard className="flex flex-col gap-1 p-3 border-l-4 border-l-amber-500">
                 <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                     <CircleDollarSign size={12} /> LCOE
                </span>
                <span className="text-xl font-bold text-slate-700">
                     {formatCurrency(results.lcoe)}
                </span>
                <span className="text-[10px] text-slate-400">Custo Energia / kWh</span>
            </DenseCard>
        </div>
    );
};
