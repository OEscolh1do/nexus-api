/**
 * topology.ts — Tipos para o editor de topologia (BlockDiagramCanvas / UnifileCanvas)
 *
 * Representa um grafo de conectividade elétrica PV: nós + arestas tipadas.
 */

// ─── Node kinds ───────────────────────────────────────────────────────────────

export type NodeKind =
  | 'pv-panel'        // painel fotovoltaico individual
  | 'pv-string'       // string de painéis (agrupamento)
  | 'string-combiner' // caixa de junção / combiner box
  | 'dps-dc'          // DPS lado CC
  | 'fuse-dc'         // fusível CC
  | 'mppt-input'      // entrada MPPT individual de um inversor
  | 'inverter'        // inversor (contém N entradas MPPT + 1 saída AC)
  | 'ac-breaker'      // disjuntor CA
  | 'dps-ac'          // DPS lado CA
  | 'meter'           // medidor bidirecional
  | 'grid';           // ponto de conexão com a rede

// ─── Port definitions ─────────────────────────────────────────────────────────

export type PortDomain = 'DC' | 'AC';
export type PortSide   = 'top' | 'right' | 'bottom' | 'left';

export interface PortDef {
  id:             string;
  side:           PortSide;
  domain:         PortDomain;
  label?:         string;
  /** 0–100 along the side; default 50 (centered) */
  offsetPercent?: number;
}

/**
 * Static port registry.
 * Dynamic ports (inverter MPPT inputs, combiner string inputs) are
 * generated at runtime based on data.mpptCount / data.inputCount.
 * Dynamic port IDs follow the pattern: `mppt-{n}` and `in-{n}`.
 */
export const PORT_REGISTRY: Record<NodeKind, PortDef[]> = {
  'pv-panel': [
    { id: 'out', side: 'right', domain: 'DC', label: '+' },
  ],
  'pv-string': [
    { id: 'in',  side: 'left',  domain: 'DC' },
    { id: 'out', side: 'right', domain: 'DC' },
  ],
  'string-combiner': [
    // inputs are dynamic: in-0, in-1, … generated from data.inputCount
    { id: 'out', side: 'right', domain: 'DC' },
  ],
  'dps-dc': [
    { id: 'in',  side: 'left',  domain: 'DC' },
    { id: 'out', side: 'right', domain: 'DC' },
  ],
  'fuse-dc': [
    { id: 'in',  side: 'left',  domain: 'DC' },
    { id: 'out', side: 'right', domain: 'DC' },
  ],
  'mppt-input': [
    { id: 'in',  side: 'left',  domain: 'DC' },
    { id: 'out', side: 'right', domain: 'DC' },
  ],
  'inverter': [
    // MPPT inputs are dynamic: mppt-0, mppt-1, … generated from data.mpptCount
    { id: 'ac-out', side: 'right', domain: 'AC', label: 'AC' },
  ],
  'ac-breaker': [
    { id: 'in',  side: 'left',  domain: 'AC' },
    { id: 'out', side: 'right', domain: 'AC' },
  ],
  'dps-ac': [
    { id: 'in',  side: 'left',  domain: 'AC' },
    { id: 'out', side: 'right', domain: 'AC' },
  ],
  'meter': [
    { id: 'in',  side: 'left',  domain: 'AC' },
    { id: 'out', side: 'right', domain: 'AC' },
  ],
  'grid': [
    { id: 'in', side: 'left', domain: 'AC', label: 'REDE' },
  ],
};

/** Resolve the domain of a port handle, including dynamic handles. */
export function getPortDomain(kind: NodeKind, handleId: string): PortDomain {
  const staticPort = PORT_REGISTRY[kind].find(p => p.id === handleId);
  if (staticPort) return staticPort.domain;
  // Dynamic handles
  if (handleId.startsWith('mppt-')) return 'DC';   // inverter MPPT inputs
  if (handleId.startsWith('in-'))   return 'DC';   // combiner string inputs
  return 'DC';
}

// ─── Node data payload ────────────────────────────────────────────────────────

