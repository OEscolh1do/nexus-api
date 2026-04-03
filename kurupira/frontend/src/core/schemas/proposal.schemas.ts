import { z } from "zod";
import { ModuleSpecsSchema, InverterSpecsSchema } from "./equipment.schemas";

export const ChartDataSchema = z.object({
  month: z.string(),
  consumption: z.number(),
  generation: z.number(),
});

export const ServiceItemSchema = z.object({
  description: z.string(),
  quantity: z.union([z.string(), z.number()]),
  unitValue: z.number(),
  total: z.number(),
});

export const FinancialSummarySchema = z.object({
  total_hardware_estimado: z.number(),
  total_servicos_contratados: z.number(),
  investimento_total_referencia: z.number(),
  payback_estimado_anos: z.number(),
  roi_25_anos: z.number(),
});

export const ServiceScheduleSchema = z.object({
  assinatura: z.number(),
  chegada: z.number(),
  troca: z.number(),
  finalizacao: z.number(),
});

export const InstallmentOptionSchema = z.object({
  parcelas: z.number(),
  valorParcela: z.number(),
  valorTotal: z.number(),
  jurosTotal: z.number(),
});

export const ProposalDataSchema = z.object({
  clientName: z.string(),
  city: z.string(),
  state: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  number: z.string(),
  complement: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tariffRate: z.number(),
  installationNumber: z.string(),
  connectionType: z.string(),
  concessionaire: z.string(),
  rateGroup: z.string(),
  voltage: z.string(),
  breakerCurrent: z.number(),
  systemSize: z.number(),
  panelCount: z.number(),
  roofArea: z.number(),
  moduleManufacturer: z.string(),
  panelPower: z.number(),
  orientation: z.string().optional(),
  availableArea: z.number(),
  inverters: z.array(InverterSpecsSchema),
  modules: z.array(ModuleSpecsSchema),
  monthlyGeneration: z.array(z.number()),
  monthlyConsumption: z.array(z.number()),
  annualSavings: z.number(),
  totalInvestment: z.number(),
  kitPrice: z.number(),
  servicePrice: z.number(),
  paybackYears: z.number(),
  co2Savings: z.number(),
  chartData: z.array(ChartDataSchema),
  peakMonthConsumption: z.string(),
  peakMonthGeneration: z.string(),
  currentMonthlyCost: z.number(),
  newMonthlyCost: z.number(),
  engineerName: z.string(),
  creaNumber: z.string(),
  inverterWarranty: z.string(),
  irradiationLocal: z.number(),
  avgMonthlyGeneration: z.number(),
  irradiationSource: z.string().optional(),
  serviceSchedule: ServiceScheduleSchema,
  installments: z.array(InstallmentOptionSchema),
  serviceComposition: z.array(ServiceItemSchema),
  resumo_financeiro: FinancialSummarySchema,
  mapImage: z.string().optional(),
});

export type ProposalData = z.infer<typeof ProposalDataSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type ServiceItem = z.infer<typeof ServiceItemSchema>;
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;
export type ServiceSchedule = z.infer<typeof ServiceScheduleSchema>;
export type InstallmentOption = z.infer<typeof InstallmentOptionSchema>;
