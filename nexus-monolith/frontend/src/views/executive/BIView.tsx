import { useBI } from "@/modules/executive/hooks/useBI";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui/mock-components";
import { Download, Filter, BarChart3, PieChart as PieChartIcon, Target, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366f1'];

export function BIView() {
    const { revenueByType, riskDistribution, loading, error, refresh } = useBI();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'BRL' }).format(value);
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-56 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-80 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[380px] bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>
                    <div className="h-[380px] bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Falha ao carregar dados de BI</h3>
                    <p className="text-sm text-slate-500 max-w-md mt-1">{error}</p>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Business Intelligence</h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-full">
                            <PieChartIcon className="w-3 h-3 text-purple-500" />
                            <span className="text-[11px] font-bold text-purple-600">Analytics</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">Análises avançadas e relatórios customizados da operação.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="text-slate-600 bg-white rounded-lg gap-2 text-[13px]">
                        <Filter className="w-3.5 h-3.5" /> DRE Mensal
                    </Button>
                    <Button variant="outline" className="text-slate-600 bg-white rounded-lg gap-2 text-[13px]">
                        <Download className="w-3.5 h-3.5" /> Exportar (PDF)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1: Receita vs Margem */}
                <Card className="flex flex-col border-slate-200/60 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent pb-4">
                        <CardTitle className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center">
                                <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            Receita vs Margem (Por BU)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-6 flex-1">
                        <div className="h-[300px] min-h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByType} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                                    <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        formatter={(value: number | undefined) => formatCurrency(Number(value ?? 0))}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '10px 14px', fontSize: '13px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                    <Bar dataKey="revenue" name="Receita Bruta" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                                    <Bar dataKey="margin" name="Margem Contribuição" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Gráfico 2: Distribuição de Riscos */}
                <Card className="flex flex-col border-slate-200/60 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent pb-4">
                        <CardTitle className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                                <PieChartIcon className="w-3.5 h-3.5 text-rose-500" />
                            </div>
                            Distribuição de Riscos Mapeados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-6 flex-1 flex flex-col justify-center">
                        <div className="h-[300px] min-h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {riskDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | undefined) => `${value ?? 0}%`}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '10px 14px', fontSize: '13px' }}
                                    />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Warehouse Placeholder */}
            <Card className="border-slate-200/60 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-500/50 via-purple-400/30 to-purple-500/50"></div>
                <CardContent className="p-0">
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-purple-400" />
                            </div>
                            <div className="absolute -inset-2 bg-purple-200/20 rounded-3xl blur-xl -z-10 animate-pulse"></div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Cubo de Dados não conectado</h3>
                            <p className="text-[14px] text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                                Este módulo de inteligência aguarda a liberação dos Datamarts no Data Warehouse da Neonorte (Phase 4).
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full mt-2">
                            <Target className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-[12px] font-semibold text-purple-600">Evolução do Faturamento por Unidade</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