export interface MpptChannelConfig {
  mpptIndex: number;     // 0-based
  inputCount: number;    // 1–4 entradas por MPPT
  inputLabels?: string[]; // ex: ['PV1', 'PV2']
}

export interface TopologyNodeData extends Record<string, unknown> {
  kind:          NodeKind;
  label:         string;
  /** Primary electrical domain of this node */
  domain:        PortDomain;
  // shared optional fields
  powerW?:       number;          // pv-panel, pv-string, inverter
  // string-combiner
  inputCount?:   number;          // drives dynamic in-N handles
  // inverter
  mpptCount?:    number;          // drives dynamic mppt-N handles
  mpptChannels?: MpptChannelConfig[]; // Per-MPPT channel config (inverter only)
  phase?:        'mono' | 'tri';  // inverter, ac-breaker, meter, grid
  model?:        string;
  manufacturer?: string;
  // protection annotations
  rating?:       string;          // e.g. '20A', '500V'
  // unifilar annotation (phase 3+)
  cableSection?: string;          // e.g. '6mm²'
  nominalV?:     number;
  nominalA?:     number;
}

// ─── Graph model ──────────────────────────────────────────────────────────────

export interface TopologyNode {
  id:   string;
  kind: NodeKind;
  x:    number;
  y:    number;
  data: TopologyNodeData;
}

export interface TopologyEdge {
  id:           string;
  source:       string;
  sourceHandle: string;
  target:       string;
  targetHandle: string;
  domain:       PortDomain;
  /** User-adjusted intermediate bend points for orthogonal routing */
  waypoints?:   [number, number][];
  // ── NBR / unifilar annotations (populated by generateUnifilar) ────
  cableSection?: string;   // e.g. '6mm²'
  nominalA?:     number;   // nominal current in Amperes
  nominalV?:     number;   // nominal voltage in Volts
}

export interface TopologyConfig {
  type:    'topology';
  version: 1;
  nodes:   TopologyNode[];
  edges:   TopologyEdge[];
}

export function emptyTopology(): TopologyConfig {
  return { type: 'topology', version: 1, nodes: [], edges: [] };
}

// ─── Electrical validation ────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity:  ValidationSeverity;
  code:      string;
  message:   string;
  nodeIds?:  string[];
  edgeIds?:  string[];
}

export function validateTopology(cfg: TopologyConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeMap = new Map(cfg.nodes.map(n => [n.id, n]));

  for (const edge of cfg.edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) {
      issues.push({
        severity: 'error', code: 'DANGLING_EDGE',
        message: `Aresta ${edge.id} referencia nó inexistente.`,
        edgeIds: [edge.id],
      });
      continue;
    }

    const srcDomain = getPortDomain(src.kind, edge.sourceHandle);
    const tgtDomain = getPortDomain(tgt.kind, edge.targetHandle);

    if (srcDomain !== tgtDomain) {
      issues.push({
        severity: 'error', code: 'DOMAIN_MISMATCH',
        message: `Conexão inválida: saída ${srcDomain} → entrada ${tgtDomain} entre "${src.data.label}" e "${tgt.data.label}".`,
        edgeIds: [edge.id],
        nodeIds: [src.id, tgt.id],
      });
    }
  }

  // Warn if inverter has no MPPT connections
  for (const node of cfg.nodes.filter(n => n.kind === 'inverter')) {
    const hasInput = cfg.edges.some(e => e.target === node.id && e.targetHandle.startsWith('mppt-'));
    if (!hasInput) {
      issues.push({
        severity: 'warning', code: 'INVERTER_NO_INPUT',
        message: `Inversor "${node.data.label}" não tem strings conectadas.`,
        nodeIds: [node.id],
      });
    }
  }

  return issues;
}

// ─── Kind metadata (labels + visual config) ───────────────────────────────────

export interface KindMeta {
  label:       string;
  shortLabel:  string;
  icon:        string;
  domain:      PortDomain | 'mixed';
  /** Tailwind classes for border + background */
  colorClass:  string;
  /** Whether height scales with input/mppt count */
  dynamic:     boolean;
}

