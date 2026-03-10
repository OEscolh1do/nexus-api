import { useApprovalCenter } from "@/modules/executive/hooks/useApprovalCenter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/mock-components";
import { CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { CapacityVortex } from "@/modules/ops/ui/CapacityVortex";
import clsx from "clsx";

export function ApprovalCenterView() {
    const { approvals, loading, error, resolve, refresh } = useApprovalCenter();

    // --- Loading State ---
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-[220px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse"></div>
                    ))}
                </div>
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
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Falha ao carregar aprovações</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">{error}</p>
                </div>
                <Button variant="outline" onClick={refresh} className="gap-2 rounded-lg">
                    <RefreshCw className="w-4 h-4" /> Tentar novamente
                </Button>
            </div>
        );
    }

    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

    // --- Success State ---
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Central de Comando</h2>
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                                <Inbox className="w-3 h-3 text-amber-600" />
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 text-[14px]">
                        Console Diretivo de Aprovações Institucionais e Mitigação de Riscos.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvals.map((approval) => {
                    const isOverdue = new Date(approval.deadlineAt) < new Date();
                    const isResolved = approval.status !== 'PENDING';

                    return (
                        <Card
                            key={approval.id}
                            className={clsx(
                                "flex flex-col transition-all duration-300 overflow-hidden",
                                isOverdue && !isResolved
                                    ? 'border-rose-300 shadow-lg shadow-rose-100/50 dark:border-rose-500/50 dark:shadow-rose-900/20'
                                    : isResolved
                                        ? 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
                                        : 'border-slate-200/60 dark:border-slate-800/60 hover:shadow-md hover:border-purple-200/60 dark:hover:border-purple-500/30'
                            )}
                        >
                            {/* Colored top accent */}
                            <div className={clsx(
                                "h-1",
                                isOverdue && !isResolved ? "bg-gradient-to-r from-rose-500 to-rose-400"
                                    : approval.requiredRole === 'C_LEVEL' ? "bg-gradient-to-r from-purple-500 to-purple-400"
                                        : "bg-gradient-to-r from-blue-500 to-blue-400"
                            )}></div>

                            <CardHeader className="pb-3 pt-4">
                                <div className="flex justify-between items-start">
                                    <span className={clsx(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider",
                                        approval.requiredRole === 'C_LEVEL' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/30' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30'
                                    )}>
                                        {approval.requiredRole}
                                    </span>

                                    {isResolved ? (
                                        <span className={clsx("text-[11px] font-bold flex items-center gap-1", approval.status === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400')}>
                                            {approval.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            {approval.status === 'APPROVED' ? "APROVADO" : "VETADO"}
                                        </span>
                                    ) : (
                                        <span className={clsx(
                                            "text-[11px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full",
                                            isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                        )}>
                                            {isOverdue ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                    SLA ESTOURADO
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-3 h-3" />
                                                    SLA 12h
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-[15px] mt-2 font-semibold dark:text-slate-200">{approval.resourceType}</CardTitle>
                                <CardDescription className="text-[11px] font-mono text-slate-400">Ref: {approval.resourceId}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col justify-between pt-0">
                                <div className="mb-4">
                                    <p className="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{approval.description}</p>
                                    <p className="text-[11px] text-slate-400 mt-2">Req. por: {approval.requestedBy}</p>
                                </div>

                                {!isResolved && (
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <Button
                                            variant="outline"
                                            onClick={() => resolve(approval.id, 'REJECTED')}
                                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 rounded-lg text-[12px] h-9"
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Vetar
                                        </Button>
                                        <Button
                                            onClick={() => resolve(approval.id, 'APPROVED')}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm rounded-lg text-[12px] h-9"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Aprovar
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 🔮 Dashboard Preditivo da Fase 3 */}
            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                <CapacityVortex />
            </div>
        </div>
    );
}
