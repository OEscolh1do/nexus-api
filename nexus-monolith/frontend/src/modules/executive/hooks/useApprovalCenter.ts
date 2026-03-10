import { useState, useCallback, useEffect } from "react";

export interface ApprovalItem {
    id: string;
    resourceType: string;
    resourceId: string;
    description: string;
    requestedBy: string;
    deadlineAt: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requiredRole: string;
}

interface UseApprovalCenterReturn {
    approvals: ApprovalItem[];
    loading: boolean;
    error: string | null;
    resolve: (id: string, decision: "APPROVED" | "REJECTED") => void;
    refresh: () => void;
}

// Mock data — será substituído por chamada à API
const mockApprovals: ApprovalItem[] = [
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
        deadlineAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: "PENDING",
        requiredRole: "C_LEVEL"
    }
];

export function useApprovalCenter(): UseApprovalCenterReturn {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Substituir por `await api.get('/api/v2/executive/approvals')`
            await new Promise(resolve => setTimeout(resolve, 400));
            setApprovals(mockApprovals);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar aprovações.";
            setError(message);
            console.error("useApprovalCenter:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carrega na montagem
    useEffect(() => { loadData(); }, [loadData]);

    const resolve = useCallback((id: string, decision: "APPROVED" | "REJECTED") => {
        // TODO: Substituir por `await api.post('/api/v2/executive/approvals/${id}/resolve', { decision })`
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a));
    }, []);

    return { approvals, loading, error, resolve, refresh: loadData };
}
