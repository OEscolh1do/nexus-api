import { api } from "../api";

export interface ExecutiveMetrics {
    conversionRate: number;
    averageTicket: number;
    activeProjects: number;
    onTimeDeliveryRate: number;
    teamUtilization: number;
    qualityIndex: number;
    strategyAlignment: number;
}

export interface PortfolioHealth {
    statusOverview: {
        onTrack: number;
        atRisk: number;
        delayed: number;
    };
    criticalRisks: number;
    totalBudgetVariance: number;
    totalScheduleVariance: number;
}

export const executiveApi = {
    getMetrics: async (): Promise<ExecutiveMetrics> => {
        const { data } = await api.get('/executive/metrics');
        return data.data;
    },

    getPortfolioHealth: async (): Promise<PortfolioHealth> => {
        const { data } = await api.get('/executive/portfolio-health');
        return data.data;
    },
};
