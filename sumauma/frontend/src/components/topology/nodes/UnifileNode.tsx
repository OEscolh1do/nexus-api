import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { KIND_META, PORT_REGISTRY, type TopologyNodeData, type NodeKind, type PortSide } from '@/lib/types/topology';
import { IECNodeSymbol } from '../symbols/IECNodeSymbols';

// ─── Side → React Flow Position ──────────────────────────────────────────────
const SIDE_TO_POS: Record<PortSide, typeof Position[keyof typeof Position]> = {
  top:    Position.Top,
  right:  Position.Right,
  bottom: Position.Bottom,
  left:   Position.Left,
};

// ─── Domain colours for IEC symbol stroke ────────────────────────────────────
const DOMAIN_STROKE = { DC: '#f59e0b', AC: '#60a5fa', mixed: '#94a3b8' } as const;
const DOMAIN_FILL   = { DC: '#1c0a00', AC: '#00060f', mixed: '#0f172a' } as const;

// ─── Node dimensions ──────────────────────────────────────────────────────────
const NODE_W   = 88;
const SYM_SIZE = 40;
const ROW_H    = 22;
const HEADER_H = 68;  // symbol (40) + label (~28)

function dynamicHeight(kind: NodeKind, data: TopologyNodeData): number {
  if (kind === 'inverter')        return HEADER_H + ROW_H * Math.max(1, data.mpptCount  ?? 1);
  if (kind === 'string-combiner') return HEADER_H + ROW_H * Math.max(1, data.inputCount ?? 1);
  return HEADER_H;
}

// ─── Dynamic handle generators ────────────────────────────────────────────────
function mpptHandles(count: number, nodeH: number) {
  return Array.from({ length: count }, (_, i) => {
    const offsetPct = (HEADER_H + ROW_H * i + ROW_H / 2) / nodeH * 100;
    return (
      <Handle key={`mppt-${i}`} id={`mppt-${i}`} type="target" position={Position.Left}
        style={{ top: `${offsetPct}%`, background: '#f59e0b', border: '1.5px solid #78350f', width: 8, height: 8 }}
        className="!rounded-none"
      />
    );
  });
}

function combinerInputHandles(count: number, nodeH: number) {
  return Array.from({ length: count }, (_, i) => {
    const offsetPct = (HEADER_H + ROW_H * i + ROW_H / 2) / nodeH * 100;
    return (
      <Handle key={`in-${i}`} id={`in-${i}`} type="target" position={Position.Left}
        style={{ top: `${offsetPct}%`, background: '#f59e0b', border: '1.5px solid #7c2d12', width: 8, height: 8 }}
        className="!rounded-none"
      />
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

type UnifileNodeType = Node<TopologyNodeData, 'unfile-node'>;

function UnifileNodeComponent({ data, selected, isConnectable }: NodeProps<UnifileNodeType>) {
  const meta      = KIND_META[data.kind];
  const nodeH     = dynamicHeight(data.kind, data);
  const ports     = PORT_REGISTRY[data.kind];
  const isDynamic = data.kind === 'inverter' || data.kind === 'string-combiner';
  const mpptCount  = data.mpptCount  ?? 1;
  const inputCount = data.inputCount ?? 1;

  const domainKey = meta.domain as 'DC' | 'AC' | 'mixed';
  const symStroke = DOMAIN_STROKE[domainKey];
  const symFill   = DOMAIN_FILL[domainKey];

  // Annotation string: cable section or rating if set on node itself
  const annotation = [
    data.rating,
    data.powerW != null ? `${(data.powerW / 1000).toFixed(1)}kW` : null,
    data.phase === 'tri' ? '3Ø' : data.phase === 'mono' ? '1Ø' : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      style={{ width: NODE_W, height: nodeH, minHeight: HEADER_H }}
      className={`
        relative flex flex-col items-center rounded-sm border select-none
        bg-[#080f1a] transition-shadow duration-150
        ${meta.colorClass.replace(/bg-\S+/, '').replace(/text-\S+/, '')}
        border-slate-700/60
        ${selected ? 'ring-1 ring-sky-400 shadow-sky-500/20 shadow-xl border-sky-500/50' : ''}
      `}
    >
      {/* ── IEC Symbol ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center mt-2">
        <IECNodeSymbol
          kind={data.kind}
          size={SYM_SIZE}
          stroke={symStroke}
          fill={symFill}
          inputCount={inputCount}
          mpptCount={mpptCount}
        />
      </div>

      {/* ── Label ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-1 pb-1 mt-1 w-full">
        <span
          className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate w-full text-center leading-tight"
          title={data.label}
        >
          {data.label}
        </span>
        {annotation && (
          <span className="text-[7px] font-mono text-slate-600 truncate w-full text-center mt-0.5">
            {annotation}
          </span>
        )}
      </div>

      {/* ── Dynamic rows ─────────────────────────────────────────── */}
      {isDynamic && data.kind === 'inverter' && (
        <div className="flex flex-col w-full border-t border-slate-800/50">
          {Array.from({ length: mpptCount }, (_, i) => (
            <div key={i} style={{ height: ROW_H }}
              className="flex items-center justify-start px-2 border-b border-slate-800/30 last:border-none"
            >
              <span className="text-[7px] font-mono text-slate-700">MPPT {i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {isDynamic && data.kind === 'string-combiner' && (
        <div className="flex flex-col w-full border-t border-slate-800/50">
          {Array.from({ length: inputCount }, (_, i) => (
            <div key={i} style={{ height: ROW_H }}
              className="flex items-center justify-start px-2 border-b border-slate-800/30 last:border-none"
            >
              <span className="text-[7px] font-mono text-slate-700">S{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Static handles ───────────────────────────────────────── */}
      {ports.map(port => (
        <Handle
          key={port.id}
          id={port.id}
          type={port.id === 'out' || port.id === 'ac-out' ? 'source' : 'target'}
          position={SIDE_TO_POS[port.side]}
          isConnectable={isConnectable}
          style={{
            background: port.domain === 'DC' ? '#f59e0b' : '#60a5fa',
            border: `1.5px solid ${port.domain === 'DC' ? '#78350f' : '#1e3a5f'}`,
            width: 7, height: 7,
            ...(port.offsetPercent != null ? { top: `${port.offsetPercent}%` } : {}),
          }}
          className="!rounded-none"
        />
      ))}

      {/* ── Dynamic handles ──────────────────────────────────────── */}
      {data.kind === 'inverter'        && mpptHandles(mpptCount, nodeH)}
      {data.kind === 'string-combiner' && combinerInputHandles(inputCount, nodeH)}
    </div>
  );
}

export const UnifileNode = memo(UnifileNodeComponent);
