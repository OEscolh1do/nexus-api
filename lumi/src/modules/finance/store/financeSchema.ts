import { z } from 'zod';

// --- Zod Schemas ---

export const FinanceParamsSchema = z.object({
  capex: z.number().min(0, "O investimento (CAPEX) deve ser positivo."),
  omCost: z.number().min(0, "O custo de O&M deve ser positivo."),
  inflationRate: z.number().min(0).max(100, "A inflação deve estar entre 0 e 100%."),
  discountRate: z.number().min(0).max(100, "A taxa de desconto deve estar entre 0 e 100%."),
  energyTariff: z.number().positive("A tarifa de energia deve ser positiva."),
  tariffInflation: z.number().min(0).max(100).optional(), // Legacy, will use short/long term
  annualDegradation: z.number().min(0).max(5, "A degradação anual deve ser razoável (0-5%)."),
  
  // Neonorte Methodology
  inflationRateShortTerm: z.number().min(0).max(100), // Years 1-5
  inflationRateLongTerm: z.number().min(0).max(100), // Years 6+
  fioB_Tariff: z.number().min(0), // TUSD Fio B for GD II

  // Financing (New)
  financingMode: z.enum(['cash', 'financed']).default('cash'),
  downPayment: z.number().min(0).optional(),
  loanInterestRate: z.number().min(0).max(100).optional(), // Monthly %
  loanTerm: z.number().int().min(1).max(240).optional(), // Months
  gracePeriod: z.number().int().min(0).max(24).optional(), // Months
});

export const FinanceResultsSchema = z.object({
  npv: z.number(),
  irr: z.number(),
  payback: z.number(), // Years
  discountedPayback: z.number(), // Years
  lcoe: z.number(),
  roi: z.number(), // Return on Investment %
  totalSavings: z.number(),
  cashFlows: z.array(z.number()),
  cumulativeCashFlows: z.array(z.number()),
  
  // Financing Analysis
  monthlyInstallment: z.number().optional(),
  totalLoanInterest: z.number().optional(),
  monthlySavings: z.number(), // Year 1 Average
});

// --- TypeScript Types ---

export type FinanceParams = z.infer<typeof FinanceParamsSchema>;
export type FinanceResults = z.infer<typeof FinanceResultsSchema>;

export const initialFinanceParams: FinanceParams = {
  capex: 0,
  omCost: 0, // Suggestion: 0.5% - 1% of CAPEX usually
  inflationRate: 4.5, // IPCA benchmark
  discountRate: 10, // TMA benchmark
  energyTariff: 0.92, // Average tariff
  tariffInflation: 6.0, // Legacy
  annualDegradation: 0.5,
  
  // Neonorte Defaults
  inflationRateShortTerm: 10.0,
  inflationRateLongTerm: 14.0,
  fioB_Tariff: 0.38956,

  // Financing Defaults
  financingMode: 'cash',
  downPayment: 0,
  loanInterestRate: 1.49, // Common market rate
  loanTerm: 60,
  gracePeriod: 3
};

export const initialFinanceResults: FinanceResults = {
  npv: 0,
  irr: 0,
  payback: 0,
  discountedPayback: 0,
  lcoe: 0,
  roi: 0,
  totalSavings: 0,
  cashFlows: [],
  cumulativeCashFlows: [],
  monthlyInstallment: 0,
  totalLoanInterest: 0,
  monthlySavings: 0
};
