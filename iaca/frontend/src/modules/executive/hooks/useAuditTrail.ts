import { useState, useCallback, useEffect } from "react";

export interface AuditLogEntry {
    id: string;
    userId: string;
    action: "create" | "update" | "delete";
    entity: string;
    resourceId: string;
    details: string;
    timestamp: string;
    ipAddress: string;
}

interface UseAuditTrailReturn {
    logs: AuditLogEntry[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

// Mock data — será substituído por chamada à API quando o endpoint estiver pronto
const mockAuditLogs: AuditLogEntry[] = [
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

export function useAuditTrail(): UseAuditTrailReturn {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Substituir por `await api.get('/api/v2/executive/audit-trail')`
            await new Promise(resolve => setTimeout(resolve, 400));
            setLogs(mockAuditLogs);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar audit trail.";
            setError(message);
            console.error("useAuditTrail:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carrega na montagem
    useEffect(() => { loadData(); }, [loadData]);

    return { logs, loading, error, refresh: loadData };
}
