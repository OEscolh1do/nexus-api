import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import type { PortDomain } from '@/lib/types/topology';

// ─── Domain colour tokens ─────────────────────────────────────────────────────
const DOMAIN_COLOR: Record<PortDomain, string> = {
  DC: '#f59e0b', // amber-400
  AC: '#60a5fa', // blue-400
};

// ─── Manhattan / orthogonal path computation ──────────────────────────────────

/**
 * Computes an orthogonal SVG path between two handles.
 *
 * - Horizontal source (right / left): H midX V ty H tx
 * - Backward source: U-turn with fixed loop offset
 * - Vertical source (top / bottom): V midY H tx V ty
 * - Same Y / X: straight line
 */
export function orthogonalPath(
  sx: number, sy: number,
  tx: number, ty: number,
  srcPos: string,
  tgtPos: string,
): string {
  const dx = Math.abs(tx - sx);
  const dy = Math.abs(ty - sy);

  if (dx < 1 && dy < 1) return `M ${sx} ${sy} L ${tx} ${ty}`;

  const horizontalSource = srcPos === 'right' || srcPos === 'left';

  if (horizontalSource) {
    if (dy < 1) return `M ${sx} ${sy} H ${tx}`;

    const forward = srcPos === 'right' ? tx >= sx : tx <= sx;
    if (forward) {
      const midX = (sx + tx) / 2;
      return `M ${sx} ${sy} H ${midX} V ${ty} H ${tx}`;
    } else {
      // U-turn: → ↕ ← ↕ →
      const loopOffset = 28;
      const exitX  = srcPos === 'right' ? sx + loopOffset : sx - loopOffset;
      const entryX = tgtPos === 'left'  ? tx - loopOffset : tx + loopOffset;
      const midY   = (sy + ty) / 2;
      return `M ${sx} ${sy} H ${exitX} V ${midY} H ${entryX} V ${ty} H ${tx}`;
    }
  } else {
    if (dx < 1) return `M ${sx} ${sy} V ${ty}`;
    const midY = (sy + ty) / 2;
    return `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`;
  }
}

// ─── Edge data shape ──────────────────────────────────────────────────────────

export interface OrthogonalEdgeData extends Record<string, unknown> {
  domain:     PortDomain;
  waypoints?: [number, number][];
  label?:     string;
  error?:     boolean;
}

// EdgeProps generic takes the full Edge type, not just the data
type OrthogonalEdgeType = Edge<OrthogonalEdgeData>;

// ─── Component ────────────────────────────────────────────────────────────────

function OrthogonalEdgeComponent({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<OrthogonalEdgeType>) {
  const domain    = (data?.domain ?? 'DC') as PortDomain;
  const waypoints = data?.waypoints as [number, number][] | undefined;
  const hasError  = (data?.error ?? false) as boolean;
  const edgeLabel = data?.label as string | undefined;

  let edgePath: string;
  if (waypoints && waypoints.length > 0) {
    const pts: [number, number][] = [[sourceX, sourceY], ...waypoints, [targetX, targetY]];
    edgePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  } else {
    edgePath = orthogonalPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  }

  const stroke = hasError ? '#ef4444' : selected ? '#38bdf8' : DOMAIN_COLOR[domain];
  const strokeW = selected ? 1.5 : 1;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth: strokeW, transition: 'stroke 0.15s' }}
      />

      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`, color: stroke }}
            className="absolute pointer-events-none rounded px-1 py-0.5 text-[8px] font-mono font-bold bg-slate-950/90 border border-slate-700"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const OrthogonalEdge = memo(OrthogonalEdgeComponent);
