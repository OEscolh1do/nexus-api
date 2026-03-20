import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DenseCard } from '@/components/ui/dense-form';
import { TrendingUp } from 'lucide-react';

interface CashFlowChartProps {
    initialInvestment: number;
    monthlySavings: number;
    inflationRate: number; // Annual energy inflation (decimal, e.g. 0.045)
    years?: number;
}

export const AccumulatedCashFlowChart: React.FC<CashFlowChartProps> = ({ 
    initialInvestment, 
    monthlySavings, 
    inflationRate = 0.045,
    years = 25 
}) => {
    const data = React.useMemo(() => {
        const points = [];
        let accumulated = -initialInvestment;
        let currentAnnualSavings = monthlySavings * 12;

        for (let year = 0; year <= years; year++) {
            points.push({
                year: `Ano ${year}`,
                value: Math.round(accumulated),
                isPositive: accumulated >= 0
            });

            // Iterate for next year
            if (year < years) {
                // Apply inflation to savings for the next year
                currentAnnualSavings = currentAnnualSavings * (1 + inflationRate);
                accumulated += currentAnnualSavings;
            }
        }
        return points;
    }, [initialInvestment, monthlySavings, inflationRate, years]);

    const formatCurrency = (val: number) => {
        if (Math.abs(val) >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
        return `R$ ${val}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
                    <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${payload[0].value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Acumulado</p>
                </div>
            );
        }
        return null;
    };

    // Calculate gradient offset for coloring negative/positive areas differently
    const gradientOffset = () => {
        const dataMax = Math.max(...data.map((i) => i.value));
        const dataMin = Math.min(...data.map((i) => i.value));
      
        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;
      
        return dataMax / (dataMax - dataMin);
    };
      
    const off = gradientOffset();

    return (
        <DenseCard className="h-[350px] flex flex-col p-4 border-slate-200">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                    <TrendingUp size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Fluxo de Caixa Acumulado</h3>
                    <p className="text-xs text-slate-500">Retorno do investimento ao longo de 25 anos</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#10b981" stopOpacity={0.8}/> {/* Emerald 500 */}
                                <stop offset={off} stopColor="#ef4444" stopOpacity={0.8}/> {/* Red 500 */}
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="year" 
                            tick={{fontSize: 10, fill: '#64748b'}} 
                            tickLine={false}
                            axisLine={false}
                            interval={4}
                        />
                        <YAxis 
                            tickFormatter={formatCurrency} 
                            tick={{fontSize: 10, fill: '#64748b'}} 
                            tickLine={false}
                            axisLine={false}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#000" 
                            strokeWidth={0}
                            fill="url(#splitColor)" 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </DenseCard>
    );
};
