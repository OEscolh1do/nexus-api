import { z } from 'zod';

export const DealSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  leadId: z.string().cuid(),
  missionId: z.string().cuid().optional().nullable(),
  status: z.enum([
    'LEAD_QUALIFICATION',
    'VISIT_SCHEDULED',
    'TECHNICAL_VISIT_DONE',
    'PROPOSAL_GENERATED',
    'NEGOTIATION',
    'CONTRACT_SENT',
    'CLOSED_WON',
    'CLOSED_LOST'
  ]),
  estimatedValue: z.number().positive("Valor estimado deve ser positivo"),
  probability: z.number().min(0).max(100),
  tenantId: z.string({ required_error: "TenantID é obrigatório" }),
  technicalProposal: z.object({
    kitData: z.record(z.any()), // Refinar conforme estrutura do Kit
    consumptionAvg: z.number().positive(),
    infrastructurePhotos: z.array(z.string().url()).min(1, "É necessário pelo menos uma foto da infraestrutura"),
    paybackData: z.record(z.any()),
    validatedByEng: z.boolean()
  }).optional()
});

export const UpdateDealStatusSchema = z.object({
  status: z.enum([
    'LEAD_QUALIFICATION',
    'VISIT_SCHEDULED',
    'TECHNICAL_VISIT_DONE',
    'PROPOSAL_GENERATED',
    'NEGOTIATION',
    'CONTRACT_SENT',
    'CLOSED_WON',
    'CLOSED_LOST'
  ]),
  technicalProposal: z.object({
    infrastructurePhotos: z.array(z.string().url()).optional(),
    validatedByEng: z.boolean().optional()
  }).optional()
}).superRefine((data, ctx) => {
  if (data.status === 'CLOSED_WON') {
    if (!data.technicalProposal?.validatedByEng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Não é possível fechar o negócio sem validação da engenharia (validatedByEng: true).",
        path: ['technicalProposal', 'validatedByEng']
      });
    }
    if (!data.technicalProposal?.infrastructurePhotos || data.technicalProposal.infrastructurePhotos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Não é possível fechar o negócio sem fotos da infraestrutura.",
        path: ['technicalProposal', 'infrastructurePhotos']
      });
    }
  }
});
