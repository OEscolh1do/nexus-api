import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const sanitizeString = (str: string) =>
  DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });

export const EngineeringSettingsSchema = z.object({
  performanceRatio: z.number().min(0.5).max(0.95),
  
  // ============================================================
  // NOVOS CAMPOS: Premissas para cálculo de Voc por Temperatura
  // ============================================================
  /**
   * Temperatura mínima histórica da região (°C)
   * Usado para calcular Voc máximo em condições de frio extremo
   * Fórmula: Voc(Tmin) = Voc_STC * (1 + tempCoef * (Tmin - 25))
   * 
   * // CRÍTICO: Manhãs de inverno podem queimar inversores se Voc > Vmax_inv!
   */
  minHistoricalTemp: z.number()
    .min(-40, "Temperatura mínima muito baixa")
    .max(50, "Temperatura mínima muito alta")
    .default(-5)
    .describe("Temperatura mínima histórica (°C)"),

  /**
   * Coeficiente de temperatura para Voc (%/°C)
   * Valor típico: -0.30% a -0.35% para módulos de silício cristalino
   * 
   * // ATENÇÃO: Este valor DEVE vir do datasheet do módulo!
   * //          Usar o valor errado compromete a segurança do dimensionamento.
   */
  vocTempCoefficient: z.number()
    .min(-0.5, "Coeficiente muito negativo")
    .max(0, "Coeficiente deve ser negativo ou zero")
    .default(-0.30)
    .describe("Coeficiente de temperatura Voc (%/°C)"),

  // ============================================================
  // CAMPOS EXISTENTES (Restaurados)
  // ============================================================
  orientationFactors: z.object({
    norte: z.number().min(0.8).max(1.2),
    leste: z.number().min(0.8).max(1.2),
    oeste: z.number().min(0.8).max(1.2),
    sul: z.number().min(0.8).max(1.2),
  }),
  referenceKitPricePerKwp: z.number().positive().max(10000),
  monthlyInterestRate: z.number().min(0).max(0.05),
  marginPercentage: z.number().min(0).max(0.5),
  commissionPercentage: z.number().min(0).max(0.1),
  taxPercentage: z.number().min(0).max(0.2),
  engineerName: z.string().min(1).transform(sanitizeString),
  creaNumber: z.string().min(1),
  companyCnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
  co2Factor: z.number().positive(),
  serviceUnitModule: z.number().nonnegative(),
  serviceUnitStructure: z.number().nonnegative(),
  serviceUnitInverter: z.number().nonnegative(),
  serviceProjectBase: z.number().nonnegative(),
  serviceProjectPercent: z.number().nonnegative(),
  serviceAdminBase: z.number().nonnegative(),
  serviceAdminPercent: z.number().nonnegative(),

  serviceMaterialsPercent: z.number().min(0).max(1),

  // ============================================================
  // CUSTOS ADICIONAIS DE OBRA (INFRAESTRUTURA)
  // ============================================================
  infrastructureUpgradeCost: z.number().nonnegative().default(0), // Ex: Troca de Padrão, Aterramento
  extraMaterialsCost: z.number().nonnegative().default(0), // Ex: Eletrodutos extras, cabos especiais

  // CUSTOS DE HARDWARE (Component-Based Pricing)
  structurePricePerModule: z.number().nonnegative().default(120), // R$ 120/módulo (default)
  bosPricePerKwp: z.number().nonnegative().default(400), // R$ 400/kWp (default)
  


  // ============================================================
  // PRECIFICAÇÃO (Pricing Models)
  // ============================================================
  pricingModel: z.enum(['margin', 'cost_plus', 'fixed_kit']).default('margin'),
  serviceMarkup: z.number().min(0).max(2.0).default(0.23), // 23% markup sobre custo
  serviceCommissionFixed: z.number().nonnegative().default(500), // R$ 500 comissão fixa
  kitPriceFixed: z.number().nonnegative().optional(), // Preço fixo do kit (Orçamento Fornecedor)
  
  energyInflationRate: z.number().min(0).max(0.2),
  structureType: z.enum(['Telhado', 'Solo', 'Carport']).optional(),

  // ============================================================
  // Fatores de Perda (Detailed Loss Profile)
  // ============================================================
  orientationLoss: z.number().min(0).max(1).default(0.03), // Orientação (3%)
  inclinationLoss: z.number().min(0).max(1).default(0.04), // Inclinação (4%)
  shadingLoss: z.number().min(0).max(1).default(0.03), // Sombreamento (3%)
  horizonLoss: z.number().min(0).max(1).default(0.02), // Horizonte (2%)
  soilingLoss: z.number().min(0).max(1).default(0.05), // Sujeira (5%) - OVERRIDE previous
  mismatchLoss: z.number().min(0).max(1).default(0.015), // Mismatch (1.5%) - OVERRIDE previous
  cableDCLoss: z.number().min(0).max(1).default(0.005), // Cabos CC (0.5%)
  cableACLoss: z.number().min(0).max(1).default(0.01), // Cabos CA (1.0%)
  thermalLoss: z.number().min(0).max(1).default(0.044), // Temperatura (4.4%)
  inverterEfficiency: z.number().min(0).max(1).default(1.0), // Inversor (Efficiency Base)

  // Legacy / Aggregates
  cableLoss: z.number().optional(), 
    
  // Configurações de Dimensionamento
  targetOversizing: z.number().min(1).max(2).default(1.2), // 20% over
  minPerformanceRatio: z.number().min(0.5).max(1).default(0.75),
});

export type EngineeringSettings = z.infer<typeof EngineeringSettingsSchema>;