export const KIND_META: Record<NodeKind, KindMeta> = {
  'pv-panel': {
    label: 'Painel FV', shortLabel: 'Painel',
    icon: '☀', domain: 'DC', dynamic: false,
    colorClass: 'border-yellow-500/50 bg-yellow-950/50 text-yellow-300',
  },
  'pv-string': {
    label: 'String PV', shortLabel: 'String',
    icon: '⚡', domain: 'DC', dynamic: false,
    colorClass: 'border-amber-500/50 bg-amber-950/50 text-amber-300',
  },
  'string-combiner': {
    label: 'Caixa de Junção', shortLabel: 'Combiner',
    icon: '⊞', domain: 'DC', dynamic: true,
    colorClass: 'border-orange-500/50 bg-orange-950/50 text-orange-300',
  },
  'dps-dc': {
    label: 'DPS CC', shortLabel: 'DPS CC',
    icon: '↯', domain: 'DC', dynamic: false,
    colorClass: 'border-red-500/50 bg-red-950/50 text-red-300',
  },
  'fuse-dc': {
    label: 'Fusível CC', shortLabel: 'Fusível',
    icon: '⊣', domain: 'DC', dynamic: false,
    colorClass: 'border-rose-500/50 bg-rose-950/50 text-rose-300',
  },
  'mppt-input': {
    label: 'Entrada MPPT', shortLabel: 'MPPT',
    icon: 'M', domain: 'DC', dynamic: false,
    colorClass: 'border-violet-500/50 bg-violet-950/50 text-violet-300',
  },
  'inverter': {
    label: 'Inversor', shortLabel: 'Inversor',
    icon: '⇌', domain: 'mixed', dynamic: true,
    colorClass: 'border-sky-500/50 bg-sky-950/50 text-sky-300',
  },
  'ac-breaker': {
    label: 'Disjuntor CA', shortLabel: 'DJ CA',
    icon: '⊟', domain: 'AC', dynamic: false,
    colorClass: 'border-blue-500/50 bg-blue-950/50 text-blue-300',
  },
  'dps-ac': {
    label: 'DPS CA', shortLabel: 'DPS CA',
    icon: '↯', domain: 'AC', dynamic: false,
    colorClass: 'border-indigo-500/50 bg-indigo-950/50 text-indigo-300',
  },
  'meter': {
    label: 'Medidor Bidirecional', shortLabel: 'Medidor',
    icon: '⊙', domain: 'AC', dynamic: false,
    colorClass: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300',
  },
  'grid': {
    label: 'Rede Elétrica', shortLabel: 'Rede',
    icon: '⏚', domain: 'AC', dynamic: false,
    colorClass: 'border-slate-500/50 bg-slate-800/80 text-slate-300',
  },
};

// ─── Block Diagram Footprint extraction ───────────────────────────────────────

/**
 * Extrai o BlockDiagramFootprint de um nó inversor.
 * Shape compatível com InverterCatalogItem.blockDiagramFootprint (Kurupira).
 */
export function extractBlockDiagramFootprint(data: TopologyNodeData): unknown | null {
  if (data.kind !== 'inverter') return null;

  const mpptChannels = data.mpptChannels ?? [];

  // Fallback: se mpptChannels não está preenchido, deriva de mpptCount
  let channels: Array<{ mpptIndex: number; inputCount: number; inputLabels?: string[] }>;
  if (mpptChannels.length > 0) {
    channels = mpptChannels.map(ch => ({
      mpptIndex: ch.mpptIndex + 1, // converter de 0-based para 1-based para o schema Kurupira
      inputCount: ch.inputCount,
      inputLabels: ch.inputLabels,
    }));
  } else {
    const count = data.mpptCount ?? 1;
    channels = Array.from({ length: count }, (_, i) => ({
      mpptIndex: i + 1,
      inputCount: 1, // fallback: 1 input por MPPT
    }));
  }

  const phase = data.phase ?? 'mono';
  const acLabel = phase === 'tri' ? 'CA 380V' : 'CA 220V';

  return {
    inverterId: data.model ?? 'unknown',
    mpptChannels: channels,
    acOutput: {
      label: acLabel,
      phase,
    },
  };
}
