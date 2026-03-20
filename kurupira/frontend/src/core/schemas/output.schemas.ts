import { z } from "zod";
import { ModuleSpecsSchema, InverterSpecsSchema } from "./equipment.schemas";

export const SolarOutputSchema = z.object({
  systemSizeKwp: z.number().positive().finite(),
  moduleCount: z.number().int().positive(),
  moduleBrand: z.string(),
  moduleModel: z.string(),
  inverterBrand: z.string(),
  inverterModel: z.string(),
  modules: z.array(ModuleSpecsSchema),
  inverters: z.array(InverterSpecsSchema),

  // Financeiro - Validação crítica
  totalInvestment: z.number().positive().finite(),
  paybackYears: z.number().positive().max(30).finite(),
  monthlySavings: z.number().positive().finite(),
  roi: z.number().finite(),

  // Geração
  monthlyGeneration: z.array(z.number().nonnegative()).length(12),
  annualGeneration: z.number().positive().finite(),
  avgMonthlyGeneration: z.number(),

  // Detalhes Financeiros e Ambientais
  co2Savings: z.number(),
  currentMonthlyCost: z.number(),
  newMonthlyCost: z.number(),
  installments: z.array(z.any()), // Definir schema melhor se possível
  serviceComposition: z.array(z.any()), // Definir schema melhor se possível
  
  // Dados para Gráficos e UI
  chartData: z.array(z.object({
      month: z.string(),
      consumption: z.number(),
      generation: z.number()
  })),
  peakMonthConsumption: z.string(),
  peakMonthGeneration: z.string(),
  irradiationLocal: z.number(),
  serviceSchedule: z.object({
      assinatura: z.number(),
      chegada: z.number(),
      troca: z.number(),
      finalizacao: z.number()
  }),

  calculatedAt: z.date(),
});

export type SolarOutput = z.infer<typeof SolarOutputSchema>;
