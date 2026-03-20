import { z } from "zod";

/**
 * DATABASE.SCHEMAS.TS
 * Representação estrita das tabelas do Supabase (Equipment DB).
 * 
 * MOTIVAÇÃO:
 * - A aplicação não pode confiar cegamente no retorno do DB.
 * - `z.coerce` é usado para garantir que strings numéricas sejam convertidas.
 * - Campos opcionais refletem colunas nullable.
 */

export const SupabaseInverterSchema = z.object({
  id: z.string().uuid().or(z.string()), // Aceita UUID ou string legada
  manufacturer: z.string().min(1, "Fabricante obrigatório"),
  model: z.string().min(1, "Modelo obrigatório"),

  // Electrical Specs (Critical)
  power_ac_watts: z.coerce.number().min(0, "Potência AC inválida"),
  max_input_voltage: z.coerce.number().min(0, "Tensão máx entrada inválida"),
  start_voltage: z.coerce.number().min(0, "Tensão de partida inválida").optional().default(0), // Fallback seguro
  max_input_current: z.coerce.number().min(0, "Corrente máx entrada inválida"),

  // Output / Grid
  phases: z.enum(['single', 'three', 'split']).or(z.string()), // Flexibilidade controlada
  efficiency_percent: z.coerce.number().min(0).max(100, "Eficiência suspeita (>100%)"),

  // Physical
  weight_kg: z.coerce.number().min(0).optional().default(0),

  // Engineering Deep Specs (MPPT)
  mppts: z.coerce.number().int().min(1).default(1),
  max_isc_per_mppt: z.coerce.number().min(0).optional().default(0),
  min_mppt_voltage: z.coerce.number().min(0).optional().default(0),
  max_mppt_voltage: z.coerce.number().min(0).optional().default(0),

  // Metadata
  is_active: z.boolean().optional().default(true)
});

export const SupabaseModuleSchema = z.object({
  id: z.string().uuid().or(z.string()),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  technology: z.string().optional().default('monocrystalline'),

  // Dimensions
  height_mm: z.coerce.number().min(0),
  width_mm: z.coerce.number().min(0),
  thickness_mm: z.coerce.number().min(0).optional().default(30),
  weight_kg: z.coerce.number().min(0).optional().default(20),

  // Electrical
  power_watts: z.coerce.number().min(0),
  efficiency_percent: z.coerce.number().min(0).max(100), // Módulos atuais estão entre 15-25%
  cells: z.coerce.number().int().min(0).optional().default(144),

  // V/I Specs
  imp: z.coerce.number().min(0),
  vmp: z.coerce.number().min(0),
  isc: z.coerce.number().min(0),
  voc: z.coerce.number().min(0),

  // Safety / Temp
  max_series_fuse: z.coerce.number().min(0).optional().default(20),
  temp_coeff_pmax_percent: z.coerce.number().max(0).optional().default(-0.35), // Geralmente negativo

  // Metadata
  is_active: z.boolean().optional().default(true)
});

// Types inferidos para uso nos mappers
export type SupabaseInverterDB = z.infer<typeof SupabaseInverterSchema>;
export type SupabaseModuleDB = z.infer<typeof SupabaseModuleSchema>;
