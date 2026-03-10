import { useAuditTrail } from "@/modules/executive/hooks/useAuditTrail";
import { format } from "date-fns";
import { Button } from "@/components/ui/mock-components";
import { ShieldAlert, Database, User, RefreshCw, AlertCircle, FileText } from "lucide-react";
import clsx from "clsx";

export function AuditTrailView() {
    const { logs, loading, error, refresh } = useAuditTrail();

    const getActionConfig = (action: string) => {
        switch (action) {
            case "delete": return { bg: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30", dot: "bg-rose-500" };
            case "create": return { bg: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30", dot: "bg-emerald-500" };
            default: return { bg: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30", dot: "bg-blue-500" };
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="h-[350px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse"></div>
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
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Falha ao carregar logs</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">{error}</p>
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
            <div className="flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Trail</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 rounded-full">
                            <ShieldAlert className="w-3 h-3 text-red-500" />
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">Compliance</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">
                        Registro imutável de transações e mudanças de estado crítico.
                    </p>
                </div>
                <Button variant="outline" className="gap-2 rounded-lg text-[13px]">
                    <Database className="w-3.5 h-3.5" />
                    Exportar Relatório
                </Button>
            </div>

            {/* Timeline-style log entries */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-slate-50/80 dark:from-slate-800/50 to-transparent flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Logs de Segurança e Mutação
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">{logs.length} eventos registrados</span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {logs.map((log, index) => {
                        const config = getActionConfig(log.action);
                        return (
                            <div
                                key={log.id}
                                className="px-5 py-4 flex items-start gap-4 hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-colors duration-200 group"
                            >
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center pt-1 shrink-0">
                                    <div className={clsx("w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-950", config.dot)}></div>
                                    {index < logs.length - 1 && (
                                        <div className="w-px h-full bg-slate-100 dark:bg-slate-800 mt-1.5 min-h-[30px]"></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <User className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{log.userId}</span>
                                        </div>

                                        <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider", config.bg)}>
                                            {log.action.toUpperCase()}
                                        </span>

                                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded text-[10px] font-semibold">
                                            {log.entity}
                                        </span>
                                    </div>

                                    <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>

                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                                        </span>
                                        <span className="text-[11px] text-slate-600 dark:text-slate-600">•</span>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            Ref: {log.resourceId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
