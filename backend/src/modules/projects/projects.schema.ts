import { z } from 'zod';

// --- SHARED SCHEMAS ---
const ConsumerUnitSchema = z.object({
  code: z.string().min(1, 'Número da UC é obrigatório'),
  isGenerator: z.boolean().default(false),
  averageAvg: z.number().min(0).default(0),
  titular: z.string().optional(),
  group: z.string().optional(),
  meterNumber: z.string().optional(),
  availabilityFee: z.number().min(0).default(0),
  voltage: z.string().optional(),
  concessionaire: z.string().optional(),
});

// --- LEAD / PROJECT CREATION ---
export const CreateLeadSchema = z.object({
  body: z.object({
    // Client Info (Existing OR New)
    clientId: z.string().cuid().optional(),
    name: z.string().min(3, 'Nome do cliente é obrigatório se for novo').optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    description: z.string().optional(),
  }).refine(data => data.clientId || data.name, {
    message: "É necessário fornecer um ID de cliente existente ou um Nome para novo cliente.",
    path: ["name"]
  }),
});

// --- PROJECT UPDATE ---
export const UpdateProjectSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: z.enum([
      'LEAD', 'VISIT', 'PROPOSAL', 'NEGOTIATION', 'CONTACT', 'BUDGET', 'WAITING', 'APPROVED', 'REJECTED', 
      'READY', 'EXECUTION', 'REVIEW', 'DONE', 'CLOSED'
    ]).optional(),
    pipeline: z.string().optional(),
    monthlyUsage: z.number().optional(),
    roofArea: z.number().optional(),
    location: z.string().optional(),
    roofType: z.string().optional(),
    orientation: z.string().optional(),
    rank: z.number().optional(),
    price: z.number().optional(),
    energyTariff: z.number().optional(),
    consumptionHistory: z.any().optional(), // JSON
  }),
});

// --- SUB-RESOURCES ---
export const AddActivitySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    note: z.string().min(1, 'Nota não pode ser vazia'),
  }),
});

export const AddUnitSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: ConsumerUnitSchema,
});
