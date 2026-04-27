// validateArrangementGraph.ts — WITHOUT SKILL (baseline genérico)
// Implementação sem guia de skill: nomes e regras mais genéricos

// ─── Stub interfaces ──────────────────────────────────────────────────────────

export interface ModuleNode {
  id: string;
  stringId?: string;
  arrangementId?: string;
}

export type Polarity = 'positive' | 'negative';

export interface ConnectionEdge {
  id: string;
  fromNodeId: string;
  fromPolarity: Polarity;
  toNodeId: string;
  toPolarity: Polarity;
}

export interface StringConfig {
  id: string;
  moduleIds: string[];
  mpptId?: string;
  arrangementId?: string;
}

export interface MpptConfig {
  id: string;
  inverterId: string;
  stringIds: string[];
}

export interface InverterSpec {
  id: string;
  maxVoc: number;
  maxVmp: number;
  minVmp: number;
}

export interface ModuleSpec {
  vocStc: number;
  vmpStc: number;
  iscStc: number;
  tempCoeffVoc: number;
  tempCoeffVmp: number;
  noct: number;
  pmax: number;
}

export interface ArrangementGraph {
  modules: ModuleNode[];
  edges: ConnectionEdge[];
  strings: StringConfig[];
}

export interface WeatherInput {
  minAmbientTemp: number;
  maxAmbientTemp: number;
}

// ─── Validation types ─────────────────────────────────────────────────────────

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

// ─── Main function ────────────────────────────────────────────────────────────

export function validateArrangementGraph(
  graph: ArrangementGraph,
  mpptConfigs: MpptConfig[],
  inverters: InverterSpec[],
  moduleSpec: ModuleSpec,
  weather: WeatherInput
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Rule 1: disconnected modules (no string)
  const disconnected = graph.modules.filter(m => !m.stringId);
  if (disconnected.length > 0) {
    errors.push({
      code: 'DISCONNECTED_MODULE',
      severity: 'error',
      message: `${disconnected.length} module(s) not connected to any string`,
      affectedIds: disconnected.map(m => m.id),
    });
  }

  // Rule 2: voltage exceeds inverter limit
  for (const str of graph.strings) {
    const mppt = mpptConfigs.find(m => m.stringIds.includes(str.id));
    if (!mppt) continue;
    const inverter = inverters.find(inv => inv.id === mppt.inverterId);
    if (!inverter) continue;
    const n = str.moduleIds.length;
    // Simple Voc without thermal correction
    const voc = n * moduleSpec.vocStc;
    if (voc > inverter.maxVoc) {
      errors.push({
        code: 'VOC_EXCEEDS_LIMIT',
        severity: 'error',
        message: `String ${str.id}: Voc ${voc.toFixed(0)}V exceeds inverter max ${inverter.maxVoc}V`,
        affectedIds: [str.id],
      });
    }
  }

  // Rule 3: orientation mismatch
  for (const mppt of mpptConfigs) {
    const stringsInMppt = graph.strings.filter(s => mppt.stringIds.includes(s.id));
    const arrangementIds = new Set(stringsInMppt.map(s => s.arrangementId ?? 'unknown'));
    if (arrangementIds.size > 1) {
      warnings.push({
        code: 'ORIENTATION_MISMATCH',
        severity: 'warning',
        message: `MPPT ${mppt.id}: strings from different areas may have orientation mismatch`,
        affectedIds: [mppt.id],
      });
    }
  }

  // Rule 4: polarity conflict
  for (const edge of graph.edges) {
    if (edge.fromPolarity === edge.toPolarity) {
      errors.push({
        code: 'POLARITY_CONFLICT',
        severity: 'error',
        message: `Edge ${edge.id}: same polarity on both ends`,
        affectedIds: [edge.id],
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Voc at minimum temperature — no explicit thermal formula */
export function calculateVocCold(
  nModules: number,
  mod: ModuleSpec,
  tmin: number
): number {
  // Note: baseline version uses simplified formula without tempCoeffVoc reference
  const tempDelta = tmin - 25;
  return nModules * mod.vocStc * (1 + mod.tempCoeffVoc * tempDelta);
}

/** Hot Vmp without NOCT surface offset */
export function calculateVmpHot(
  nModules: number,
  mod: ModuleSpec,
  tambMax: number
): number {
  const tcell = tambMax + (mod.noct - 20) * 0.8;
  return nModules * mod.vmpStc * (1 + mod.tempCoeffVmp * (tcell - 25));
}

/** Haversine distance between two points */
export function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
