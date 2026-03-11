import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { InvoiceData } from '@/core/types';
import { cn } from '@/lib/utils';
import { DenseCard } from '@/components/ui/dense-form';
import { BarChart3 } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface EnergyProfileChartProps {
    invoice?: InvoiceData;
    className?: string;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {

    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-2 rounded shadow-sm text-xs z-50">
                <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                             <span className="text-slate-500 capitalize">{entry.name}:</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                            {entry.value?.toLocaleString('pt-BR')} kWh
                        </span>
                    </div>
                ))}
                 {/* Total Sum if multiple */}
                 {payload.length > 1 && (
                     <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-slate-100">
                         <span className="text-slate-500 font-bold">Total:</span>
                         <span className="font-mono font-black text-slate-800">
                             {payload.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0).toLocaleString('pt-BR')} kWh
                         </span>
                     </div>
                 )}
            </div>
        );
    }
    return null;
};


export const EnergyProfileChart: React.FC<EnergyProfileChartProps> = ({ invoice, className }) => {
    
    // Global State
    const getSimulatedTotal = useSolarStore(state => state.getSimulatedTotal);
    const additionalLoadKwh = getSimulatedTotal();

    if (!invoice) return null;

    const isGroupA = invoice.rateGroup === 'A4';
    
    // Prepare Data
    const data = MONTH_LABELS.map((month, i) => {
        const peak = invoice.monthlyHistoryPeak?.[i] ?? 0;
        const offPeak = invoice.monthlyHistoryOffPeak?.[i] ?? 0;
        const baseTotal = invoice.monthlyHistory[i] ?? (peak + offPeak);
        
        // If Group A, we stack Peak + OffPeak + Additional
        // If Group B, we stack Total + Additional
        return {
            month,
            baseTotal,
            peak,
            offPeak,
            additional: additionalLoadKwh
        };
    });

    // Calculate Averages (Base + New)
    const annualBase = data.reduce((acc, curr) => acc + curr.baseTotal, 0);
    const annualNew = data.reduce((acc, curr) => acc + curr.baseTotal + curr.additional, 0);
    const avgBase = annualBase / 12;
    const avgNew = annualNew / 12;

    // Colors
    const colorPeak = "#ef4444"; // red-500
    const colorOffPeak = "#0ea5e9"; // sky-500
    const colorBase = "#f97316"; // orange-500
    const colorAdditional = "#8b5cf6"; // violet-500

    return (
        <DenseCard className={cn("flex flex-col h-full bg-white shadow-sm border-slate-200", className)}>
            {/* Header */}
            <div className="flex justify-between items-center mb-2 px-3 py-2 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                         <BarChart3 size={14} />
                    </div>
                   <div>
                       <h4 className="text-xs font-bold text-slate-700 uppercase">Perfil Energético</h4>
                       <p className="text-[10px] text-slate-400 font-medium">
                           {additionalLoadKwh > 0 ? 'Consumo Histórico + Carga Projetada' : 'Consumo Histórico'}
                       </p>
                   </div>
                </div>
                
                <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Média Projetada</span>
                    <span className="text-sm font-mono font-black text-slate-700">
                        {avgNew.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-400 font-normal">kWh/mês</span>
                    </span>
                    {additionalLoadKwh > 0 && (
                        <span className="block text-[10px] text-green-500 font-bold">
                            +{((avgNew / avgBase - 1) * 100).toFixed(1)}% vs anterior
                        </span>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 w-full p-2">
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
                        <Legend 
                            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                            iconType="circle" 
                            iconSize={8}
                        />
                        
                        {isGroupA ? (
                            <>
                                <Bar 
                                    dataKey="offPeak" 
                                    name="Fora Ponta" 
                                    stackId="a" 
                                    fill={colorOffPeak} 
                                    barSize={24}
                                />
                                <Bar 
                                    dataKey="peak" 
                                    name="Ponta" 
                                    stackId="a" 
                                    fill={colorPeak} 
                                    barSize={24}
                                />
                            </>
                        ) : (
                            <Bar 
                                dataKey="baseTotal" 
                                name="Consumo Atual" 
                                stackId="a" 
                                fill={colorBase} 
                                barSize={24}
                            />
                        )}

                        {/* Additional Load Stack */}
                        {additionalLoadKwh > 0 && (
                             <Bar 
                                dataKey="additional" 
                                name="Carga Adicional" 
                                stackId="a" 
                                fill={colorAdditional} 
                                barSize={24}
                                radius={[4, 4, 0, 0]}
                                // Optional pattern or distinct look
                                shape={(props: any) => {
                                    const { x, y, width, height, fill } = props;
                                    return (
                                        <g>
                                            <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} opacity={0.8} />
                                            {/* Striped pattern overlay could be added here */}
                                        </g>
                                    );
                                }}
                             />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DenseCard>
    );
};
