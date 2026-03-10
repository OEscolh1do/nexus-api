const { z } = require("zod");

// Enums (matching Prisma if possible, or string literals)
const ProjectStatus = z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELED"]);

// Combinando status legados e novos para compatibilidade
const TaskStatus = z.enum([
  "BACKLOG",
  "TODO", "DOING", "DONE",
  "EM_ANALISE", "ENCAMINHADO", "BLOQUEADO", "CONCLUIDO"
]);

const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// Helper para Datas (aceita string ISO ou Date object e converte para Date)
const zDate = z.coerce.date().nullable().optional();

// Operational Task Schema
const taskSchema = z.object({
  title: z.string().min(3, "Título da tarefa muito curto"),
  description: z.string().optional(),
  status: TaskStatus.default("BACKLOG"),
  priority: TaskPriority.default("MEDIUM"),
  assignedTo: z.string().cuid().or(z.literal("")).optional().nullable(),

  // Datas com coerção robusta
  startDate: zDate,
  endDate: zDate,
  dueDate: zDate,

  // Dependências (Array de IDs)
  dependencies: z.array(z.string()).optional(),

  // Campos auxiliares (permitir mas validar tipo básico)
  isTemplate: z.boolean().optional(),

  // Checklist (validar estrutura se possível, ou usar array genérico)
  checklist: z.array(z.any()).optional()
}).strict(); // 🛡️ Rejeita campos não mapeados

// Project Schema
const createProjectSchema = z.object({
  title: z.string().min(3, "Título do projeto obrigatório"),
  description: z.string().optional(),
  status: ProjectStatus.default("NOT_STARTED"),
  startDate: zDate,
  endDate: zDate,

  managerId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  strategyId: z.string().cuid().optional(),

  // Permitir passing de type para diferenciar projetos
  type: z.string().optional().default('GENERIC'),

  // Details JSON (Object livre, mas deve ser objeto)
  details: z.record(z.any()).optional()
}).strict();

const updateProjectSchema = createProjectSchema.partial().strict();
const updateTaskSchema = taskSchema.partial().strict();

const getWorkloadSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    projectId: z.string().cuid().optional()
  }).optional().default({})
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  taskSchema,
  updateTaskSchema,
  getWorkloadSchema
};
