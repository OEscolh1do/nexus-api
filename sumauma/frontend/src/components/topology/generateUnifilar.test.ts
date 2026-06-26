import { describe, it, expect } from 'vitest';
import { generateUnifilar, edgeAnnotationLabel } from './generateUnifilar';
import type { TopologyConfig, TopologyNode, TopologyEdge } from '@/lib/types/topology';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeNode(id: string, kind: TopologyNode['kind'], extra: Partial<TopologyNode['data']> = {}): TopologyNode {
  return {
    id,
    kind,
    x: 0,
    y: 0,
    data: { kind, label: id, domain: 'DC', ...extra },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  domain: 'DC' | 'AC' = 'DC',
): TopologyEdge {
  return { id, source, sourceHandle: 'out', target, targetHandle: 'in', domain };
}

const SIMPLE_CONFIG: TopologyConfig = {
  type: 'topology',
  version: 1,
  nodes: [
    makeNode('str1', 'pv-string', { powerW: 2200 }),
    makeNode('inv1', 'inverter', { mpptCount: 1, phase: 'mono', powerW: 5000 }),
    makeNode('djca', 'ac-breaker'),
    makeNode('grid', 'grid'),
  ],
  edges: [
    makeEdge('e1', 'str1', 'inv1', 'DC'),
    makeEdge('e2', 'inv1', 'djca', 'AC'),
    makeEdge('e3', 'djca', 'grid', 'AC'),
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateUnifilar', () => {
  it('returns empty topology when given empty nodes', () => {
    const result = generateUnifilar({ type: 'topology', version: 1, nodes: [], edges: [] });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('preserves all nodes and edges from the source', () => {
    const result = generateUnifilar(SIMPLE_CONFIG);
    expect(result.nodes).toHaveLength(SIMPLE_CONFIG.nodes.length);
    expect(result.edges).toHaveLength(SIMPLE_CONFIG.edges.length);
  });

  it('does not mutate the source config', () => {
    const original = structuredClone(SIMPLE_CONFIG);
    generateUnifilar(SIMPLE_CONFIG);
    expect(SIMPLE_CONFIG).toEqual(original);
  });

  it('annotates DC edges with cable section', () => {
    const result = generateUnifilar(SIMPLE_CONFIG);
    const dcEdge = result.edges.find(e => e.id === 'e1');
    expect(dcEdge?.cableSection).toBeDefined();
    expect(typeof dcEdge?.cableSection).toBe('string');
  });

  it('annotates AC edges with cable section', () => {
    const result = generateUnifilar(SIMPLE_CONFIG);
    const acEdge = result.edges.find(e => e.id === 'e2');
    expect(acEdge?.cableSection).toBeDefined();
  });

  it('annotates edges with nominal voltage', () => {
    const result = generateUnifilar(SIMPLE_CONFIG);
    const dcEdge = result.edges.find(e => e.id === 'e1');
    const acEdge = result.edges.find(e => e.id === 'e2');
    expect(dcEdge?.nominalV).toBe(1000);
    expect(acEdge?.nominalV).toBe(220); // mono-phase
  });

  it('annotates edges with nominal voltage 380V for 3-phase inverter', () => {
    const triConfig: TopologyConfig = {
      type: 'topology', version: 1,
      nodes: [
        makeNode('inv', 'inverter', { phase: 'tri' }),
        makeNode('dj',  'ac-breaker'),
      ],
      edges: [makeEdge('e', 'inv', 'dj', 'AC')],
    };
    const result = generateUnifilar(triConfig);
    expect(result.edges[0].nominalV).toBe(380);
  });

  it('clears waypoints from cloned edges', () => {
    const withWaypoints: TopologyConfig = {
      type: 'topology', version: 1,
      nodes: SIMPLE_CONFIG.nodes,
      edges: SIMPLE_CONFIG.edges.map(e => ({ ...e, waypoints: [[10, 20]] as [number, number][] })),
    };
    const result = generateUnifilar(withWaypoints);
    for (const edge of result.edges) {
      expect(edge.waypoints).toEqual([]);
    }
  });

  it('applies layout (node positions change)', () => {
    // Source nodes are all at (0, 0). After layout, positions differ.
    const result = generateUnifilar(SIMPLE_CONFIG);
    const allAtOrigin = result.nodes.every(n => n.x === 0 && n.y === 0);
    expect(allAtOrigin).toBe(false);
  });

  it('does not annotate edges that already have cableSection', () => {
    const preset: TopologyConfig = {
      type: 'topology', version: 1,
      nodes: SIMPLE_CONFIG.nodes,
      edges: [{ ...SIMPLE_CONFIG.edges[0], cableSection: '16mm²' }],
    };
    const result = generateUnifilar(preset);
    expect(result.edges[0].cableSection).toBe('16mm²');
  });

  it('computes nominal current for edges connected to powered nodes', () => {
    const result = generateUnifilar(SIMPLE_CONFIG);
    const dcEdge = result.edges.find(e => e.id === 'e1');
    // str1 has powerW=2200; current = ceil(2200/1000 * 1.25) = ceil(2.75) = 3
    expect(dcEdge?.nominalA).toBe(3);
  });
});

describe('edgeAnnotationLabel', () => {
  it('returns undefined for unannotated edge', () => {
    const edge: TopologyEdge = {
      id: 'e', source: 'a', sourceHandle: 'out',
      target: 'b', targetHandle: 'in', domain: 'DC',
    };
    expect(edgeAnnotationLabel(edge)).toBeUndefined();
  });

  it('formats all three annotations', () => {
    const edge: TopologyEdge = {
      id: 'e', source: 'a', sourceHandle: 'out',
      target: 'b', targetHandle: 'in', domain: 'DC',
      cableSection: '4mm²', nominalA: 10, nominalV: 1000,
    };
    expect(edgeAnnotationLabel(edge)).toBe('4mm² · 10A · 1000V');
  });

  it('handles partial annotations', () => {
    const edge: TopologyEdge = {
      id: 'e', source: 'a', sourceHandle: 'out',
      target: 'b', targetHandle: 'in', domain: 'AC',
      cableSection: '6mm²',
    };
    expect(edgeAnnotationLabel(edge)).toBe('6mm²');
  });
});
