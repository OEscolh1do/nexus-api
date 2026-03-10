const { z } = require("zod");

// ==========================================
// LEAD SCHEMAS
// ==========================================

const LeadStatusEnum = z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"]);
const LeadSourceEnum = z.enum(["WEB", "REFERRAL", "COLD_CALL", "PARTNER", "OTHER"]);

const CreateLeadSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone inválido"),
  source: LeadSourceEnum.default("WEB"),
  notes: z.string().optional(),

  // Endereço e Perfil
  city: z.string().optional(),
  state: z.string().length(2).optional(),

  // Campos de Negócio/Origem
  academyOrigin: z.string().optional(),
  technicalProfile: z.string().optional(),

  // Campos flexíveis
  status: LeadStatusEnum.default("NEW"),
}).strict(); // 🛡️

// Para update, permitimos parcial mas mantendo strict nos campos conhecidos
const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  assignedTo: z.string().optional(),
  missionId: z.string().optional().nullable()
}).strict();

// ==========================================
// MISSION SCHEMAS
// ==========================================
const CreateMissionSchema = z.object({
  title: z.string().min(3),
  region: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED']).default('PLANNED'),
  budget: z.number().optional()
}).strict();

// ==========================================
// QUOTE SCHEMAS (SOLAR)
// ==========================================

const QuoteStatusEnum = z.enum(["DRAFT", "SENT", "NEGOTIATION", "APPROVED", "REJECTED", "ARCHIVED"]);

// Schema detalhado para dados solares
const SolarDataSchema = z.object({
  version: z.string().default("1.0"),

  // Dados de Entrada (InputForm)
  inputData: z.object({
    clientName: z.string().optional(),
    monthlyConsumption: z.number().min(0).optional(),
    availableArea: z.number().min(0).optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).passthrough().optional(),

  // Dados Técnicos (Gerador)
  proposalData: z.object({
    systemSizeKw: z.number().positive().optional(),
    panelCount: z.number().int().positive().optional(),
    inverterCount: z.number().int().positive().default(1),
    estimatedGeneration: z.number().positive().optional(), // kWh/mês
    panelModel: z.string().optional(),
    inverterModel: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

const CreateQuoteSchema = z.object({
  leadId: z.string().uuid("Lead ID inválido"),
  solarData: SolarDataSchema.optional(),
  totalCost: z.number().positive("Custo total deve ser positivo").optional(),
  proposedPrice: z.number().positive("Preço proposto deve ser positivo").optional(),
  margin: z.number().optional(),
  validUntil: z.string().datetime().optional(), // ISO Date
}).passthrough(); // Passthrough temporarily for solar wizard flexibility

const UpdateQuoteSchema = CreateQuoteSchema.partial().extend({
  status: QuoteStatusEnum.optional(),
});

// ==========================================
// OPPORTUNITY (DEAL) SCHEMAS
// ==========================================
const OpportunityStatusEnum = z.enum([
  "LEAD_QUALIFICATION",
  "VISIT_SCHEDULED",
  "TECHNICAL_VISIT_DONE",
  "PROPOSAL_GENERATED",
  "NEGOTIATION",
  "CONTRACT_SENT",
  "CLOSED_WON",
  "CLOSED_LOST"
]);

const CreateOpportunitySchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  leadId: z.string().uuid("Lead ID inválido"),
  missionId: z.string().uuid().optional().nullable(),
  estimatedValue: z.number().nonnegative().default(0),
  probability: z.number().min(0).max(100).default(10),
  status: OpportunityStatusEnum.default("LEAD_QUALIFICATION")
}).strict();

const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

module.exports = {
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateMissionSchema,
  CreateQuoteSchema,
  UpdateQuoteSchema,
  LeadStatusEnum,
  QuoteStatusEnum,
  CreateOpportunitySchema,
  UpdateOpportunitySchema,
  OpportunityStatusEnum
};
