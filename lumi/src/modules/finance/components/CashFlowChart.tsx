import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { TrendingUp } from 'lucide-react';

export const CashFlowChart: React.FC = () => {
    const results = useSolarStore(state => state.financeResults);
    
    // Transform arrays into object array for Recharts
    const data = useMemo(() => {
        if (!results.cumulativeCashFlows || results.cumulativeCashFlows.length === 0) return [];
        return results.cumulativeCashFlows.map((val, index) => ({
            year: `Ano ${index}`,
            valor: val,
            isPositive: val >= 0
        }));
    }, [results.cumulativeCashFlows]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <DenseCard className="flex-1 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                     <TrendingUp size={14} className="text-emerald-600"/>
                     Fluxo de Caixa Acumulado
                 </h4>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#64748b'}} 
                            tickMargin={10}
                            interval={4} // Show every 5 years
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#64748b'}}
                            tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                        />
                        <Tooltip 
                            formatter={(value: any) => formatCurrency(value)}
                            labelStyle={{ color: '#64748b', fontSize: '12px' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                         {/* We only render one Area, but stylistically we want red for negative... Recharts Area supports gradient id but not dynamic color by value easily in one Area without complex offset calculation. 
                             For simplicity, we use Green Gradient, valid for general accumulation.
                             Alternatively, split data into pos/neg series? 
                             Let's stick to Green Gradient for cumulative flow which trends up.
                         */}
                        <Area 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="#059669" 
                            strokeWidth={2} 
                            fill="url(#colorFlow)" 
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </DenseCard>
    );
};
