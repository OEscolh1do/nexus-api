import { useState, useCallback, useEffect } from "react";

export interface RevenueByTypeItem {
    name: string;
    revenue: number;
    margin: number;
}

export interface RiskDistributionItem {
    name: string;
    value: number;
}

interface UseBIReturn {
    revenueByType: RevenueByTypeItem[];
    riskDistribution: RiskDistributionItem[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

// Mock data — será substituído pelo Data Warehouse (Phase 4)
const mockRevenueByType: RevenueByTypeItem[] = [
    { name: 'Obras Infra', revenue: 4500000, margin: 1200000 },
    { name: 'Energia Solar', revenue: 2800000, margin: 950000 },
    { name: 'Manutenção', revenue: 1200000, margin: 600000 },
    { name: 'Consultoria', revenue: 600000, margin: 450000 },
];

const mockRiskDistribution: RiskDistributionItem[] = [
    { name: 'Operacionais', value: 45 },
    { name: 'Financeiros', value: 25 },
    { name: 'Estratégicos', value: 20 },
    { name: 'Regulatórios', value: 10 },
];

export function useBI(): UseBIReturn {
    const [revenueByType, setRevenueByType] = useState<RevenueByTypeItem[]>([]);
    const [riskDistribution, setRiskDistribution] = useState<RiskDistributionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Substituir por chamada ao Data Warehouse (Phase 4)
            await new Promise(resolve => setTimeout(resolve, 400));
            setRevenueByType(mockRevenueByType);
            setRiskDistribution(mockRiskDistribution);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar dados de BI.";
            setError(message);
            console.error("useBI:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carrega na montagem
    useEffect(() => { loadData(); }, [loadData]);

    return { revenueByType, riskDistribution, loading, error, refresh: loadData };
}
