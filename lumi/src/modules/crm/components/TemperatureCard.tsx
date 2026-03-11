import React, { useMemo, useState, useEffect } from 'react';
import { CloudRain, ArrowDown, ArrowUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useSolarStore } from '@/core/state/solarStore';
import { getEstimatedTemperature } from '@/services/solarDataService';

interface TemperatureCardProps {
    // Explicitly typed props
    monthly?: number[];
    isLoading?: boolean;
    annualAverage?: number;
    min?: number;
    max?: number;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
    monthly: initialMonthly, isLoading: initialLoading, annualAverage, min, max
}) => {
    // Acessa Store para Latitude
    const lat = useSolarStore(state => state.clientData.lat);

    // Estado local
    const [data, setData] = useState<number[]>(initialMonthly || Array(12).fill(25));
    const [stats, setStats] = useState({
        min: min ?? 0,
        max: max ?? 0,
        avg: annualAverage ?? 0
    });
    const [isCalc, setIsCalc] = useState(false);

    // Efeito: Recalcula APENAS se não houver dados iniciais e lat mudar
    useEffect(() => {
        // Prioridade para dados passados via prop (API)
        if (initialMonthly && initialMonthly.length > 0) {
            setData(initialMonthly);
            setStats({
                min: min ?? Math.min(...initialMonthly),
                max: max ?? Math.max(...initialMonthly),
                avg: annualAverage ?? (initialMonthly.reduce((a, b) => a + b, 0) / 12)
            });
            return;
        }

        // Fallback: Estimativa via Latitude
        const result = getEstimatedTemperature(lat ?? 0);
        setData(result.monthly);
        setStats({ min: result.min, max: result.max, avg: result.avg });
        setIsCalc(false);
    }, [lat, initialMonthly, min, max, annualAverage]);

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const chartData = useMemo(() => data.map((val, i) => ({ month: i, value: val })), [data]);

    const colors = {
        main: '#3b82f6', // blue-500
        fill: '#93c5fd', // blue-300
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 text-white text-[10px] p-1.5 rounded shadow-xl border border-slate-700 backdrop-blur-sm z-50">
                    <p className="font-bold mb-0.5">{payload[0].value.toFixed(1)}°C</p>
                    <p className="text-slate-400 text-[9px] uppercase">Mês {months[payload[0].payload.month]}</p>
                </div>
            );
        }
        return null;
    };

    if (initialLoading || isCalc) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 bg-blue-50/10">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-6 w-16 bg-blue-200 rounded" />
                    <div className="h-24 w-full bg-blue-100 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 relative group h-full bg-gradient-to-b from-blue-50/30 to-white">
            {/* Header: Dados Principais */}
            <div className="px-3 pt-2.5 pb-1 flex justify-between items-start shrink-0">
                <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-blue-600"><CloudRain size={14} /></span>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            Temperatura
                        </h4>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            {stats.avg.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">°C (Média)</span>
                    </div>
                </div>

                {/* Min/Max Compacto */}
                <div className="flex flex-col gap-1 items-end pt-1">
                    <div className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                        <span className="text-emerald-600 flex items-center bg-emerald-50 px-1 rounded-sm border border-emerald-100/50">
                            <ArrowDown size={6} className="mr-0.5" />{stats.min.toFixed(0)}°
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                        <span className="text-rose-600 flex items-center bg-rose-50 px-1 rounded-sm border border-rose-100/50">
                            <ArrowUp size={6} className="mr-0.5" />{stats.max.toFixed(0)}°
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Area: Chart (Area) */}
            <div className="flex-1 flex flex-col justify-end min-h-[50px] w-full relative pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.main} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors.main} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={colors.main}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#gradient-blue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
