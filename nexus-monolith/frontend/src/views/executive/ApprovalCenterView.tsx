import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/mock-components";
import { CheckCircle2, XCircle, Clock, ShieldAlert } from "lucide-react";
import { CapacityVortex } from "@/modules/ops/ui/CapacityVortex";

export function ApprovalCenterView() {
    const [approvals, setApprovals] = useState([
        {
            id: "ag_1",
            resourceType: "PurchaseOrder",
            resourceId: "PO-2026-092",
            description: "Liberação de compra: Inversores Huawei 75kW (R$ 145.000)",
            requestedBy: "João Silva (Engenharia)",
            deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
            status: "PENDING",
            requiredRole: "DIRECTOR"
        },
        {
            id: "ag_2",
            resourceType: "Invoice",
            resourceId: "NF-9943",
            description: "Pagamento Empreiteira Alpha (Medição #3)",
            requestedBy: "Maria Costa (Obras)",
            deadlineAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Atrasado
            status: "PENDING",
            requiredRole: "C_LEVEL"
        }
    ]);

    const handleResolve = (id: string, decision: 'APPROVED' | 'REJECTED') => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-l-4 border-indigo-600 pl-3">
                        Central de Comando
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Console Diretivo de Aprovações Institucionais e Mitigação de Riscos.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvals.map((approval) => {
                    const isOverdue = new Date(approval.deadlineAt) < new Date();
                    const isResolved = approval.status !== 'PENDING';

                    return (
                        <Card key={approval.id} className={`flex flex-col transition-all duration-300 ${isOverdue && !isResolved ? 'border-red-500 shadow-red-100 shadow-md' : 'border-slate-200'}`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${approval.requiredRole === 'C_LEVEL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {approval.requiredRole}
                                    </span>

                                    {isResolved ? (
                                        <span className={`text-xs font-bold flex items-center gap-1 ${approval.status === 'APPROVED' ? 'text-green-600' : 'text-red-500'}`}>
                                            {approval.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {approval.status === 'APPROVED' ? "APROVADO" : "VETADO"}
                                        </span>
                                    ) : (
                                        <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-amber-600'}`}>
                                            {isOverdue ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            {isOverdue ? "SLA ESTOURADO" : "SLA 12h"}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-base mt-2">{approval.resourceType}</CardTitle>
                                <CardDescription className="text-xs font-mono text-slate-500">Ref: {approval.resourceId}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col justify-between">
                                <div className="mb-4">
                                    <p className="text-sm text-slate-700 line-clamp-2">{approval.description}</p>
                                    <p className="text-xs text-slate-400 mt-2">Req. por: {approval.requestedBy}</p>
                                </div>

                                {!isResolved && (
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleResolve(approval.id, 'REJECTED')}
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            Vetar
                                        </Button>
                                        <Button
                                            onClick={() => handleResolve(approval.id, 'APPROVED')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                        >
                                            Aprovar
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 🔮 Dashboard Preditivo da Fase 3 */}
            <div className="mt-8 pt-6 border-t border-slate-200">
                <CapacityVortex />
            </div>
        </div>
    );
}
