import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/mock-components";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
    title: string;
    data: Record<string, string | number>[];
    dataKey: string;
    xAxisKey: string;
    color?: string;
    height?: number;
}

export function TrendChart({
    title,
    data,
    dataKey,
    xAxisKey,
    color = "#8B5CF6",
    height = 300
}: TrendChartProps) {
    return (
        <Card className="flex flex-col h-full border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <CardHeader className="pb-2 px-6 pt-5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        {title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="text-[11px] text-slate-400 font-medium">Receita</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px] px-2 pb-4">
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart data={data} margin={{ top: 20, right: 15, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="50%" stopColor={color} stopOpacity={0.08} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" />
                        <XAxis
                            dataKey={xAxisKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '10px',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                padding: '10px 14px',
                                fontSize: '13px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2.5}
                            fill="url(#colorGradient)"
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: color }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
