
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { InvoiceData } from '@/core/types';
import { cn } from '@/lib/utils';
import { DenseCard } from '@/components/ui/dense-form';
import { Zap } from 'lucide-react';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface ConsumptionChartProps {
    invoice?: InvoiceData;
    className?: string;
}

// Custom Tooltip Component
// Explicitly using any to avoid Vercel build issues with Recharts definitions
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-2 rounded shadow-sm text-xs">
                <p className="font-bold text-slate-700 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-500 capitalize">
                            {entry.name === 'total' ? 'Consumo' : entry.name === 'peak' ? 'Ponta' : 'Fora Ponta'}:
                        </span>
                        <span className="font-mono font-bold">
                            {entry.value?.toLocaleString('pt-BR')} kWh
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ invoice, className }) => {
    if (!invoice) return null;

    const isGroupA = invoice.rateGroup === 'A4';
    
    // Prepare Data
    const data = MONTH_LABELS.map((month, i) => {
        const peak = invoice.monthlyHistoryPeak?.[i] ?? 0;
        const offPeak = invoice.monthlyHistoryOffPeak?.[i] ?? 0;
        const total = invoice.monthlyHistory[i] ?? (peak + offPeak);
        
        return {
            month,
            total,
            peak,
            offPeak
        };
    });

    const average = data.reduce((acc, curr) => acc + curr.total, 0) / 12;

    // Define Colors
    const colorPeak = "#ef4444"; // red-500
    const colorOffPeak = "#0ea5e9"; // sky-500
    const colorSingle = "#f97316"; // orange-500 (Primary Brand)

    return (
        <DenseCard className={cn("flex flex-col h-[320px]", className)}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded bg-opacity-10", isGroupA ? "bg-blue-500 text-blue-600" : "bg-orange-500 text-orange-600")}>
                         <Zap size={14} />
                    </div>
                   <div>
                       <h4 className="text-xs font-bold text-slate-700 uppercase">Perfil de Consumo</h4>
                       <p className="text-[10px] text-slate-400 font-medium">
                           {isGroupA ? 'Sazonalidade Ponta vs Fora Ponta' : 'Histórico Mensal'}
                       </p>
                   </div>
                </div>
                
                <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Média Mensal</span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                        {average.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-400">kWh</span>
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                        
                        {isGroupA ? (
                            <>
                                <Bar 
                                    dataKey="offPeak" 
                                    name="Fora Ponta" 
                                    stackId="a" 
                                    fill={colorOffPeak} 
                                    radius={[0, 0, 0, 0]} 
                                    barSize={32}
                                />
                                <Bar 
                                    dataKey="peak" 
                                    name="Ponta" 
                                    stackId="a" 
                                    fill={colorPeak} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={32}
                                />
                            </>
                        ) : (
                            <Bar 
                                dataKey="total" 
                                name="Consumo" 
                                fill={colorSingle} 
                                radius={[4, 4, 0, 0]} 
                                barSize={32}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DenseCard>
    );
};
