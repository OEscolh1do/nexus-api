const { z } = require("zod");

// Enums para validação estrita
const PanelBrandSchema = z.enum(["trina", "jinko", "canadian", "longi"]);
const InverterBrandSchema = z.enum(["sungrow", "growatt", "fronius", "huawei"]);
const StructureTypeSchema = z.enum(["ceramica", "fibrocimento", "metalica", "solo", "laje"]);

// Schema principal da Proposta (armazenado em Project.details.solar)
const SolarProposalSchema = z.object({
  systemSize: z.number()
    .min(0.5, "Sistema muito pequeno (mínimo 0.5 kWp)")
    .max(500, "Sistema muito grande para aprovação automática (máximo 500 kWp)"),
  
  monthlyAvgConsumption: z.number().positive("Consumo deve ser positivo"),
  
  tariffRate: z.number().positive("Tarifa deve ser positiva").default(0.92),
  
  location: z.object({
    city: z.string().min(3),
    state: z.string().length(2),
    irradiation: z.number().positive().default(4.5) // HSP Médio
  }),

  hardware: z.object({
    panelBrand: PanelBrandSchema,
    panelPower: z.number().int().min(400).max(800),
    panelCount: z.number().int().positive(),
    inverterBrand: InverterBrandSchema,
    structureType: StructureTypeSchema
  }),

  financials: z.object({
    totalInvestment: z.number().positive(),
    paybackYears: z.number().positive(),
    monthlySavings: z.number().positive()
  }).optional() // Pode ser calculado pelo backend se omitido
});

module.exports = {
  SolarProposalSchema
};
