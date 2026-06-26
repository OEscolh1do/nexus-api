import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { KIND_META, PORT_REGISTRY, type TopologyNodeData, type NodeKind, type PortSide } from '@/lib/types/topology';

// ─── Side → React Flow Position ──────────────────────────────────────────────
const SIDE_TO_POS: Record<PortSide, typeof Position[keyof typeof Position]> = {
  top:    Position.Top,
  right:  Position.Right,
  bottom: Position.Bottom,
  left:   Position.Left,
};

// ─── Node dimensions ──────────────────────────────────────────────────────────
const NODE_W   = 88;   // px — fixed width (compact chip-style)
const ROW_H    = 20;   // px — height per dynamic input row
const HEADER_H = 26;   // px — base height (single-row nodes)

function dynamicHeight(kind: NodeKind, data: TopologyNodeData): number {
  if (kind === 'inverter')        return HEADER_H + ROW_H * Math.max(1, data.mpptChannels?.length ?? data.mpptCount ?? 1);
  if (kind === 'string-combiner') return HEADER_H + ROW_H * Math.max(1, data.inputCount ?? 1);
  return HEADER_H;
}

// ─── Dynamic handle generators ────────────────────────────────────────────────
function mpptHandles(count: number, nodeH: number) {
  return Array.from({ length: count }, (_, i) => {
    const offsetPct = (HEADER_H + ROW_H * i + ROW_H / 2) / nodeH * 100;
    return (
      <Handle
        key={`mppt-${i}`}
        id={`mppt-${i}`}
        type="target"
        position={Position.Left}
        style={{ top: `${offsetPct}%`, background: '#f59e0b', border: '1px solid #78350f', width: 6, height: 6 }}
        className="!rounded-none"
      />
    );
  });
}

function combinerInputHandles(count: number, nodeH: number) {
  return Array.from({ length: count }, (_, i) => {
    const offsetPct = (HEADER_H + ROW_H * i + ROW_H / 2) / nodeH * 100;
    return (
      <Handle
        key={`in-${i}`}
        id={`in-${i}`}
        type="target"
        position={Position.Left}
        style={{ top: `${offsetPct}%`, background: '#f59e0b', border: '1px solid #7c2d12', width: 6, height: 6 }}
        className="!rounded-none"
      />
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

type TopologyBlockNodeType = Node<TopologyNodeData, 'topology-block'>;

function TopologyBlockNodeComponent({ data, selected, isConnectable }: NodeProps<TopologyBlockNodeType>) {
  const meta   = KIND_META[data.kind];
  const nodeH  = dynamicHeight(data.kind, data);
  const ports  = PORT_REGISTRY[data.kind];

  const isDynamic = data.kind === 'inverter' || data.kind === 'string-combiner';
  const mpptChannels = data.mpptChannels ?? [];
  const mpptCount  = mpptChannels.length > 0 ? mpptChannels.length : (data.mpptCount ?? 1);
  const inputCount = data.inputCount ?? 1;

  return (
    <div
      style={{ width: NODE_W, height: nodeH, minHeight: HEADER_H }}
      title={`${meta.label}: ${data.label}`}
      className={`
        relative flex flex-col rounded-sm border text-[10px] font-mono
        shadow-sm select-none transition-shadow duration-150
        ${meta.colorClass}
        ${selected ? 'ring-1 ring-sky-400 shadow-sky-500/20 shadow-xl' : ''}
      `}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-1.5 py-1 border-b border-white/10 flex-shrink-0">
        <span className="text-[10px] leading-none opacity-80">{meta.icon}</span>
        <span className="font-black text-[9px] uppercase tracking-widest truncate" title={data.label}>
          {meta.shortLabel}
        </span>
      </div>

      {/* ── Dynamic rows (inverter MPPT / combiner inputs) ────────── */}
      {isDynamic && data.kind === 'inverter' && (
        <div className="flex flex-col flex-1">
          {Array.from({ length: mpptCount }, (_, i) => {
            const ch = mpptChannels[i];
            const inputCount = ch?.inputCount ?? 1;
            const firstLabel = ch?.inputLabels?.[0];
            const dots = '●'.repeat(inputCount);
            return (
              <div key={i} style={{ height: ROW_H }} className="flex items-center justify-between px-1.5 border-b border-white/5 last:border-none">
                <span className="text-[7px] opacity-50 font-bold">M{i + 1}</span>
                <div className="flex items-center gap-1">
                  {firstLabel && <span className="text-[6px] opacity-40 truncate max-w-[2.5rem]">{firstLabel}</span>}
                  <span className="text-[7px] opacity-30">{dots}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isDynamic && data.kind === 'string-combiner' && (
        <div className="flex flex-col flex-1">
          {Array.from({ length: inputCount }, (_, i) => (
            <div key={i} style={{ height: ROW_H }} className="flex items-center px-2 border-b border-white/5 last:border-none">
              <span className="text-[8px] opacity-40 font-bold">S{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Annotation badge (rating, powerW) ─────────────────────── */}
      {(data.rating ?? data.powerW) && (
        <div className="absolute bottom-1 right-1.5 text-[7px] opacity-40 font-bold font-mono">
          {data.rating ?? (data.powerW != null ? `${(data.powerW / 1000).toFixed(1)}kW` : '')}
        </div>
      )}

      {/* ── Static handles ─────────────────────────────────────────── */}
      {ports.map(port => (
        <Handle
          key={port.id}
          id={port.id}
          type={port.id === 'out' || port.id === 'ac-out' ? 'source' : 'target'}
          position={SIDE_TO_POS[port.side]}
          isConnectable={isConnectable}
          style={{
            background: port.domain === 'DC' ? '#f59e0b' : '#60a5fa',
            border: `1px solid ${port.domain === 'DC' ? '#78350f' : '#1e3a5f'}`,
            width: 6, height: 6,
            ...(port.offsetPercent != null ? { top: `${port.offsetPercent}%` } : {}),
          }}
          className="!rounded-none"
        />
      ))}

      {/* ── Dynamic handles ────────────────────────────────────────── */}
      {data.kind === 'inverter'        && mpptHandles(mpptCount, nodeH)}
      {data.kind === 'string-combiner' && combinerInputHandles(inputCount, nodeH)}
    </div>
  );
}

export const TopologyBlockNode = memo(TopologyBlockNodeComponent);
