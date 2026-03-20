import { useEffect, useState, useCallback } from "react";
import { executiveApi, ExecutiveMetrics, PortfolioHealth } from "@/lib/api/executive";

interface UseExecutiveDashboardReturn {
    metrics: ExecutiveMetrics | null;
    health: PortfolioHealth | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useExecutiveDashboard(): UseExecutiveDashboardReturn {
    const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
    const [health, setHealth] = useState<PortfolioHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [metricsData, healthData] = await Promise.all([
                executiveApi.getMetrics(),
                executiveApi.getPortfolioHealth()
            ]);
            setMetrics(metricsData);
            setHealth(healthData);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar dados executivos.";
            setError(message);
            console.error("useExecutiveDashboard:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return { metrics, health, loading, error, refresh: loadData };
}
