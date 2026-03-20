import { useEffect, useState, useCallback } from "react";
import { portfolioApi, ProjectHealthItem } from "@/lib/api/portfolio";

interface UsePortfolioReturn {
    projects: ProjectHealthItem[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function usePortfolio(): UsePortfolioReturn {
    const [projects, setProjects] = useState<ProjectHealthItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await portfolioApi.getPortfolioProjects();
            setProjects(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao carregar carteira de projetos.";
            setError(message);
            console.error("usePortfolio:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return { projects, loading, error, refresh: loadData };
}
