const { z } = require('zod');

// ============================================
// Quote Validation Schema (formerly solar.zod.js)
// ============================================

// Schema de validação para dados solares do Quote
const solarDataSchema = z.object({
  version: z.string().default("1.0"),
  
  // Dados de entrada (Fase 1 - InputForm)
  inputData: z.object({
    clientName: z.string().min(1, "Nome do cliente obrigatório").max(200),
    address: z.string().max(500).optional(),
    street: z.string().max(200).optional(),
    neighborhood: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().length(2).optional(),
    number: z.string().max(20).optional(),
    complement: z.string().max(100).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    monthlyConsumption: z.number().min(0).max(100000),
    availableArea: z.number().min(0).max(10000).default(0),
    orientation: z.enum(["Norte", "Sul", "Leste", "Oeste"]).optional(),
    mapImage: z.string().optional(), // Base64 da imagem do mapa
  }),
  
  // Dados técnicos (Fases 2-5)
  proposalData: z.object({
    systemPower: z.number().min(0).max(1000).optional(),
    numberOfPanels: z.number().int().min(0).max(1000).optional(),
    estimatedCost: z.number().min(0).optional(),
    panelModel: z.string().max(200).optional(),
    inverterModel: z.string().max(200).optional(),
    monthlyGeneration: z.number().min(0).optional(),
    annualGeneration: z.number().min(0).optional(),
    paybackPeriod: z.number().min(0).optional(),
    // ...outros campos técnicos conforme necessário
  }).optional(),
  
  // Dados da NASA API
  weatherData: z.object({
    irradiation: z.number().optional(),
    temperature: z.number().optional(),
    // ...outros dados meteorológicos
  }).optional(),
  
}).strict(); // Não aceita campos extras

// Schema para metadados comerciais do Quote
const quoteMetadataSchema = z.object({
  totalCost: z.number().min(0).optional(),
  proposedPrice: z.number().min(0).optional(),
  margin: z.number().min(0).max(100).optional(), // Margem percentual
  validUntil: z.string().datetime().optional(),
});

// Schema para criação de Quote
const createQuoteSchema = z.object({
  leadId: z.string().cuid(),
  version: z.number().int().min(1).default(1),
  solarData: z.string().optional(), // JSON string validado separadamente
  totalCost: z.number().min(0).optional(),
  proposedPrice: z.number().min(0).optional(),
  margin: z.number().min(0).max(100).optional(),
});

// Schema para atualização de Quote
const updateQuoteSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "ARCHIVED"]).optional(),
  solarData: z.string().optional(),
  totalCost: z.number().min(0).optional(),
  proposedPrice: z.number().min(0).optional(),
  margin: z.number().min(0).max(100).optional(),
  validUntil: z.string().datetime().optional(),
}).partial();

// Schema para arquivamento
const archiveQuoteSchema = z.object({
  archivedReason: z.string().min(1, "Motivo obrigatório").max(500),
});

/**
 * Valida e parseia dados solares do Quote
 */
function validateSolarData(solarDataJson) {
  try {
    const parsed = typeof solarDataJson === 'string' 
      ? JSON.parse(solarDataJson) 
      : solarDataJson;
    
    const validated = solarDataSchema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, error: [{ message: error.message }] };
  }
}

module.exports = {
  solarDataSchema,
  quoteMetadataSchema,
  createQuoteSchema,
  updateQuoteSchema,
  archiveQuoteSchema,
  validateSolarData,
};
