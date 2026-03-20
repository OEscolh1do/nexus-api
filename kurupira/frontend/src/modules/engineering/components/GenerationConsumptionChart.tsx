import React, { useMemo } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useProjectContext } from '@/hooks/useProjectContext';

interface GenerationConsumptionChartProps {
    className?: string;
}

export const GenerationConsumptionChart: React.FC<GenerationConsumptionChartProps> = ({ className }) => {
    // 1. Data Access
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const { getPerformanceRatio } = useTechStore();
    const { energyGoal } = useProjectContext();

    // 2. Calculations
    const data = useMemo(() => {
        const totalPowerKw = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000;
        const pr = getPerformanceRatio(); // e.g. 0.75
        const averageConsumption = energyGoal.monthlyTarget || 0;

        // Extract Consumption History from first invoice if available
        const consumptionHistory = (clientData.invoices?.[0]?.monthlyHistory?.length === 12)
            ? clientData.invoices[0].monthlyHistory
            : Array(12).fill(averageConsumption);

        // Use monthly irradiation or fallback to a flat average curve if empty
        const irradiationData = (clientData.monthlyIrradiation && clientData.monthlyIrradiation.length === 12 && clientData.monthlyIrradiation.some(v => v > 0))
            ? clientData.monthlyIrradiation
            : Array(12).fill(4.5); // Fallback HSP

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        let totalGenYear = 0;
        let totalConsYear = 0;

        const chartData = months.map((month, idx) => {
            const hsp = irradiationData[idx];
            const consumption = consumptionHistory[idx] || averageConsumption;

            // Generation = Power (kW) * HSP (h) * 30 (days) * PR (%)
            const generation = totalPowerKw * hsp * 30 * pr;

            totalGenYear += generation;
            totalConsYear += consumption;

            return {
                name: month,
                consumo: Math.round(consumption),
                geracao: Math.round(generation),
            };
        });

        const avgGen = totalGenYear / 12;
        const totalConsumption = totalConsYear; // Annual Consumption
        const coverage = totalConsumption > 0 ? (totalGenYear / totalConsumption) : 0;
        const delta = avgGen - (totalConsumption / 12);

        return { chartData, avgGen, coverage, delta, consumption: totalConsumption / 12 };
    }, [modules, clientData, energyGoal.monthlyTarget, getPerformanceRatio]);

    const isPositive = data.delta >= 0;

    return (
        <DenseCard className={cn("bg-white flex flex-col h-full overflow-hidden relative", className)}>

            {/* Header / Stats Overlay */}
            <div className="absolute top-3 left-4 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 rounded bg-teal-100 text-teal-700">
                        <Zap size={14} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">
                        Geração vs Consumo
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800 tracking-tight">
                        {(data.avgGen).toFixed(0)} <span className="text-xs font-normal text-slate-400">kWh/mês</span>
                    </span>
                </div>
                <div className={cn("flex items-center gap-1 text-xs font-bold mt-0.5", isPositive ? "text-emerald-600" : "text-amber-600")}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{(data.coverage * 100).toFixed(0)}%</span>
                    <span className="text-[10px] font-medium opacity-80 uppercase ml-1">Cobertura</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full mt-4 min-h-0 pl-0 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ top: 65, right: 10, left: 0, bottom: 0 }} barGap={0}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                            itemStyle={{ padding: 0 }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                        />

                        {/* Consumption Bar (Orange) */}
                        <Bar
                            dataKey="consumo"
                            fill="#fb923c"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                            animationDuration={1000}
                        />

                        {/* Generation Bar (Teal) */}
                        <Bar
                            dataKey="geracao"
                            fill="#14b8a6"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                            animationDuration={1000}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DenseCard>
    );
};
