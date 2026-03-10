// import { api } from "../api"; // Not used in mocked version

export interface ProjectHealthItem {
    id: string;
    name: string;
    manager: string;
    status: "ON_TRACK" | "AT_RISK" | "DELAYED";
    progress: number;
    budgetConsumed: number;
    totalBudget: number;
    expectedDate: string;
    criticalRisks: number;
}

// Em um cenário real, este payload viria de um novo endpoint em executive.controller.
// Vamos isolar para facilitar o Milestone 3 sem quebrar o Milestone 1.
export const portfolioApi = {
    getPortfolioProjects: async (): Promise<ProjectHealthItem[]> => {
        // Scaffold: Reusing same backend structure to return mocked array 
        // Usually this would be: `await api.get('/api/v2/executive/portfolio-projects')`

        // For demonstration of the gap-closing front-end milestone 3
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: '1',
                        name: 'Implantação Usina Alpha',
                        manager: 'Carlos Silva',
                        status: 'ON_TRACK',
                        progress: 85,
                        budgetConsumed: 1200000,
                        totalBudget: 1500000,
                        expectedDate: '2026-06-15T00:00:00Z',
                        criticalRisks: 0
                    },
                    {
                        id: '2',
                        name: 'Expansão Data Center SP',
                        manager: 'Ana Lopes',
                        status: 'AT_RISK',
                        progress: 45,
                        budgetConsumed: 800000,
                        totalBudget: 1000000,
                        expectedDate: '2026-04-10T00:00:00Z',
                        criticalRisks: 2
                    },
                    {
                        id: '3',
                        name: 'Atualização ERP Nexus',
                        manager: 'Ricardo Mendes',
                        status: 'DELAYED',
                        progress: 20,
                        budgetConsumed: 300000,
                        totalBudget: 250000, // Over budget
                        expectedDate: '2026-03-01T00:00:00Z',
                        criticalRisks: 4
                    }
                ]);
            }, 800);
        });
    }
};
