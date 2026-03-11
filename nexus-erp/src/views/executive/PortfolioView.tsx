import { usePortfolio } from "@/modules/executive/hooks/usePortfolio";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui/mock-components";
import { AlertCircle, Clock, CheckCircle2, Filter, Download, RefreshCw, Briefcase } from "lucide-react";
import clsx from "clsx";

export function PortfolioView() {
    const { projects, loading, error, refresh } = usePortfolio();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "ON_TRACK": return {
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                text: "No Prazo",
                badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
            };
            case "AT_RISK": return {
                icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
                text: "Em Risco",
                badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
            };
            case "DELAYED": return {
                icon: <Clock className="w-4 h-4 text-rose-500" />,
                text: "Atrasado",
                badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30",
            };
            default: return {
                icon: null,
                text: status,
                badge: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
            };
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    // --- Loading State ---
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="h-[400px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse"></div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Falha ao carregar portfólio</h3>
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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Portfólio Executivo</h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                            <Briefcase className="w-3 h-3 text-purple-500" />
                            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{projects.length} projetos</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">Visão consolidada da saúde vital dos projetos.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg gap-2 text-[13px]">
                        <Filter className="w-3.5 h-3.5" /> Filtros
                    </Button>
                    <Button variant="outline" className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg gap-2 text-[13px]">
                        <Download className="w-3.5 h-3.5" /> Exportar
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                <CardHeader className="border-b dark:border-slate-800/60 bg-gradient-to-r from-slate-50/80 dark:from-slate-900/80 to-transparent pb-4">
                    <CardTitle className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Projetos em Andamento</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3">Projeto</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-center">Progresso</th>
                                    <th className="px-5 py-3 text-right">Orçamento</th>
                                    <th className="px-5 py-3 text-center">Riscos</th>
                                    <th className="px-5 py-3">Gerente</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {projects.map((project) => {
                                    const variancePercent = ((project.budgetConsumed - project.totalBudget) / project.totalBudget) * 100;
                                    const isOverBudget = project.budgetConsumed > project.totalBudget;
                                    const config = getStatusConfig(project.status);

                                    return (
                                        <tr key={project.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors duration-200 group">
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">{project.name}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Prazo: {new Date(project.expectedDate).toLocaleDateString('pt-BR')}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {config.icon}
                                                    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", config.badge)}>
                                                        {config.text}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5 justify-center">
                                                    <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${project.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">{formatCurrency(project.budgetConsumed)}</p>
                                                <p className="text-[11px] text-slate-400">de {formatCurrency(project.totalBudget)}</p>
                                                {isOverBudget && (
                                                    <p className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center justify-end gap-0.5">
                                                        <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                                                        +{variancePercent.toFixed(1)}% Estourado
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold",
                                                    project.criticalRisks > 0 ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30" : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                                )}>
                                                    {project.criticalRisks}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-400">
                                                        {project.manager.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className="text-slate-600 dark:text-slate-300 text-[12px] font-medium">{project.manager}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-purple-600 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg text-[12px] transition-opacity duration-200">
                                                    Detalhes →
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
