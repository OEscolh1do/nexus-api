import React from 'react';
import { DenseCard } from '@/components/ui/dense-form';
import { Zap, Leaf, CheckCircle, Trees } from 'lucide-react';
import { ProposalCalculations } from '../types';

interface ProposalSpecsProps {
    metrics: ProposalCalculations['metrics'];
    pricing: ProposalCalculations['pricing'];
    financials: ProposalCalculations['financials'];
}

export const ProposalSpecs: React.FC<ProposalSpecsProps> = ({ metrics, financials }) => {

    const formatNumber = (val: number, digits = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val);
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Environmental Impact Calculation (Standard Factors)
    // 1 kWh = ~0.084 kg CO2 (Average Grid Emission Factor)
    // 1 Tree = ~150 kg CO2 over 20 years -> ~7.5 kg CO2/year
    const annualGenKwh = financials.estimatedMonthlyGenKwh * 12;
    const co2avoidedTon = (annualGenKwh * 0.084) / 1000; // Tons per year
    const treesEquivalent = Math.round((co2avoidedTon * 1000) / 7.5); // Trees per year

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. TECHNICAL SUMMARY (Hardware) */}
            <DenseCard className="p-0 overflow-hidden border-slate-200">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                    <Zap size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 uppercase">Resumo Técnico</span>
                </div>
                <div className="p-4 space-y-3">
                    <Row label="Potência do Sistema" value={`${formatNumber(metrics.totalPowerkWp)} kWp`} highlight />
                    <Row label="Módulos Fotovoltaicos" value={`${metrics.totalModules}x (Alta Eficiência)`} />
                    <Row label="Inversores" value={`${metrics.totalInverters}x (Monofásico/Trifásico)`} />
                    <Row label="Área de Telhado" value={`~${formatNumber(metrics.totalModules * 2.2, 0)} m²`} />
                </div>
            </DenseCard>

            {/* 2. ENVIRONMENTAL IMPACT (Green) */}
            <DenseCard className="p-0 overflow-hidden border-emerald-100 bg-emerald-50/30">
                <div className="bg-emerald-100/50 border-b border-emerald-100 px-4 py-3 flex items-center gap-2">
                    <Leaf size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase">Impacto Ambiental (Anual)</span>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                            <Trees size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-700">{treesEquivalent}</div>
                            <div className="text-[10px] uppercase font-bold text-emerald-500">Árvores Plantadas</div>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-100">
                        <Row label="CO2 Evitado" value={`${formatNumber(co2avoidedTon, 1)} Toneladas`} highlightColor="text-emerald-600" />
                        <Row label="Equivalente Carros" value={`${(co2avoidedTon / 4.6).toFixed(1)} retirados`} description="da rua por ano" />
                    </div>
                </div>
            </DenseCard>

            {/* 3. PERFORMANCE METRICS (KPIs) */}
            <DenseCard className="p-0 overflow-hidden border-slate-200">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                    <CheckCircle size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 uppercase">Indicadores de Performance</span>
                </div>
                <div className="p-4 space-y-3">
                    <Row label="Geração Estimada (Ano)" value={`${formatNumber(annualGenKwh, 0)} kWh`} />
                    <Row label="Economia (25 Anos)" value={formatCurrency(financials.monthlySavings * 12 * 25)} highlightColor="text-neonorte-darkGreen" highlight />
                    <Row label="T.I.R. (Rentabilidade)" value={`${(financials.irr * 100).toFixed(1)}% a.a.`} highlightColor="text-neonorte-purple" />
                    <Row label="Valorização Imóvel" value="~4% a 6%" description="(Estudo Zillow)" />
                </div>
            </DenseCard>

        </div>
    );
};

const Row = ({ label, value, highlight, highlightColor, description }: { label: string, value: string, highlight?: boolean, highlightColor?: string, description?: string }) => (
    <div className="flex justify-between items-start text-sm">
        <span className="text-slate-500">{label}</span>
        <div className="text-right">
            <div className={`font-medium ${highlight ? 'font-bold text-slate-800' : highlightColor ? `font-bold ${highlightColor}` : 'text-slate-700'}`}>{value}</div>
            {description && <div className="text-[10px] text-slate-400">{description}</div>}
        </div>
    </div>
);
