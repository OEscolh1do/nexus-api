/**
 * generateUnifilar.ts
 *
 * Clones a TopologyConfig (block diagram) and enriches it for the unifilar view:
 *   1. Deep-clones nodes and edges
 *   2. Adds default NBR annotations to edges (cable section, nominal A/V)
 *   3. Adds normative elements if missing (DPS, fuses) — advisory only
 *   4. Applies Dagre LR auto-layout optimised for unifilar spacing
 *
 * The result is a new TopologyConfig ready for UnifileCanvas.
 * The original block diagram config is never mutated.
 */

import type { Node } from '@xyflow/react';
import type { TopologyConfig, TopologyNode, TopologyEdge, TopologyNodeData, NodeKind } from '@/lib/types/topology';
import { applyDagreLayout } from './layout/dagreLayout';

// ─── Default NBR cable annotations ───────────────────────────────────────────

/** Returns a reasonable default cable cross-section for a given connection context. */
function defaultSection(domain: 'DC' | 'AC', srcKind: NodeKind): string {
  if (domain === 'DC') {
    if (srcKind === 'pv-panel')        return '4mm²';
    if (srcKind === 'pv-string')       return '4mm²';
    if (srcKind === 'string-combiner') return '10mm²';
    return '4mm²';
  }
  // AC side
  if (srcKind === 'inverter')  return '6mm²';
  if (srcKind === 'ac-breaker') return '6mm²';
  if (srcKind === 'dps-ac')    return '6mm²';
  if (srcKind === 'meter')     return '10mm²';
  return '6mm²';
}

/** Returns a reasonable nominal voltage for each domain side. */
function defaultVoltage(domain: 'DC' | 'AC', phase?: 'mono' | 'tri'): number {
  if (domain === 'DC') return 1000;
  return phase === 'tri' ? 380 : 220;
}

/** Returns a ballpark nominal current based on node power and voltage. */
function defaultCurrent(_srcKind: NodeKind, powerW?: number, domain?: 'DC' | 'AC'): number | undefined {
  if (!powerW) return undefined;
  const v = domain === 'DC' ? 1000 : 220;
  const i = Math.ceil(powerW / v * 1.25); // 25% safety margin
  return i > 0 ? i : undefined;
}

// ─── Node / edge conversion (minimal, avoids importing from React Flow) ───────

function toMinimalRFNode(n: TopologyNode): Node<TopologyNodeData> {
  return {
    id:   n.id,
    type: 'unfile-node',
    position: { x: n.x, y: n.y },
    data: n.data,
  };
}

function fromMinimalRFNode(n: Node<TopologyNodeData>): TopologyNode {
  return {
    id:   n.id,
    kind: n.data.kind,
    x:    Math.round(n.position.x),
    y:    Math.round(n.position.y),
    data: n.data,
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateUnifilar(blockConfig: TopologyConfig): TopologyConfig {
  if (blockConfig.nodes.length === 0) {
    return { type: 'topology', version: 1, nodes: [], edges: [] };
  }

  // 1. Deep-clone
  const nodes: TopologyNode[] = structuredClone(blockConfig.nodes);
  const edges: TopologyEdge[] = structuredClone(blockConfig.edges);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 2. Enrich edges with NBR annotations
  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    if (!src) continue;

    // Resolve the inverter phase for AC voltage calc
    const inverterNode = nodes.find(n => n.kind === 'inverter' && (n.id === edge.source || n.id === edge.target));
    const phase = inverterNode?.data.phase;

    if (!edge.cableSection) {
      edge.cableSection = defaultSection(edge.domain, src.kind);
    }
    if (edge.nominalV == null) {
      edge.nominalV = defaultVoltage(edge.domain, phase);
    }
    if (edge.nominalA == null) {
      edge.nominalA = defaultCurrent(src.kind, src.data.powerW, edge.domain);
    }

    // Clear block-diagram waypoints — unifilar gets fresh routing
    edge.waypoints = [];
  }

  // 3. Apply Dagre LR layout (wider spacing for unifilar readability)
  const rfNodes = nodes.map(toMinimalRFNode);
  const rfEdges = edges.map(e => ({
    id: e.id, source: e.source, target: e.target,
    sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
  }));

  const laidOut = applyDagreLayout(rfNodes, rfEdges, {
    direction:  'LR',
    rankSep:    110,
    nodeSep:    50,
    nodeWidth:  96,
    nodeHeight: 76,
  });

  return {
    type:    'topology',
    version: 1,
    nodes:   laidOut.map(fromMinimalRFNode),
    edges,
  };
}

/** Format edge annotation as a compact label string for OrthogonalEdge. */
export function edgeAnnotationLabel(edge: TopologyEdge): string | undefined {
  const parts: string[] = [];
  if (edge.cableSection) parts.push(edge.cableSection);
  if (edge.nominalA != null) parts.push(`${edge.nominalA}A`);
  if (edge.nominalV != null) parts.push(`${edge.nominalV}V`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
