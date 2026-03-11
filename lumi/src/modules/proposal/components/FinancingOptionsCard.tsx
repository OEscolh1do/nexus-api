import React from 'react';
import { CalendarDays, TrendingDown, PiggyBank } from 'lucide-react';
import { FinanceParams, FinanceResults } from '../../finance/store/financeSchema';
import { DenseCard } from '@/components/ui/dense-form';

interface FinancingOptionsCardProps {
    pricing: { finalPrice: number };
    financials: FinanceResults;
    financeParams: FinanceParams;
}

export const FinancingOptionsCard: React.FC<FinancingOptionsCardProps> = ({
    financials,
    financeParams
}) => {
    if (financeParams.financingMode !== 'financed') return null;

    const installment = financials.monthlyInstallment || 0;
    const term = financeParams.loanTerm || 60;

    // Estimate Current Bill (Reverse engineer from savings + tax)
    // Assumption: Savings ~ 90% of bill. 
    // Bill = Savings / 0.9.
    const currentBill = financials.monthlySavings / 0.90;
    const newBill = currentBill - financials.monthlySavings; // Residual (Tax/FioB)

    const totalNewMonthlyCost = installment + newBill;
    const monthlyDifference = currentBill - totalNewMonthlyCost;
    const isPositiveFlow = monthlyDifference >= 0;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <DenseCard className="p-6 bg-slate-50 border-blue-200 border">
            <div className="flex items-center gap-2 mb-4">
                <PiggyBank className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-slate-800">Análise de Troca de Boleto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Cenário Atual */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between">
                    <span className="text-sm font-semibold text-slate-500 uppercase">Sua Conta Atual</span>
                    <div className="mt-2">
                        <span className="text-2xl font-bold text-slate-700">{formatCurrency(currentBill)}</span>
                        <span className="text-xs text-slate-400 block">Média mensal estimada</span>
                    </div>
                </div>

                {/* 2. Cenário Solar Financiado */}
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-blue-500 relative flex flex-col justify-between">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                        Cenário Proposto
                    </div>

                    <span className="text-sm font-semibold text-slate-500 uppercase">Parcela + Conta Mínima</span>
                    <div className="mt-2">
                        <span className="text-2xl font-bold text-blue-700">{formatCurrency(totalNewMonthlyCost)}</span>
                        <div className="flex flex-col text-xs text-slate-500 mt-1">
                            <span>Parcela: {formatCurrency(installment)} ({term}x)</span>
                            <span>Nova Conta: {formatCurrency(newBill)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Resultado (Economia/Custo) */}
                <div className={`p-4 rounded-lg shadow-sm border flex flex-col justify-between ${isPositiveFlow ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <span className={`text-sm font-semibold uppercase ${isPositiveFlow ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isPositiveFlow ? 'Economia Mensal Imediata' : 'Investimento Mensal'}
                    </span>
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            {isPositiveFlow ? <TrendingDown size={24} className="text-emerald-600" /> : <CalendarDays size={24} className="text-amber-600" />}
                            <span className={`text-2xl font-bold ${isPositiveFlow ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {formatCurrency(Math.abs(monthlyDifference))}
                            </span>
                        </div>
                        <span className={`text-xs block mt-1 ${isPositiveFlow ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isPositiveFlow
                                ? 'Troque sua conta pelo financiamento e economize já!'
                                : 'Valor adicional mensal para ter sua usina própria.'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detalhes do Financiamento */}
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4 text-center">
                <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">Entrada</span>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(financeParams.downPayment || 0)}</span>
                </div>
                <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">Financiado</span>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(Math.max(0, financeParams.capex - (financeParams.downPayment || 0)))}</span>
                </div>
                <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">Taxa</span>
                    <span className="text-sm font-semibold text-slate-700">{financeParams.loanInterestRate}% a.m.</span>
                </div>
                <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">Prazo</span>
                    <span className="text-sm font-semibold text-slate-700">{financeParams.loanTerm}x</span>
                </div>
            </div>
        </DenseCard>
    );
};
