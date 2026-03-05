import { api } from "../../lib/api";

export interface BiOverview {
  ops: {
    total: number;
    active: number;
    completed: number;
    efficiencyRate: number;
  };
  finance: {
    revenue: number;
    expenses: number;
    netProfit: number;
    avgTicket: number;
  };
  insights: Array<{ type: 'warning' | 'success', message: string }>;
}

export const BiService = {
  getOverview: async (): Promise<BiOverview> => {
    const res = await api.get('/bi/overview');
    return res.data?.data;
  }
};
