import { StateCreator } from 'zustand';
import { FinanceParams, FinanceResults, initialFinanceParams, initialFinanceResults } from './financeSchema';
import { calculateFinancialMetrics } from '../utils/financialCalculations';
import { calculateGeneration } from '@/modules/engineering/utils/generationSimulation';
import { ClientSlice } from '@/core/state/slices/clientSlice';
import { TechSlice } from '@/core/state/slices/techSlice';

export interface FinanceSlice {
  financeParams: FinanceParams;
  financeResults: FinanceResults;
  
  // Actions
  setFinanceParam: <K extends keyof FinanceParams>(key: K, value: FinanceParams[K]) => void;
  updateFinanceParams: (params: Partial<FinanceParams>) => void;
  calculateResults: () => void;
}

export const createFinanceSlice: StateCreator<
  FinanceSlice & ClientSlice & TechSlice,
  [],
  [],
  FinanceSlice
> = (set, get) => ({
  financeParams: initialFinanceParams,
  financeResults: initialFinanceResults,

  setFinanceParam: (key, value) => {
    // Validate individual field if needed, or rely on form validation.
    // Here we update and trigger calculation? Or wait for explicit calculate?
    // Let's update and trigger calculation for reactivity.
    
    set((state) => ({
      financeParams: { ...state.financeParams, [key]: value }
    }));
    get().calculateResults();
  },

  updateFinanceParams: (params) => {
    set((state) => ({
      financeParams: { ...state.financeParams, ...params }
    }));
    get().calculateResults();
  },

  calculateResults: () => {
    const { financeParams, clientData, modules, settings } = get();
    
    // 1. Calculate Generation (Source of Revenue)
    const { annualGeneration } = calculateGeneration(modules, clientData, settings);

    // 2. Calculate Financial Metrics
    const results = calculateFinancialMetrics(financeParams, annualGeneration);
    
    set({ financeResults: results });
  }
});
