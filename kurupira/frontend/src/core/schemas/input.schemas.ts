import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const sanitizeString = (str: string) =>
  DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });

export const InvoiceDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1).transform(sanitizeString),
  installationNumber: z.string(),
  concessionaire: z.string(),
  rateGroup: z.string(),
  connectionType: z.enum(["monofasico", "bifasico", "trifasico"]),
  voltage: z.string(),
  breakerCurrent: z.number().positive(),
  monthlyHistory: z.array(z.number()).length(12),
  monthlyHistoryPeak: z.array(z.number()).length(12).optional(),
  monthlyHistoryOffPeak: z.array(z.number()).length(12).optional(),
});

export const InputDataSchema = z.object({
  projectName: z.string().optional(),
  clientName: z
    .string()
    .min(1, "Nome do cliente obrigatório")
    .transform(sanitizeString),
  city: z.string().min(1),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  street: z.string().transform(sanitizeString),
  neighborhood: z.string().transform(sanitizeString),
  number: z.string(),
  complement: z.string().transform(sanitizeString),
  lat: z.number().optional(),
  lng: z.number().optional(),
  invoices: z.array(InvoiceDataSchema).min(1),
  tariffRate: z.number().positive("Tarifa deve ser positiva"),

  availableArea: z.number().nonnegative(),
  mapImage: z.string().optional(),
  zipCode: z.string().optional(),
  connectionType: z.enum(["monofasico", "bifasico", "trifasico"]).optional(),
  averageConsumption: z.number().optional(),

  // Dados de Irradiação Persistidos (V2.1.0)
  monthlyIrradiation: z.array(z.number()).length(12).optional(),
  irradiationCity: z.string().optional(), // Nome do preset/cidade selecionada para referência

  // Deep Link — FK virtual para Lead no Iaçã (null = projeto standalone)
  iacaLeadId: z.string().nullable().optional(),

  // Diagnóstico Preliminar (V3.3)
  roofType: z.enum(['ceramica', 'metalico', 'fibrocimento', 'laje', 'outro']).optional(),
  roofInclination: z.number().min(0).max(60).optional(),
  leadPersona: z.enum(['provedor', 'calculista']).optional(),
});

export type InputData = z.infer<typeof InputDataSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;
