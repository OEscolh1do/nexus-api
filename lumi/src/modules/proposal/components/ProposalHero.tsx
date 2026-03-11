import React from 'react';
import { DenseCard, DenseButton } from '@/components/ui/dense-form';
import { Download, ArrowRight, TrendingDown, Zap, Calendar } from 'lucide-react';
import { ProposalCalculations } from '../types';

interface ProposalHeroProps {
    pricing: ProposalCalculations['pricing'];
    financials: ProposalCalculations['financials'];
    onGeneratePDF: () => void;
}

export const ProposalHero: React.FC<ProposalHeroProps> = ({ pricing, financials, onGeneratePDF }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatNumber = (val: number, digits = 1) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val);

    // Simulated "Current Bill" based on savings + residual
    // We assume current bill ~ savings + (50 or 100 tax min). 
    // For visual impact, let's say Current Bill = Savings / 0.9 (assuming 90% reduction).
    const currentBillEstimate = financials.monthlySavings / 0.90;
    const newBillEstimate = currentBillEstimate - financials.monthlySavings;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. BILL COMPARISON CARD (Transformation) - 2 Columns */}
            <div className="md:col-span-2">
                 <DenseCard className="h-full bg-white border-slate-200 p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Zap className="text-amber-500" size={18} />
                            <span className="font-bold text-slate-700 uppercase tracking-wide text-xs">Transformação Energética</span>
                        </div>
                        <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                            -90% na Conta
                        </div>
                    </div>

                    <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center relative">
                        {/* Current Bill */}
                        <div className="text-center sm:text-left relative z-10 group">
                             <div className="text-xs font-bold text-slate-400 uppercase mb-2">Sua Conta Hoje</div>
                             <div className="text-3xl sm:text-4xl font-black text-slate-300 line-through decoration-red-400 decoration-4">
                                {formatCurrency(currentBillEstimate)}
                             </div>
                             <div className="text-xs text-red-400 font-medium mt-1 group-hover:opacity-100 opacity-0 transition-opacity">
                                100% Concessionária
                             </div>
                        </div>

                        {/* Arrow Icon (Middle) */}
                        <div className="hidden sm:flex justify-center absolute left-1/2 -translate-x-1/2 text-slate-200">
                             <ArrowRight size={32} />
                        </div>

                        {/* New Bill */}
                        <div className="text-center sm:text-right relative z-10">
                            <div className="text-xs font-bold text-emerald-600 uppercase mb-2">Com Lumi</div>
                            <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight">
                                {formatCurrency(newBillEstimate)}*
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2">
                                *Estimativa (Taxa Mínima/Ilum. Pública)
                            </div>
                        </div>
                    </div>
                </DenseCard>
            </div>

            {/* 2. ROI & ACTION CARD - 1 Column */}
            <div className="md:col-span-1">
                 <DenseCard className="h-full bg-slate-900 text-white border-none p-6 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <TrendingDown size={140} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 mb-6">
                            <Calendar size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Retorno (Payback)</span>
                        </div>
                        
                        <div className="mb-2">
                            <span className="text-6xl font-black tracking-tighter text-white">{formatNumber(financials.paybackYears, 1)}</span>
                            <span className="text-xl font-medium text-slate-400 ml-2">Anos</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-snug">
                            Tempo estimado para o sistema "se pagar" apenas com a economia gerada.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 uppercase">Investimento</span>
                            <span className="text-lg font-bold text-white">{formatCurrency(pricing.finalPrice)}</span>
                        </div>
                        
                        <DenseButton 
                            variant="primary" 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-900/20"
                            onClick={onGeneratePDF}
                            icon={<Download size={16} />}
                        >
                            Baixar Proposta PDF
                        </DenseButton>
                    </div>
                </DenseCard>
            </div>
        </div>
    );
};
