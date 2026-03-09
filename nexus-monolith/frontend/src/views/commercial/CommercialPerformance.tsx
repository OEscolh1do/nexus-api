import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ArrowUpRight, Target, Users, Coins } from 'lucide-react';

/* Quick Stats Component Local */
const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
                {trend > 0 ? <ArrowUpRight className="text-green-500 w-3 h-3 mr-1" /> : null}
                <span className={trend > 0 ? "text-green-600" : "text-slate-500"}>{Math.abs(trend)}% from last month</span>
            </p>
        </CardContent>
    </Card>
);

export const CommercialPerformance: React.FC = () => {
    // Mock Data
    const missionStats = {
        totalLeads: 1240,
        conversionRate: 12.5,
        activeRevenue: 'R$ 4.2M',
        activeMissions: 8
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mission Control</h2>
                <p className="text-slate-500">Visão tática das operações comerciais.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Leads (Pipeline)" value={missionStats.totalLeads} icon={Users} trend={2.4} />
                <StatCard title="Receita Ativa" value={missionStats.activeRevenue} icon={Coins} trend={12} />
                <StatCard title="Taxa de Conversão" value={`${missionStats.conversionRate}%`} icon={Target} trend={-1.2} />
                <StatCard title="Missões em Campo" value={missionStats.activeMissions} icon={Target} trend={0} />
            </div>

            {/* Main Content Areas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Mission ROI Chart Area (Placeholder) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Performance por Missão (ROI)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 rounded text-slate-400 border border-dashed m-4">
                        Chart: Revenue vs Logistics Cost per Region
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Performers (Academy Score)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                        {i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-none">Vendedor {String.fromCharCode(64 + i)}</p>
                                        <p className="text-xs text-muted-foreground">Level {10 - i} • {1200 - (i * 50)} Academy Pts</p>
                                    </div>
                                    <div className="font-bold text-sm">R$ {150 - (i * 10)}k</div>
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
