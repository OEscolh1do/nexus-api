// ============================================================
// Stub interfaces — replace with actual imports when available
// ============================================================

export interface ModuleModel {
  id: string;
  vocStc: number;
  vmpStc: number;
  iscStc: number;
  impStc: number;
  tempCoeffVoc: number;   // per °C, e.g. -0.0029
  tempCoeffVmp: number;   // per °C
  noct: number;           // °C, typically 45
  pmax: number;           // Wp
}

export interface InverterModel {
  id: string;
  maxVocInput: number;
  maxVmpInput: number;
  minVmpInput: number;
  mpptCount: number;
  maxMpptCurrentA: number;
}

export interface MPPTConfig {
  id: string;
  mpptId: string;
  inverterId: string;
  stringGroupIds: string[];
}

export interface ArrangementNode {
  id: string;
  stringGroupId?: string;
  arrangementId?: string;
}

export interface StringEdge {
  id: string;
  sourceNodeId: string;
  sourcePortPolarity: '+' | '-';
  targetNodeId: string;
  targetPortPolarity: '+' | '-';
}

export interface StringGroup {
  id: string;
  nodeIds: string[];
  arrangementId?: string;
}

export interface ArrangementGraph {
  nodes: ArrangementNode[];
  edges: StringEdge[];
  strings: StringGroup[];
}

export interface WeatherData {
  tmin: number;
  tambMax: number;
}

export type SurfaceType =
  | 'ceramica'
  | 'metalico'
  | 'fibrocimento'
  | 'laje'
  | 'ground'
  | 'carport';

// ============================================================
// Validation types
// ============================================================

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  affectedIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ============================================================
// Main validation function
// ============================================================

export function validateArrangementGraph(
  graph: ArrangementGraph,
  mpptConfigs: MPPTConfig[],
  inverters: InverterModel[],
  modules: ModuleModel[],
  weatherData: WeatherData
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const mod = modules[0];
  if (!mod) {
    errors.push({
      code: 'NO_MODULE_SELECTED',
      severity: 'error',
      message: 'Nenhum módulo selecionado no projeto',
      affectedIds: [],
    });
    return { valid: false, errors, warnings };
  }

  // Rule 1: UNCONNECTED_MODULE — nodes without stringGroupId
  const unconnected = graph.nodes.filter(n => !n.stringGroupId);
  if (unconnected.length > 0) {
    errors.push({
      code: 'UNCONNECTED_MODULE',
      severity: 'error',
      message: `${unconnected.length} módulo(s) sem conexão de string`,
      affectedIds: unconnected.map(n => n.id),
    });
  }

  // Rule 2: VOC_OVERCURRENT — Voc frio > inverter.maxVocInput
  for (const string of graph.strings) {
    const mppt = mpptConfigs.find(m => m.stringGroupIds.includes(string.id));
    if (!mppt) continue;
    const inverter = inverters.find(inv => inv.id === mppt.inverterId);
    if (!inverter) continue;

    const vocCold = calculateVocCold(string.nodeIds.length, mod, weatherData.tmin);
    if (vocCold > inverter.maxVocInput) {
      errors.push({
        code: 'VOC_OVERCURRENT',
        severity: 'error',
        message: `String ${string.id}: Voc frio ${vocCold.toFixed(1)} V > limite do inversor ${inverter.maxVocInput} V`,
        affectedIds: [string.id],
      });
    }
  }

  // Rule 3: MPPT_ORIENTATION_MISMATCH — strings with different arrangementIds on same MPPT
  for (const mppt of mpptConfigs) {
    const stringsInMppt = graph.strings.filter(s =>
      mppt.stringGroupIds.includes(s.id)
    );
    const arrangementIds = new Set(
      stringsInMppt.map(s => s.arrangementId ?? 'unknown')
    );
    if (arrangementIds.size > 1) {
      warnings.push({
        code: 'MPPT_ORIENTATION_MISMATCH',
        severity: 'warning',
        message: `MPPT ${mppt.mpptId} recebe strings de ${arrangementIds.size} áreas com orientações distintas — perdas por mismatch`,
        affectedIds: [mppt.id],
      });
    }
  }

  // Rule 4: POLARITY_CONFLICT — edge with same polarity on both ends
  for (const edge of graph.edges) {
    if (edge.sourcePortPolarity === edge.targetPortPolarity) {
      errors.push({
        code: 'POLARITY_CONFLICT',
        severity: 'error',
        message: `Aresta ${edge.id}: mesma polaridade (${edge.sourcePortPolarity}) nas duas pontas — curto-circuito`,
        affectedIds: [edge.id],
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// Electrical calculation helpers
// ============================================================

/**
 * Voc at minimum ambient temperature (worst-case for overvoltage protection).
 * tempCoeffVoc is negative (e.g. -0.0029 for -0.29%/°C).
 */
export function calculateVocCold(
  nModules: number,
  mod: ModuleModel,
  tmin: number
): number {
  return nModules * mod.vocStc * (1 + mod.tempCoeffVoc * (tmin - 25));
}

// NOCT offset per surface type (°C added to cell temperature)
const SURFACE_NOCT_OFFSET: Record<SurfaceType, number> = {
  ceramica:     0,
  metalico:     3,
  fibrocimento: 5,
  laje:         8,
  ground:      -3,
  carport:     -5,
};

/**
 * Vmp at maximum operating temperature (worst-case for MPPT window check).
 * Uses simplified NOCT model: Tcell = Tamb + (NOCT - 20) / 0.8 + surfaceOffset
 */
export function calculateVmpHot(
  nModules: number,
  mod: ModuleModel,
  tambMax: number,
  surfaceType: SurfaceType
): number {
  const noctOffset = SURFACE_NOCT_OFFSET[surfaceType];
  const tcell = tambMax + (mod.noct - 20) / 0.8 + noctOffset;
  return nModules * mod.vmpStc * (1 + mod.tempCoeffVmp * (tcell - 25));
}

/**
 * Great-circle distance between two geographic points in metres.
 * Uses the haversine formula.
 */
export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
