const { z } = require("zod");

// Enums matching Prisma
const StrategyType = z.enum(["PILLAR", "INITIATIVE", "ACTION"]);
const KRType = z.enum(["FINANCIAL", "CUSTOMER", "PROCESS", "LEARNING"]);

// Key Result Schema
const keyResultSchema = z.object({
  title: z.string().min(3, "Título do KR muito curto"),
  targetValue: z.coerce.number().positive("Meta deve ser positiva"),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().default("%"),
  perspective: KRType.optional(),
  frequency: z.string().optional()
}).strict();

// Strategy Schema
const createStrategySchema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  code: z.string().min(2, "Código deve ter pelo menos 2 caracteres").optional(),
  description: z.string().optional(),
  colorCode: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Cor inválida").default("#6366f1"),
  type: StrategyType.default("PILLAR"),
  
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  
  parentId: z.string().cuid().optional().nullable(),
  
  // Nested KRs allowed on create
  keyResults: z.array(keyResultSchema).optional()
}).strict(); // 🛡️

const updateStrategySchema = createStrategySchema.partial().strict();

module.exports = {
  createStrategySchema,
  updateStrategySchema,
  keyResultSchema
};
