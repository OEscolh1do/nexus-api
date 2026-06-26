/**
 * dagreLayout.ts — Orthogonal auto-layout using Dagre
 *
 * Takes React Flow nodes + edges, runs Dagre's rank-based layout,
 * returns nodes with updated positions.
 *
 * Direction: LR (left-to-right) — natural PV flow:
 *   Painéis → Strings → Combiner → MPPT → Inversor → Proteções CA → Rede
 */
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

interface LayoutOptions {
  direction?:  'LR' | 'RL' | 'TB' | 'BT';
  rankSep?:    number;  // horizontal gap between ranks (px)
  nodeSep?:    number;  // vertical gap between nodes in same rank (px)
  nodeWidth?:  number;  // estimated node width used by dagre
  nodeHeight?: number;  // estimated node height used by dagre
}

/**
 * Applies Dagre layout to a set of React Flow nodes + edges.
 * Returns a new nodes array with updated positions; edges are unchanged.
 */
export function applyDagreLayout<NodeData extends Record<string, unknown>>(
  nodes: Node<NodeData>[],
  edges: Edge[],
  options: LayoutOptions = {},
): Node<NodeData>[] {
  const {
    direction  = 'LR',
    rankSep    = 80,
    nodeSep    = 40,
    nodeWidth  = 128,
    nodeHeight = 52,
  } = options;

  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep });

  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of edges) {
    // Only add edges between nodes that exist in the graph
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        // Dagre centres nodes; shift to top-left origin for React Flow
        x: Math.round(pos.x - nodeWidth  / 2),
        y: Math.round(pos.y - nodeHeight / 2),
      },
    };
  });
}
