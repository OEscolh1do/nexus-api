import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Target, Users, Coins, BarChart3, Trophy } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend: number;
    color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => {
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    return (
        <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50/80 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200/60 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{title}</CardTitle>
                <div className={clsx("h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300", color)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-[24px] font-bold text-slate-800 tracking-tight">{value}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={clsx(
                        "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                        isPositive && "bg-emerald-50 text-emerald-600",
                        isNegative && "bg-rose-50 text-rose-600",
                        !isPositive && !isNegative && "bg-slate-50 text-slate-500"
                    )}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> :
                         isNegative ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {isPositive ? "+" : ""}{Math.abs(trend)}%
                    </div>
                    <span className="text-[11px] text-slate-400">vs mês anterior</span>
                </div>
            </CardContent>
        </Card>
    );
};

export const CommercialPerformance: React.FC = () => {
    const missionStats = {
        totalLeads: 1240,
        conversionRate: 12.5,
        activeRevenue: 'R$ 4.2M',
        activeMissions: 8
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mission Control</h2>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                        <BarChart3 className="w-3 h-3 text-blue-500" />
                        <span className="text-[11px] font-bold text-blue-600">Performance</span>
                    </div>
                </div>
                <p className="text-slate-500 text-[14px]">Visão tática das operações comerciais.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Leads (Pipeline)" value={missionStats.totalLeads.toLocaleString('pt-BR')} icon={Users} trend={2.4} color="bg-blue-50 text-blue-500" />
                <StatCard title="Receita Ativa" value={missionStats.activeRevenue} icon={Coins} trend={12} color="bg-emerald-50 text-emerald-500" />
                <StatCard title="Taxa de Conversão" value={`${missionStats.conversionRate}%`} icon={Target} trend={-1.2} color="bg-amber-50 text-amber-500" />
                <StatCard title="Missões em Campo" value={missionStats.activeMissions} icon={Target} trend={0} color="bg-purple-50 text-purple-500" />
            </div>

            {/* Main Content Areas */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Mission ROI Chart */}
                <Card className="col-span-4 border-slate-200/60 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
                        <CardTitle className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            Performance por Missão (ROI)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-slate-600">Revenue vs Logistics Cost per Region</p>
                                <p className="text-[12px] text-slate-400 mt-0.5">Integração com Data Warehouse pendente</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="col-span-3 border-slate-200/60 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
                        <CardTitle className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            Top Performers (Academy Score)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center hover:bg-blue-50/30 rounded-lg p-2 -mx-2 transition-colors duration-200">
                                    <div className={clsx(
                                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] mr-3 shrink-0",
                                        i === 1 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/25" :
                                        i === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                                        i === 3 ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white" :
                                        "bg-slate-100 text-slate-500"
                                    )}>
                                        {i}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-700 leading-none">Vendedor {String.fromCharCode(64 + i)}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Level {10 - i} • {1200 - (i * 50)} Academy Pts</p>
                                    </div>
                                    <span className="font-bold text-[13px] text-slate-700 shrink-0">R$ {150 - (i * 10)}k</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CommercialPerformance;
