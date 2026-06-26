import { z } from 'zod';

export const MPPTSpecSchema = z.object({
  mpptId: z.number().int().min(1), // 1-based
  maxInputVoltage: z.number(), // V — tensão máxima absoluta
  minMpptVoltage: z.number(), // V — piso da faixa MPPT
  maxMpptVoltage: z.number(), // V — teto da faixa MPPT
  maxCurrentPerMPPT: z.number(), // A — corrente máxima por MPPT
  stringsAllowed: z.number().int().min(1), // nº máximo de strings em paralelo
});

// ── Parametric Symbol Config (Fase PSB) ──────────────────────────────────────

/** Chave tipada de porta: `mppt_N_pos`, `mppt_N_neg`, ou `ac_out` */
export type PortKey = `mppt_${number}_${'pos' | 'neg'}` | 'ac_out';

export const ParametricPortSchema = z.object({
  side: z.enum(['top', 'right', 'bottom', 'left']),
  offset: z.number().min(0).max(1),     // 0–1 ao longo do lado
  label: z.string(),
  polarity: z.enum(['positive', 'negative', 'ac-out']),
  mpptIndex: z.number().int().min(0).optional(), // undefined apenas para 'ac_out'
});

export const ParametricSymbolConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('parametric-block'),
    dimensions: z.object({ width: z.number().positive(), height: z.number().positive() }),
    ports: z.record(z.string(), ParametricPortSchema),
  }),
]);

export type ParametricPort = z.infer<typeof ParametricPortSchema>;
export type ParametricSymbolConfig = z.infer<typeof ParametricSymbolConfigSchema>;

// ── Block Diagram Footprint (Fase Hardware/Layer 2) ───────────────────────────

export const MPPTChannelSchema = z.object({
  mpptIndex: z.number().int().min(1),     // base 1 para exibição
  inputCount: z.number().int().min(1),    // pares de bornes +/− físicos (MC4)
  inputLabels: z.array(z.string()).optional(), // ex: ["PV1", "PV2"]
});

export const BlockDiagramFootprintSchema = z.object({
  inverterId: z.string(),
  mpptChannels: z.array(MPPTChannelSchema),
  acOutput: z.object({
    label: z.string(),       // ex: "CA 220V", "CA 380V"
    phase: z.enum(['mono', 'tri']),
  }),
});

export type MPPTChannel = z.infer<typeof MPPTChannelSchema>;
export type BlockDiagramFootprint = z.infer<typeof BlockDiagramFootprintSchema>;

// ─────────────────────────────────────────────────────────────────────────────

export const InverterCatalogItemSchema = z.object({
  id: z.string().min(1), // slug
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  imageUrl: z.string().optional(),
  unifilarSymbolRef: z.string().optional(),
  symbolConfig: ParametricSymbolConfigSchema.nullable().optional(), // PSB (Layer 3) — @deprecated
  blockDiagramFootprint: BlockDiagramFootprintSchema.nullable().optional(), // Hardware (Layer 2) — @deprecated
  // New unified topology engine (TopologyEditor / BlockDiagramCanvas + UnifileCanvas)
  typologyConfig: z.record(z.unknown()).nullable().optional(),
  nominalPowerW: z.number().positive(), // W — potência nominal CA
  maxDCPowerW: z.number().positive(),   // W — potência máxima CC
  mppts: z.array(MPPTSpecSchema).min(1),
  efficiency: z.object({
    euro: z.number().optional(), // %
    cec: z.number().optional(),  // %
  }).optional(),
  asset: z.object({
    glbAsset: z.string().optional(),
    featureId: z.string().optional(),
  }).optional(),
  // Maintained for backward compatibility for some calculations if needed
  maxInputVoltage: z.number().optional(),
  // ── Display / Inventory fields (unified catalog) ──
  connectionType: z.string().optional(),       // "Monofásico" | "Trifásico"
  width: z.number().optional(),                // mm
  height: z.number().optional(),               // mm
  depth: z.number().optional(),                // mm
  weight: z.number().optional(),               // kg
  outputVoltage: z.number().optional(),         // V (CA)
  outputFrequency: z.number().optional(),       // Hz
  maxOutputCurrent: z.number().optional(),      // A (CA)

  // -- Engineering PV Specs (v3.7) --
  Voc_max_hardware: z.number().optional(),
  Isc_max_hardware: z.number().optional(),
  maxOutputPowerW: z.number().optional(),
  deratingTempC: z.number().optional(),
  coolingType: z.enum(['passive', 'active']).optional(),
  afci: z.boolean().default(true),
  rsd: z.boolean().default(false),
  portaria515Compliant: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type InverterCatalogItem = z.infer<typeof InverterCatalogItemSchema>;
export const inverterCatalogSchema = z.array(InverterCatalogItemSchema);
