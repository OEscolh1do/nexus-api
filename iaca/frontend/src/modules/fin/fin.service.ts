import { api } from "../../lib/api";

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  category: string;
  description: string;
  date: string;
  userId: string;
}

export interface BalanceSummary {
  total: number;
  income: number;
  expenses: number;
  count: number;
}

export const FinService = {
  getLedger: async (filters?: { startDate?: string; endDate?: string }): Promise<Transaction[]> => {
    const res = await api.get('/fin/ledger', { params: filters });
    return res.data?.data || [];
  },

  getBalance: async (): Promise<BalanceSummary> => {
    const res = await api.get('/fin/balance');
    return res.data?.data || { total: 0, income: 0, expenses: 0, count: 0 };
  },

  addTransaction: async (data: Partial<Transaction>) => {
    const res = await api.post('/fin/transactions', data);
    return res.data?.data;
  }
};
