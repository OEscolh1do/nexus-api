import { z } from 'zod';

export const MPPTSpecSchema = z.object({
  mpptId: z.number().int().min(1), // 1-based
  maxInputVoltage: z.number(), // V — tensão máxima absoluta
  minMpptVoltage: z.number(), // V — piso da faixa MPPT
  maxMpptVoltage: z.number(), // V — teto da faixa MPPT
  maxCurrentPerMPPT: z.number(), // A — corrente máxima por MPPT
  stringsAllowed: z.number().int().min(1), // nº máximo de strings em paralelo
});

export const InverterCatalogItemSchema = z.object({
  id: z.string().min(1), // slug
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  nominalPowerW: z.number().positive(), // W — potência nominal CA
  maxDCPowerW: z.number().positive(), // W — potência máxima CC
  mppts: z.array(MPPTSpecSchema).min(1),
  efficiency: z.object({
    euro: z.number().optional(), // %
    cec: z.number().optional(), // %
  }).optional(),
  asset: z.object({
    glbAsset: z.string().optional(),
    featureId: z.string().optional(),
  }).optional(),
  // Maintained for backward compatibility for some calculations if needed, though replaced mostly by nested
  maxInputVoltage: z.number().optional(), 
});

export type InverterCatalogItem = z.infer<typeof InverterCatalogItemSchema>;
export const inverterCatalogSchema = z.array(InverterCatalogItemSchema);
