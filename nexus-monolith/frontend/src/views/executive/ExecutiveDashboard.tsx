import { useExecutiveDashboard } from "@/modules/executive/hooks/useExecutiveDashboard";
import { MetricCard } from "@/modules/executive/ui/MetricCard";
import { TrendChart } from "@/modules/executive/ui/TrendChart";
import { RiskAlert } from "@/modules/executive/ui/RiskAlert";
import { Activity, Briefcase, Target, CheckCircle2, AlertOctagon, RefreshCw, Gauge } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui/mock-components";

const mockRevenueTrend = [
    { month: 'Jan', value: 1200000 },
    { month: 'Fev', value: 1350000 },
    { month: 'Mar', value: 1250000 },
    { month: 'Abr', value: 1500000 },
    { month: 'Mai', value: 1800000 },
    { month: 'Jun', value: 2100000 },
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

export function ExecutiveDashboard() {
    const { metrics, health, loading, error, refresh } = useExecutiveDashboard();

    const formatCurrency = (val: string | number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(val));
    const formatPercent = (val: string | number) => `${Number(val).toFixed(1)}%`;

    // --- Shimmer Skeleton ---
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-96 bg-slate-100 rounded animate-pulse"></div>
                </div>
                {/* Metric cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[120px] bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200/60 p-5 space-y-4 animate-pulse">
                            <div className="flex justify-between">
                                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                <div className="h-10 w-10 bg-purple-50 rounded-xl"></div>
                            </div>
                            <div className="h-7 w-20 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
                {/* Chart skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[380px] bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>
                    <div className="h-[380px] bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error || !metrics || !health) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <AlertOctagon className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Falha ao carregar dados</h3>
                    <p className="text-sm text-slate-500 max-w-md mt-1">{error || "Dados indisponíveis no momento."}</p>
                </div>
                <Button variant="outline" onClick={refresh} className="gap-2 rounded-lg">
                    <RefreshCw className="w-4 h-4" /> Tentar novamente
                </Button>
            </div>
        );
    }

    // --- Success State ---
    return (
        <div className="space-y-6">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {getGreeting()}, Executivo
                        </h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-full">
                            <Gauge className="w-3 h-3 text-purple-500" />
                            <span className="text-[11px] font-bold text-purple-600">Command Center</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">
                        Visão consolidada da operação e saúde estratégica — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Taxa de Conversão"
                    value={metrics.conversionRate}
                    icon={<Target />}
                    trend={+2.4}
                    formatter={formatPercent}
                />
                <MetricCard
                    title="Ticket Médio"
                    value={metrics.averageTicket}
                    icon={<Briefcase />}
                    trend={+12.5}
                    formatter={formatCurrency}
                />
                <MetricCard
                    title="Entregas no Prazo"
                    value={metrics.onTimeDeliveryRate}
                    icon={<CheckCircle2 />}
                    trend={-1.2}
                    formatter={formatPercent}
                />
                <MetricCard
                    title="Alinhamento Estratégico"
                    value={metrics.strategyAlignment}
                    icon={<Activity />}
                    trend={+5.0}
                    formatter={formatPercent}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2">
                    <TrendChart
                        title="Evolução de Receita (YTD)"
                        data={mockRevenueTrend}
                        dataKey="value"
                        xAxisKey="month"
                        height={320}
                    />
                </div>

                {/* Risk & Health Sidebar */}
                <div className="space-y-5">
                    <RiskAlert
                        risks={[
                            { id: '1', title: 'Atraso Crítico no Projeto Alpha', level: 'CRITICAL', trend: 'UP' },
                            { id: '2', title: 'Estouro de Orçamento - Base Sul', level: 'HIGH', trend: 'STABLE' },
                            { id: '3', title: 'Risco de Churn (Cliente B)', level: 'MEDIUM', trend: 'DOWN' }
                        ]}
                    />

                    <Card className="border-slate-200/60">
                        <CardContent className="p-5">
                            <h3 className="text-[13px] font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                Saúde do Portfólio
                            </h3>

                            <div className="space-y-3.5">
                                {[
                                    { label: "No Prazo", value: health.statusOverview.onTrack, pct: 75, color: "bg-emerald-500", textColor: "text-emerald-600" },
                                    { label: "Em Risco", value: health.statusOverview.atRisk, pct: 15, color: "bg-amber-400", textColor: "text-amber-600" },
                                    { label: "Atrasados", value: health.statusOverview.delayed, pct: 10, color: "bg-rose-500", textColor: "text-rose-600" },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="text-slate-500 font-medium">{item.label}</span>
                                            <span className={`font-bold ${item.textColor}`}>{item.value}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`${item.color} h-full rounded-full transition-all duration-700`}
                                                style={{ width: `${item.pct}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
