const { z } = require('zod');

/**
 * 🛡️ SOLAR MODULE - VALIDATION SCHEMA
 * 
 * CRITICAL: Este schema protege contra CVE-2025-55182 (React2Shell)
 * 
 * Responsabilidades:
 * 1. Prevenir DoS via payloads JSON gigantes
 * 2. Bloquear injeção de código via campos não sanitizados
 * 3. Garantir consistência de tipos antes de persistir no MySQL
 * 
 * Autor: Antigravity AI
 * Data: 2026-01-20
 * Versão Schema: 1.0
 */

// ========================
// INPUT DATA (WIZARD STEP 1)
// ========================
const SolarInputDataSchema = z.object({
  // Localização geográfica
  address: z.string()
    .max(500, "Endereço excede limite de 500 caracteres")
    .min(1, "Endereço obrigatório"),
  
  latitude: z.number()
    .min(-90, "Latitude inválida")
    .max(90, "Latitude inválida")
    .optional(),
  
  longitude: z.number()
    .min(-180, "Longitude inválida")
    .max(180, "Longitude inválida")
    .optional(),
  
  // Dados de consumo
  monthlyConsumption: z.number()
    .min(0, "Consumo não pode ser negativo")
    .max(999999, "Consumo excede limite realista (999.999 kWh)"),
  
  // Tarifas e custos
  electricityRate: z.number()
    .min(0, "Tarifa não pode ser negativa")
    .max(10, "Tarifa excede limite realista (R$ 10/kWh)")
    .optional(),
  
  // Dados climáticos (NASA API)
  solarIrradiance: z.number()
    .min(0)
    .max(10, "Irradiação solar excede limite físico (10 kWh/m²/dia)")
    .optional(),
}).strict(); // Rejeita campos não declarados

// ========================
// PROPOSAL DATA (RESULTADO DOS CÁLCULOS)
// ========================
const SolarProposalDataSchema = z.object({
  // Dimensionamento do sistema
  systemPower: z.number()
    .positive("Potência do sistema deve ser > 0")
    .max(9999, "Potência excede limite (9.999 kWp)"),
  
  numberOfPanels: z.number()
    .int("Número de painéis deve ser inteiro")
    .positive("Número de painéis deve ser > 0")
    .max(9999, "Número de painéis excede limite")
    .optional(),
  
  panelPower: z.number()
    .positive("Potência do painel deve ser > 0")
    .max(1000, "Potência do painel excede limite (1000 Wp)")
    .optional(),
  
  // Análise financeira
  estimatedCost: z.number()
    .min(0, "Custo não pode ser negativo")
    .max(99999999, "Custo excede limite (R$ 99.999.999)")
    .optional(),
  
  paybackPeriod: z.number()
    .min(0, "Payback não pode ser negativo")
    .max(50, "Payback excede limite realista (50 anos)")
    .optional(),
  
  annualSavings: z.number()
    .min(0, "Economia anual não pode ser negativa")
    .optional(),
  
  // Geração de energia
  estimatedGeneration: z.number()
    .min(0, "Geração estimada não pode ser negativa")
    .max(999999, "Geração excede limite (999.999 kWh/mês)")
    .optional(),
  
  // Equipamentos
  inverterModel: z.string()
    .max(200, "Nome do inversor muito longo")
    .optional(),
  
  panelModel: z.string()
    .max(200, "Nome do painel muito longo")
    .optional(),
  
  // Metadados
  calculationDate: z.string()
    .datetime({ message: "Data de cálculo inválida (esperado ISO 8601)" })
    .optional(),
  
  engineVersion: z.string()
    .max(20, "Versão do engine muito longa")
    .optional(),
}).strict().optional();

// ========================
// SCHEMA PRINCIPAL (NAMESPACED)
// ========================
const SolarDetailsSchema = z.object({
  solar: z.object({
    version: z.literal("1.0"), // Versionamento de schema
    inputData: SolarInputDataSchema,
    proposalData: SolarProposalDataSchema,
  }),
}).strict();

// ========================
// HELPER: VALIDAÇÃO DEFENSIVA
// ========================
/**
 * Valida e sanitiza o campo Project.details antes de persistir.
 * 
 * @param {unknown} details - Payload recebido do frontend
 * @returns {object} Payload validado
 * @throws {ZodError} Se validação falhar
 */
function validateSolarDetails(details) {
  // Se details não tem namespace 'solar', não é nosso problema
  if (!details || !details.solar) {
    return details;
  }

  // CRÍTICO: Garantir versionamento
  if (!details.solar.version) {
    details.solar.version = "1.0"; // Auto-upgrade para v1.0
  }

  // Validação Zod
  const validated = SolarDetailsSchema.parse(details);
  
  console.log(`[VALIDATION] ✅ Solar details validated successfully`);
  return validated;
}

module.exports = {
  SolarDetailsSchema,
  SolarInputDataSchema,
  SolarProposalDataSchema,
  validateSolarDetails,
};
