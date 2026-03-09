import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/mock-components";
import { ShieldAlert, Database, User } from "lucide-react";

// Mock data until API is wired up for Phase 1
const mockAuditLogs = [
    {
        id: "log_1",
        userId: "usr_ceo",
        action: "update",
        entity: "Project",
        resourceId: "prj_solar_north",
        details: "Limite orçamentário aumentado",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.10",
    },
    {
        id: "log_2",
        userId: "usr_finance",
        action: "create",
        entity: "Transaction",
        resourceId: "txn_89234",
        details: "Liberação de Capex aprovada",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: "10.0.0.5",
    }
];

export function AuditTrailView() {
    const [logs] = useState(mockAuditLogs);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Trail (Rastreio de Eventos)</h2>
                    <p className="text-muted-foreground">
                        Registro imutável de transações e mudanças de estado crítico (Enterprise Compliance).
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    Exportar Relatório
                </Button>
            </div>

            <div className="border rounded-md bg-white">
                <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        Logs de Segurança e Mutação
                    </h3>
                    <span className="text-sm text-slate-500">
                        Fase 1 Foundation: Módulo ativo
                    </span>
                </div>

                <div className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Data/Hora</th>
                                <th className="px-6 py-3">Usuário / Ator</th>
                                <th className="px-6 py-3">Entidade</th>
                                <th className="px-6 py-3">Ação</th>
                                <th className="px-6 py-3">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                <User className="w-3 h-3 text-slate-600" />
                                            </div>
                                            <span className="font-medium text-slate-700">{log.userId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold">
                                            {log.entity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${log.action === 'delete' ? 'bg-red-100 text-red-700' :
                                            log.action === 'create' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.action.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {log.details}
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            Ref: {log.resourceId}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
