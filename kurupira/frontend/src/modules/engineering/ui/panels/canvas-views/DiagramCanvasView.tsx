import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTechStore, type InverterState, type MPPTConfig, type StringDef } from '../../../store/useTechStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { useUIStore } from '@/core/state/uiStore';
import { toArray } from '@/core/types/normalized.types';
import type { InverterCatalogItem, BlockDiagramFootprint } from '@/core/schemas/inverterSchema';
import { cn } from '@/lib/utils';
import { Cpu, Layers, Zap, X, ChevronRight, GitBranch, ZoomIn, ZoomOut, Maximize2, RotateCcw, Eraser, Download } from 'lucide-react';

// =============================================================================
// DIAGRAM CANVAS VIEW (LAYER 2) — Interactive CAD MVP
// =============================================================================
// Fully interactive diagram editor: draggable blocks, flexible ports,
// magnetic wire routing. Interaction feels like draw.io — intuitive but powerful.
// =============================================================================

// ─── 1. TYPES ────────────────────────────────────────────────────────────────

type Side = 'top' | 'right' | 'bottom' | 'left';
type Point = { x: number; y: number };
type PortType = 'string-out' | 'mppt-in' | 'ac-out' | 'ac-in';

interface FlexiblePort {
  id: string;
  side: Side;
  offset: number;   // 0..1 along the side
  type: PortType;
  mpptIndex?: number;
  label: string;
  color: string;
}

interface DiagramBlock {
  id: string;
  kind: 'inverter' | 'string' | 'ac-panel';
  w: number;
  h: number;
  ports: FlexiblePort[];
  label: string;
  subLabel?: string;
  meta?: any;
}

type BlockPositions = Record<string, Point>;

interface DiagramWire {
  id: string;
  fromBlockId: string;
  fromPortId: string;
  toBlockId: string;
  toPortId: string;
  color: string;
}

interface DraggingBlock {
  blockId: string;
  startMouse: Point;
  startPos: Point;
}

interface DraggingWire {
  fromBlockId: string;
  fromPortId: string;
  fromPos: Point;
  fromSide: Side;
  fromColor: string;
  livePos: Point;
  snapTarget: { blockId: string; portId: string; pos: Point; side: Side } | null;
}

// ─── 2. CONSTANTS ────────────────────────────────────────────────────────────

const MPPT_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#fb923c', '#a855f7'];
const SNAP_RADIUS = 28;
const VIEW_W = 800;
const VIEW_H = 600;
const BLOCK_STRING_W = 160;
const BLOCK_STRING_H = 48;
const BLOCK_INV_W = 160;
const BLOCK_AC_W = 96;
const BLOCK_AC_H = 48;
const GRID_SIZE = 24;

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

// ─── 3. HELPER FUNCTIONS ─────────────────────────────────────────────────────

function getPortWorldPos(block: DiagramBlock, blockPos: Point, port: FlexiblePort): Point {
  const { x, y } = blockPos;
  const { w, h } = block;
  switch (port.side) {
    case 'top':    return { x: x + port.offset * w, y };
    case 'bottom': return { x: x + port.offset * w, y: y + h };
    case 'left':   return { x, y: y + port.offset * h };
    case 'right':  return { x: x + w, y: y + port.offset * h };
  }
}

function areCompatible(a: PortType, b: PortType): boolean {
  return (a === 'string-out' && b === 'mppt-in') ||
         (a === 'mppt-in' && b === 'string-out') ||
         (a === 'ac-out' && b === 'ac-in') ||
         (a === 'ac-in' && b === 'ac-out');
}

function findNearestCompatiblePort(
  blocks: DiagramBlock[],
  blockPositions: BlockPositions,
  livePos: Point,
  fromBlockId: string,
  fromPortId: string
): { blockId: string; portId: string; pos: Point; side: Side } | null {
  const fromBlock = blocks.find(b => b.id === fromBlockId);
  if (!fromBlock) return null;
  const fromPort = fromBlock.ports.find(p => p.id === fromPortId);
  if (!fromPort) return null;

  let nearest: { blockId: string; portId: string; pos: Point; side: Side; dist: number } | null = null;

  for (const block of blocks) {
    if (block.id === fromBlockId) continue;
    const blockPos = blockPositions[block.id];
    if (!blockPos) continue;

    for (const port of block.ports) {
      if (!areCompatible(fromPort.type, port.type)) continue;
      const portPos = getPortWorldPos(block, blockPos, port);
      const dx = portPos.x - livePos.x;
      const dy = portPos.y - livePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= SNAP_RADIUS) {
        if (!nearest || dist < nearest.dist) {
          nearest = { blockId: block.id, portId: port.id, pos: portPos, side: port.side, dist };
        }
      }
    }
  }

  return nearest ? { blockId: nearest.blockId, portId: nearest.portId, pos: nearest.pos, side: nearest.side } : null;
}

function routeWire(fromPos: Point, fromSide: Side, toPos: Point, toSide: Side): string {
  const ax = fromPos.x;
  const ay = fromPos.y;
  const bx = toPos.x;
  const by = toPos.y;

  // right → left (horizontal split)
  if (fromSide === 'right' && toSide === 'left') {
    const midX = (ax + bx) / 2;
    return `M ${ax} ${ay} H ${midX} V ${by} H ${bx}`;
  }

  // right → bottom (exit right, go below, go to target X, go up)
  if (fromSide === 'right' && toSide === 'bottom') {
    const stubX = ax + 24;
    const dropY = by + 24;
    return `M ${ax} ${ay} H ${stubX} V ${dropY} H ${bx} V ${by}`;
  }

  // right → top (exit right, go above, go to target X, go down)
  if (fromSide === 'right' && toSide === 'top') {
    const stubX = ax + 24;
    const riseY = by - 24;
    return `M ${ax} ${ay} H ${stubX} V ${riseY} H ${bx} V ${by}`;
  }

  // bottom → left (exit bottom, go horizontally to target, go up)
  if (fromSide === 'bottom' && toSide === 'left') {
    return `M ${ax} ${ay} V ${by} H ${bx}`;
  }

  // bottom → top (vertical split)
  if (fromSide === 'bottom' && toSide === 'top') {
    const midY = (ay + by) / 2;
    return `M ${ax} ${ay} V ${midY} H ${bx} V ${by}`;
  }

  // right → right (sai à direita, contorna pelo lado mais extremo)
  if (fromSide === 'right' && toSide === 'right') {
    const stubX = Math.max(ax, bx) + 48;
    return `M ${ax} ${ay} H ${stubX} V ${by} H ${bx}`;
  }

  // left → left
  if (fromSide === 'left' && toSide === 'left') {
    const stubX = Math.min(ax, bx) - 48;
    return `M ${ax} ${ay} H ${stubX} V ${by} H ${bx}`;
  }

  // left → right
  if (fromSide === 'left' && toSide === 'right') {
    const midX = (ax + bx) / 2;
    return `M ${ax} ${ay} H ${midX} V ${by} H ${bx}`;
  }

  // top → bottom
  if (fromSide === 'top' && toSide === 'bottom') {
    const midY = (ay + by) / 2;
    return `M ${ax} ${ay} V ${midY} H ${bx} V ${by}`;
  }

  // Generic fallback: bezier
  const cx1 = fromSide === 'right' ? ax + 40 : fromSide === 'left' ? ax - 40 : ax;
  const cy1 = fromSide === 'bottom' ? ay + 40 : fromSide === 'top' ? ay - 40 : ay;
  const cx2 = toSide === 'right' ? bx + 40 : toSide === 'left' ? bx - 40 : bx;
  const cy2 = toSide === 'bottom' ? by + 40 : toSide === 'top' ? by - 40 : by;
  return `M ${ax} ${ay} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${bx} ${by}`;
}

function buildInitialLayout(
  inverter: InverterState,
  catalogItem: InverterCatalogItem | undefined,
  footprint: BlockDiagramFootprint | null
): { blocks: DiagramBlock[]; positions: BlockPositions; wires: DiagramWire[] } {
  const blocks: DiagramBlock[] = [];
  const positions: BlockPositions = {};
  const wires: DiagramWire[] = [];

  const mpptCount = inverter.mpptConfigs.length;

  // Count total strings
  let totalStrings = 0;
  inverter.mpptConfigs.forEach(mppt => {
    totalStrings += (mppt.strings || []).length;
  });

  // Calculate inverter height based on total port count
  const totalPortCount = footprint
    ? footprint.mpptChannels.reduce((s, ch) => s + ch.inputCount, 0)
    : mpptCount;
  const invH = Math.max(120, totalPortCount * 30 + 60);

  // Create inverter block with MPPT ports on bottom, AC port on right
  const inverterPorts: FlexiblePort[] = [];

  if (footprint && footprint.mpptChannels.length > 0) {
    // Distribuir portas a partir do footprint: respeita inputCount, inputLabels e ordem dos canais
    const totalPorts = footprint.mpptChannels.reduce((s, ch) => s + ch.inputCount, 0);
    let portGlobalIdx = 0;
    footprint.mpptChannels.forEach((ch, chIdx) => {
      const color = MPPT_COLORS[chIdx % MPPT_COLORS.length];
      for (let i = 0; i < ch.inputCount; i++) {
        portGlobalIdx++;
        inverterPorts.push({
          id: `mppt-${ch.mpptIndex}-in${i}`,
          side: 'bottom',
          offset: portGlobalIdx / (totalPorts + 1),
          type: 'mppt-in',
          mpptIndex: chIdx,
          label: ch.inputLabels?.[i] ?? `PV${i + 1}`,
          color,
        });
      }
    });
  } else {
    // Fallback: 1 porta por MPPT
    for (let i = 0; i < mpptCount; i++) {
      const mppt = inverter.mpptConfigs[i];
      inverterPorts.push({
        id: `mppt-${mppt.mpptId}-in0`,
        side: 'bottom',
        offset: (i + 1) / (mpptCount + 1),
        type: 'mppt-in',
        mpptIndex: i,
        label: `MPPT ${mppt.mpptId}`,
        color: MPPT_COLORS[i % MPPT_COLORS.length],
      });
    }
  }

  inverterPorts.push({
    id: 'ac-out',
    side: 'right',
    offset: 0.5,
    type: 'ac-out',
    label: footprint?.acOutput?.label ?? 'CA',
    color: '#10b981',
  });

  const inverterBlock: DiagramBlock = {
    id: 'inverter',
    kind: 'inverter',
    w: BLOCK_INV_W,
    h: invH,
    ports: inverterPorts,
    label: 'INVERSOR',
    subLabel: catalogItem?.model || inverter.snapshot.model,
    meta: { inverter, catalogItem, footprint },
  };
  blocks.push(inverterBlock);

  // Create string blocks (left side, stacked vertically)
  let currentY = 24;

  inverter.mpptConfigs.forEach((mppt, mpptIdx) => {
    const strings: StringDef[] = mppt.strings || [];
    if (strings.length === 0) return;

    // Determinar índice de cor e inputCount a partir do footprint
    const chIdx = footprint
      ? footprint.mpptChannels.findIndex(ch => ch.mpptIndex === mppt.mpptId)
      : mpptIdx;
    const colorIdx = chIdx >= 0 ? chIdx : mpptIdx;
    const channel = footprint?.mpptChannels[chIdx >= 0 ? chIdx : -1] ?? null;
    const inputCount = channel?.inputCount ?? 1;

    strings.forEach((str, strIdx) => {
      const mpptColor = MPPT_COLORS[colorIdx % MPPT_COLORS.length];
      // Mapeia cada string à entrada física — clampa se strings > inputCount
      const inputIdx = Math.min(strIdx, inputCount - 1);
      const toPortId = `mppt-${mppt.mpptId}-in${inputIdx}`;

      const stringBlock: DiagramBlock = {
        id: `string-${mppt.mpptId}-${str.id}`,
        kind: 'string',
        w: BLOCK_STRING_W,
        h: BLOCK_STRING_H,
        ports: [
          {
            id: 'out',
            side: 'right',
            offset: 0.5,
            type: 'string-out',
            label: str.name,
            color: mpptColor,
          },
        ],
        label: str.name,
        subLabel: `${str.modulesCount} módulos`,
        meta: { string: str, mpptId: mppt.mpptId, mppt, mpptColor },
      };
      blocks.push(stringBlock);
      positions[stringBlock.id] = { x: 80, y: currentY };

      wires.push({
        id: `wire-${stringBlock.id}`,
        fromBlockId: stringBlock.id,
        fromPortId: 'out',
        toBlockId: 'inverter',
        toPortId,
        color: mpptColor,
      });

      currentY += BLOCK_STRING_H + 12;
    });

    // Gap between MPPT groups
    currentY += 24;
  });

  // Center inverter vertically relative to strings
  const totalStringsHeight = currentY - 24;
  const invY = totalStringsHeight > invH ? (totalStringsHeight - invH) / 2 : 24;
  positions['inverter'] = { x: 380, y: invY };

  // Create AC panel block (right side, centered on inverter)
  const acPanelBlock: DiagramBlock = {
    id: 'ac-panel',
    kind: 'ac-panel',
    w: BLOCK_AC_W,
    h: BLOCK_AC_H,
    ports: [
      {
        id: 'in',
        side: 'left',
        offset: 0.5,
        type: 'ac-in',
        label: 'CA',
        color: '#10b981',
      },
    ],
    label: footprint?.acOutput.label || 'CA',
    subLabel: footprint?.acOutput.phase === 'tri' ? 'Trifásico' : 'Monofásico',
    meta: { footprint },
  };
  blocks.push(acPanelBlock);
  const acX = 380 + BLOCK_INV_W + 80;
  const acY = invY + invH / 2 - BLOCK_AC_H / 2;
  positions['ac-panel'] = { x: acX, y: acY };

  // Wire from inverter AC out to AC panel
  wires.push({
    id: 'wire-ac',
    fromBlockId: 'inverter',
    fromPortId: 'ac-out',
    toBlockId: 'ac-panel',
    toPortId: 'in',
    color: '#94a3b8',
  });

  return { blocks, positions, wires };
}

// ─── 4. SUB-COMPONENTS ───────────────────────────────────────────────────────

interface PortCircleProps {
  port: FlexiblePort;
  worldPos: Point;
  isSnapTarget: boolean;
  isOrigin?: boolean;
  alwaysShowLabel?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

const PortCircle: React.FC<PortCircleProps> = ({ port, worldPos, isSnapTarget, isOrigin = false, alwaysShowLabel = false, onPointerDown }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Label positioning based on side
  let labelDx = 0;
  let labelDy = 0;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  switch (port.side) {
    case 'left':
      labelDx = -12;
      textAnchor = 'end';
      break;
    case 'right':
      labelDx = 12;
      textAnchor = 'start';
      break;
    case 'top':
      labelDy = -12;
      break;
    case 'bottom':
      labelDy = 12;
      break;
  }

  return (
    <g>
      {/* Invisible hit circle */}
      <circle
        cx={worldPos.x}
        cy={worldPos.y}
        r={12}
        fill="transparent"
        style={{ cursor: 'crosshair' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={onPointerDown}
      />

      {/* Visual circle */}
      <circle
        cx={worldPos.x}
        cy={worldPos.y}
        r={isHovered || isOrigin ? 5 : 4}
        fill="#0f172a"
        stroke={isSnapTarget ? '#10b981' : isOrigin ? '#6366f1' : port.color}
        strokeWidth={isSnapTarget || isHovered || isOrigin ? 2.5 : 2}
        style={{ pointerEvents: 'none' }}
        className={cn((isSnapTarget || isOrigin) && 'animate-pulse')}
      />

      {/* Snap target ring */}
      {isSnapTarget && (
        <circle
          cx={worldPos.x}
          cy={worldPos.y}
          r={8}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          opacity={0.6}
          style={{ pointerEvents: 'none' }}
          className="animate-pulse"
        />
      )}

      {/* Label — sempre visível no inversor, on-hover nos demais */}
      {(isHovered || alwaysShowLabel) && (
        <text
          x={worldPos.x + labelDx}
          y={worldPos.y + labelDy}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fill={port.color}
          fontSize={8}
          fontWeight="bold"
          fontFamily="monospace"
          style={{ pointerEvents: 'none' }}
        >
          {port.label}
        </text>
      )}
    </g>
  );
};

interface BlockRendererProps {
  block: DiagramBlock;
  pos: Point;
  isSelected: boolean;
  isOverlapping?: boolean;
  snapTargetPortId: string | null;
  draggingWire: DraggingWire | null;
  onPointerDown: (e: React.PointerEvent) => void;
  onPortPointerDown: (e: React.PointerEvent, portId: string) => void;
  onClick: () => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  pos,
  isSelected,
  isOverlapping,
  snapTargetPortId,
  draggingWire,
  onPointerDown,
  onPortPointerDown,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const bgFill = isSelected ? '#1e1b4b' : isHovered ? '#1e293b' : '#0f172a';
  const borderStroke = isSelected ? '#6366f1' : isHovered ? '#4f46e5' : '#334155';
  const borderWidth = isSelected ? 2.5 : 1.5;

  return (
    <g>
      {/* Drop shadow */}
      <rect
        x={pos.x + 2}
        y={pos.y + 2}
        width={block.w}
        height={block.h}
        rx={6}
        fill="#000000"
        opacity={0.2}
        style={{ pointerEvents: 'none' }}
      />

      {/* Background (drag handle) */}
      <rect
        x={pos.x}
        y={pos.y}
        width={block.w}
        height={block.h}
        rx={6}
        fill={bgFill}
        stroke={borderStroke}
        strokeWidth={borderWidth}
        style={{ cursor: 'move' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={onPointerDown}
        onClick={onClick}
      />

      {/* Collision warning overlay */}
      {isOverlapping && (
        <rect
          x={pos.x + 1}
          y={pos.y + 1}
          width={block.w - 2}
          height={block.h - 2}
          rx={5}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          opacity={0.6}
          style={{ pointerEvents: 'none' }}
          className="animate-pulse"
        />
      )}

      {/* Selection indicator (left bar) */}
      {isSelected && (
        <rect
          x={pos.x}
          y={pos.y}
          width={3}
          height={block.h}
          rx={1.5}
          fill="#6366f1"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Block-specific rendering */}
      {block.kind === 'inverter' && (
        <>
          {/* IEC diagonal decoration */}
          <line
            x1={pos.x + 20}
            y1={pos.y + 20}
            x2={pos.x + block.w - 20}
            y2={pos.y + block.h - 20}
            stroke="#1e293b"
            strokeWidth={1}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={pos.x + 30}
            y={pos.y + 30}
            fill="#1e293b"
            fontSize={14}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            =
          </text>
          <text
            x={pos.x + block.w - 35}
            y={pos.y + block.h - 20}
            fill="#1e293b"
            fontSize={14}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            ~
          </text>

          {/* Center labels */}
          <text
            x={pos.x + block.w / 2}
            y={pos.y + block.h / 2 - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#475569"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.label}
          </text>
          <text
            x={pos.x + block.w / 2}
            y={pos.y + block.h / 2 + 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#334155"
            fontSize={8}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.subLabel}
          </text>

          {/* MPPT group brackets — visível apenas quando inputCount > 1 */}
          {(() => {
            // Agrupa portas mppt-in por mpptIndex
            const groups: Record<number, FlexiblePort[]> = {};
            block.ports
              .filter(p => p.type === 'mppt-in')
              .forEach(p => {
                const key = p.mpptIndex ?? 0;
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
              });

            return Object.values(groups)
              .filter(ports => ports.length > 1)
              .map((ports, i) => {
                const color = ports[0].color;
                const xs = ports.map(p => pos.x + p.offset * block.w);
                const x1 = Math.min(...xs) - 5;
                const x2 = Math.max(...xs) + 5;
                const bracketY = pos.y + block.h + 6;
                // Label: usa mpptIndex do primeiro port (base 1 para exibição)
                const mpptLabel = `MPPT ${(ports[0].mpptIndex ?? 0) + 1}`;
                return (
                  <g key={i} style={{ pointerEvents: 'none' }}>
                    <line x1={x1} y1={bracketY} x2={x2} y2={bracketY}
                      stroke={color} strokeWidth={1} opacity={0.5} />
                    <line x1={x1} y1={bracketY - 3} x2={x1} y2={bracketY}
                      stroke={color} strokeWidth={1} opacity={0.5} />
                    <line x1={x2} y1={bracketY - 3} x2={x2} y2={bracketY}
                      stroke={color} strokeWidth={1} opacity={0.5} />
                    <text
                      x={(x1 + x2) / 2} y={bracketY + 9}
                      textAnchor="middle"
                      fill={color} fontSize={6}
                      fontFamily="monospace" opacity={0.65}
                      fontWeight="bold"
                    >
                      {mpptLabel}
                    </text>
                  </g>
                );
              });
          })()}
        </>
      )}

      {block.kind === 'string' && (
        <>
          {/* Left accent bar */}
          <rect
            x={pos.x}
            y={pos.y}
            width={4}
            height={block.h}
            rx={2}
            fill={block.meta?.mpptColor || '#6366f1'}
            style={{ pointerEvents: 'none' }}
          />

          {/* Name */}
          <text
            x={pos.x + 12}
            y={pos.y + block.h / 2 - 6}
            fill="#e2e8f0"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.label}
          </text>

          {/* SubLabel */}
          <text
            x={pos.x + 12}
            y={pos.y + block.h / 2 + 8}
            fill="#64748b"
            fontSize={8}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.subLabel}
          </text>
        </>
      )}

      {block.kind === 'ac-panel' && (
        <>
          {/* Label */}
          <text
            x={pos.x + block.w / 2}
            y={pos.y + block.h / 2 - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#10b981"
            fontSize={9}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.label}
          </text>

          {/* SubLabel */}
          <text
            x={pos.x + block.w / 2}
            y={pos.y + block.h / 2 + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#475569"
            fontSize={7}
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.subLabel}
          </text>
        </>
      )}

      {/* Render ports */}
      {block.ports.map((port) => {
        const portPos = getPortWorldPos(block, pos, port);
        const isOrigin = draggingWire?.fromBlockId === block.id && draggingWire?.fromPortId === port.id;
        return (
          <PortCircle
            key={port.id}
            port={port}
            worldPos={portPos}
            isSnapTarget={snapTargetPortId === port.id}
            isOrigin={isOrigin}
            alwaysShowLabel={block.kind === 'inverter'}
            onPointerDown={(e) => {
              e.stopPropagation();
              onPortPointerDown(e, port.id);
            }}
          />
        );
      })}
    </g>
  );
};

interface WireRendererProps {
  wire: DiagramWire;
  blocks: DiagramBlock[];
  blockPositions: BlockPositions;
  isHighlighted?: boolean;
  onDelete: (id: string) => void;
}

const WireRenderer: React.FC<WireRendererProps> = ({ wire, blocks, blockPositions, isHighlighted = false, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const fromBlock = blocks.find(b => b.id === wire.fromBlockId);
  const toBlock = blocks.find(b => b.id === wire.toBlockId);
  if (!fromBlock || !toBlock) return null;

  const fromPos = blockPositions[wire.fromBlockId];
  const toPos = blockPositions[wire.toBlockId];
  if (!fromPos || !toPos) return null;

  const fromPort = fromBlock.ports.find(p => p.id === wire.fromPortId);
  const toPort = toBlock.ports.find(p => p.id === wire.toPortId);
  if (!fromPort || !toPort) return null;

  const fromWorldPos = getPortWorldPos(fromBlock, fromPos, fromPort);
  const toWorldPos = getPortWorldPos(toBlock, toPos, toPort);

  const path = routeWire(fromWorldPos, fromPort.side, toWorldPos, toPort.side);

  // Midpoint no primeiro segmento ortogonal real do caminho
  // Para right→left: M ax ay H midX → botão em (midX, ay)
  // Para bottom→left: M ax ay V by → botão em (ax, (ay+by)/2)
  // Fallback: centro geométrico
  const fromSide = fromPort.side;
  const toSide = toPort.side;
  let midX: number;
  let midY: number;
  if (fromSide === 'right' && toSide === 'left') {
    midX = (fromWorldPos.x + toWorldPos.x) / 2;
    midY = fromWorldPos.y;
  } else if (fromSide === 'bottom' && toSide === 'left') {
    midX = fromWorldPos.x;
    midY = (fromWorldPos.y + toWorldPos.y) / 2;
  } else if (fromSide === 'bottom' && toSide === 'top') {
    midX = (fromWorldPos.x + toWorldPos.x) / 2;
    midY = (fromWorldPos.y + toWorldPos.y) / 2;
  } else {
    midX = (fromWorldPos.x + toWorldPos.x) / 2;
    midY = (fromWorldPos.y + toWorldPos.y) / 2;
  }

  return (
    <g>
      {/* Invisible wide path for hover detection */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: 'pointer' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      />

      {/* Visible wire */}
      <path
        d={path}
        stroke={wire.color}
        strokeWidth={isHovered || isHighlighted ? 2.5 : 1.5}
        fill="none"
        opacity={isHovered || isHighlighted ? 1 : 0.7}
        className="transition-all duration-200"
        style={{ pointerEvents: 'none' }}
      />

      {/* Delete button on hover */}
      {isHovered && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onDelete(wire.id);
          }}
          style={{ cursor: 'pointer' }}
        >
          <circle
            cx={midX}
            cy={midY}
            r={8}
            fill="#ef4444"
            opacity={0.9}
          />
          <line
            x1={midX - 4}
            y1={midY - 4}
            x2={midX + 4}
            y2={midY + 4}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{ pointerEvents: 'none' }}
          />
          <line
            x1={midX + 4}
            y1={midY - 4}
            x2={midX - 4}
            y2={midY + 4}
            stroke="#ffffff"
            strokeWidth={1.5}
            style={{ pointerEvents: 'none' }}
          />
        </g>
      )}
    </g>
  );
};

interface RubberBandWireProps {
  from: Point;
  fromSide: Side;
  to: Point;
  toSide?: Side;  // lado do snap target; undefined quando flutuando
  color: string;
  hasSnap: boolean;
}

const RubberBandWire: React.FC<RubberBandWireProps> = ({ from, fromSide, to, toSide, color, hasSnap }) => {
  // Quando flutuando (sem snap), estima o lado oposto como destino plausível
  const effectiveToSide: Side = toSide ?? (
    fromSide === 'right'  ? 'left' :
    fromSide === 'left'   ? 'right' :
    fromSide === 'bottom' ? 'top'   : 'bottom'
  );
  const path = routeWire(from, fromSide, to, effectiveToSide);

  return (
    <g style={{ pointerEvents: 'none' }}>
      <path
        d={path}
        stroke={hasSnap ? '#10b981' : color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={hasSnap ? undefined : '4 2'}
        opacity={0.8}
      />
      <circle
        cx={to.x}
        cy={to.y}
        r={4}
        fill={hasSnap ? '#10b981' : color}
      />
    </g>
  );
};

interface ZoomControlsProps {
  zoom: number;
  panelOpen?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExport?: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, panelOpen, onZoomIn, onZoomOut, onFit, onExport }) => {
  return (
    <div className={`absolute bottom-6 flex flex-col gap-2 z-20 transition-all duration-300 ${panelOpen ? 'right-[296px]' : 'right-6'}`}>
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded hover:bg-slate-800 transition-colors"
          title="Exportar SVG"
        >
          <Download className="h-4 w-4 text-slate-400" />
        </button>
      )}
      <button
        onClick={onZoomIn}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded hover:bg-slate-800 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4 text-slate-400" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded hover:bg-slate-800 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4 text-slate-400" />
      </button>
      <button
        onClick={onFit}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded hover:bg-slate-800 transition-colors"
        title="Fit to View"
      >
        <Maximize2 className="h-4 w-4 text-slate-400" />
      </button>
      <span className="text-[7px] text-slate-700 font-mono tabular-nums mt-0.5">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
};

interface StringDetailPanelProps {
  stringData: StringDef;
  mpptId: number;
  onClose: () => void;
}

const StringDetailPanel: React.FC<StringDetailPanelProps> = ({ stringData, mpptId, onClose }) => {
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);

  return (
    <div
      className="absolute top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Detalhes da String</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-600 uppercase font-bold">Identificação</span>
          </div>
          <div className="text-sm font-mono text-slate-300 font-bold">{stringData.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">MPPT</div>
            <div className="text-lg font-mono text-indigo-400 font-bold">{mpptId}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Módulos</div>
            <div className="text-lg font-mono text-emerald-400 font-bold">{stringData.modulesCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="text-[9px] text-slate-600 uppercase font-bold">Cabeamento</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500">Seção:</span>
            <span className="text-sm font-mono text-slate-300 font-bold">{stringData.cableSection} mm²</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500">Comprimento:</span>
            <span className="text-sm font-mono text-slate-300 font-bold">{stringData.cableLength} m</span>
          </div>
        </div>

        {(stringData.azimuth !== undefined || stringData.inclination !== undefined) && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="text-[9px] text-slate-600 uppercase font-bold">Orientação</div>
            {stringData.azimuth !== undefined && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500">Azimute:</span>
                <span className="text-sm font-mono text-slate-300 font-bold">{stringData.azimuth}°</span>
              </div>
            )}
            {stringData.inclination !== undefined && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500">Inclinação:</span>
                <span className="text-sm font-mono text-slate-300 font-bold">{stringData.inclination}°</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            setCanvasViewMode('CONTEXT');
            onClose();
          }}
          className="w-full px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-md flex items-center justify-center gap-2 transition-colors group"
        >
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Ver no Arranjo</span>
          <ChevronRight className="h-3 w-3 text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

interface InverterDetailPanelProps {
  block: DiagramBlock;
  catalogItem: InverterCatalogItem | undefined;
  footprint: BlockDiagramFootprint | null;
  onClose: () => void;
}

const InverterDetailPanel: React.FC<InverterDetailPanelProps> = ({ block, catalogItem, footprint, onClose }) => {
  const totalInputs = footprint?.mpptChannels.reduce((s, ch) => s + ch.inputCount, 0) ?? 0;

  return (
    <div className="absolute top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Inversor</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Identificação */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="text-[9px] text-slate-600 uppercase font-bold">Modelo</div>
          <div className="text-sm font-mono text-slate-200 font-bold">
            {catalogItem?.model ?? block.subLabel ?? '—'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {catalogItem?.manufacturer ?? ''}
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Potência</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">
              {catalogItem?.nominalPowerW
                ? `${(catalogItem.nominalPowerW / 1000).toFixed(1)} kW`
                : '—'}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">MPPTs</div>
            <div className="text-sm font-mono text-sky-400 font-bold">
              {footprint?.mpptChannels.length ?? catalogItem?.mppts?.length ?? '—'}
            </div>
          </div>
        </div>

        {/* Footprint */}
        {footprint && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="text-[9px] text-slate-600 uppercase font-bold">Hardware Footprint</div>
            {footprint.mpptChannels.map(ch => (
              <div key={ch.mpptIndex} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  MPPT {ch.mpptIndex}
                </span>
                <span className="text-[10px] font-mono text-sky-300 font-bold">
                  {ch.inputCount}× {ch.inputLabels?.join(' / ') ?? `E1…E${ch.inputCount}`}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
              <span className="text-[10px] font-mono text-slate-400">Saída CA</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {footprint.acOutput.label} ({footprint.acOutput.phase === 'tri' ? '3φ' : '1φ'})
              </span>
            </div>
          </div>
        )}

        {/* Entradas totais */}
        {totalInputs > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Total de Entradas CC</div>
            <div className="text-lg font-mono text-indigo-400 font-bold">{totalInputs}</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ACPanelDetailPanelProps {
  block: DiagramBlock;
  onClose: () => void;
}

const ACPanelDetailPanel: React.FC<ACPanelDetailPanelProps> = ({ block, onClose }) => {
  const footprint = block.meta?.footprint as BlockDiagramFootprint | null;
  const phase = footprint?.acOutput?.phase;
  const label = footprint?.acOutput?.label;

  return (
    <div className="absolute top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Saída CA</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Rótulo</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">{label ?? block.label}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Fase</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">
              {phase === 'tri' ? '3φ — Trifásico' : phase === 'mono' ? '1φ — Monofásico' : block.subLabel ?? '—'}
            </div>
          </div>
        </div>
        {footprint && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="text-[9px] text-slate-600 uppercase font-bold">Ponto de Conexão</div>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              Saída CA do inversor conectada ao barramento {label ?? 'CA'}.
              {phase === 'tri' ? ' Sistema trifásico (L1, L2, L3 + N + PE).' : ' Sistema monofásico (L + N + PE).'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── 5. HOOKS ────────────────────────────────────────────────────────────────

function useDiagramData() {
  const invertersNorm = useTechStore((state: any) => state.inverters);
  const { inverters: catalog } = useCatalogStore();
  const techInverters = useMemo(() => toArray<InverterState>(invertersNorm), [invertersNorm]);

  return { techInverters, catalog };
}

// ─── 6. MAIN COMPONENT ───────────────────────────────────────────────────────

export const DiagramCanvasView: React.FC = () => {
  const { techInverters, catalog } = useDiagramData();
  const [activeInverterIdx, setActiveInverterIdx] = useState(0);

  // 1. Refs (stable, não causam re-render)
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: -40, y: -40 });
  const contentBoundsRef = useRef({ w: 800, h: 600 });

  // 2. Zoom e pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: -40, y: -40 });

  // 3. Todos os estados de dados (declarados ANTES de serem usados)
  const [blockPositions, setBlockPositions] = useState<BlockPositions>({});
  const [wires, setWires] = useState<DiagramWire[]>([]);
  const [wireHistory, setWireHistory] = useState<DiagramWire[][]>([]);
  const [wireRedoStack, setWireRedoStack] = useState<DiagramWire[][]>([]);
  const [wireDropFeedback, setWireDropFeedback] = useState<{ x: number; y: number } | null>(null);

  // 4. Estados de drag e pan
  const draggingBlock = useRef<DraggingBlock | null>(null);
  const [draggingWire, setDraggingWire] = useState<DraggingWire | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const isPanning = useRef(false);
  const lastPt = useRef<Point>({ x: 0, y: 0 });
  const [isPanningState, setIsPanningState] = useState(false);

  // 5. Selected block state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // 6. Refs para keyboard handlers (usados no useEffect de keyboard)
  const wiresRef = useRef<DiagramWire[]>(wires);
  const selectedBlockIdRef = useRef<string | null>(null);

  // 7. Sync wiresRef com wires state
  useEffect(() => {
    wiresRef.current = wires;
  }, [wires]);

  // 8. Sync selectedBlockIdRef com selectedBlockId state
  useEffect(() => {
    selectedBlockIdRef.current = selectedBlockId;
  }, [selectedBlockId]);

  // 9. Sync zoomRef e panRef (usados no wheel handler não-passivo)
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // 10. Derivados de store (activeInverter, catalogItem, footprint)
  const activeInverter = techInverters[activeInverterIdx];
  const catalogItem = useMemo(
    () => catalog.find((c: InverterCatalogItem) => c.id === activeInverter?.catalogId),
    [catalog, activeInverter]
  );
  const footprint = catalogItem?.blockDiagramFootprint || null;

  // 11. blocks useMemo (depende de activeInverter, catalogItem, footprint)
  const blocks = useMemo(() => {
    if (!activeInverter) return [];
    return buildInitialLayout(activeInverter, catalogItem, footprint).blocks;
  // footprint é derivado de catalogItem, mas incluído explicitamente para rebuild ao mudar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInverter?.id, catalogItem?.id, footprint]);

  // 12. contentBounds useMemo (depende de blocks e blockPositions)
  const contentBounds = useMemo(() => {
    if (Object.keys(blockPositions).length === 0) return { w: 800, h: 600 };
    let maxX = 0, maxY = 0;
    blocks.forEach(block => {
      const pos = blockPositions[block.id];
      if (pos) {
        maxX = Math.max(maxX, pos.x + block.w);
        maxY = Math.max(maxY, pos.y + block.h);
      }
    });
    return { w: Math.max(800, maxX + 120), h: Math.max(600, maxY + 120) };
  }, [blocks, blockPositions]);

  // BUG-21: Sincroniza contentBoundsRef após useMemo (não dentro dele)
  useEffect(() => {
    contentBoundsRef.current = contentBounds;
  }, [contentBounds]);

  // 13. Callbacks (toSvgPt, etc.)
  const toSvgPt = useCallback((e: { clientX: number; clientY: number }): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = pt.matrixTransform(ctm.inverse());
    return { x: inv.x, y: inv.y };
  }, []);

  // Handle SVG pointer move
  const handleSvgPointerMove = useCallback((e: React.PointerEvent) => {
    const svgPt = toSvgPt(e);

    // Block drag
    if (draggingBlock.current) {
      const dx = svgPt.x - draggingBlock.current.startMouse.x;
      const dy = svgPt.y - draggingBlock.current.startMouse.y;
      const newX = snapToGrid(draggingBlock.current.startPos.x + dx);
      const newY = snapToGrid(draggingBlock.current.startPos.y + dy);
      const clampedX = Math.max(0, newX);
      const clampedY = Math.max(0, newY);
      setBlockPositions(prev => ({
        ...prev,
        [draggingBlock.current!.blockId]: { x: clampedX, y: clampedY },
      }));
    }

    // Wire drag
    if (draggingWire) {
      const snapTarget = findNearestCompatiblePort(
        blocks,
        blockPositions,
        svgPt,
        draggingWire.fromBlockId,
        draggingWire.fromPortId
      );
      setDraggingWire(prev => prev ? { ...prev, livePos: svgPt, snapTarget } : null);
    }
  }, [toSvgPt, blocks, blockPositions, draggingWire]);

  // Handle SVG pointer up
  const handleSvgPointerUp = useCallback(() => {
    // Clear block drag
    if (draggingBlock.current) {
      draggingBlock.current = null;
      setIsDraggingBlock(false);
    }

    // Complete wire drag
    if (draggingWire && draggingWire.snapTarget) {
      const { fromBlockId, fromPortId } = draggingWire;
      const { blockId: toBlockId, portId: toPortId } = draggingWire.snapTarget;

      // Check for duplicates
      const isDuplicate = wires.some(
        w =>
          (w.fromBlockId === fromBlockId && w.fromPortId === fromPortId && w.toBlockId === toBlockId && w.toPortId === toPortId) ||
          (w.fromBlockId === toBlockId && w.fromPortId === toPortId && w.toBlockId === fromBlockId && w.toPortId === fromPortId)
      );

      // L2-I1: Check if port is already used
      const portAlreadyUsed = wires.some(
        w =>
          (w.fromBlockId === fromBlockId && w.fromPortId === fromPortId) ||
          (w.toBlockId === toBlockId && w.toPortId === toPortId) ||
          (w.fromBlockId === toBlockId && w.fromPortId === toPortId) ||
          (w.toBlockId === fromBlockId && w.toPortId === fromPortId)
      );

      if (!isDuplicate && !portAlreadyUsed) {
        setWireHistory(prev => [...prev.slice(-15), wires]);
        setWireRedoStack([]); // clear redo on new action
        const newWire: DiagramWire = {
          id: `wire-${Date.now()}`,
          fromBlockId,
          fromPortId,
          toBlockId,
          toPortId,
          color: draggingWire.fromColor,
        };
        setWires(prev => [...prev, newWire]);
      }

      setDraggingWire(null);
    } else if (draggingWire) {
      // Show "no snap" feedback flash at the drop position
      setWireDropFeedback({ x: draggingWire.livePos.x, y: draggingWire.livePos.y });
      setTimeout(() => setWireDropFeedback(null), 600);
      setDraggingWire(null);
    }

    // Clear pan state
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningState(false);
    }
  }, [draggingWire, wires]);

  // Handle block pointer down
  const handleBlockPointerDown = useCallback((e: React.PointerEvent, blockId: string) => {
    e.stopPropagation();
    const svgPt = toSvgPt(e);
    const currentPos = blockPositions[blockId];
    if (!currentPos) return;

    draggingBlock.current = {
      blockId,
      startMouse: svgPt,
      startPos: currentPos,
    };
    setIsDraggingBlock(true);
  }, [toSvgPt, blockPositions]);

  // Handle port pointer down
  const handlePortPointerDown = useCallback((e: React.PointerEvent, blockId: string, portId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const port = block.ports.find(p => p.id === portId);
    if (!port) return;
    const blockPos = blockPositions[blockId];
    if (!blockPos) return;

    const fromPos = getPortWorldPos(block, blockPos, port);

    setDraggingWire({
      fromBlockId: blockId,
      fromPortId: portId,
      fromPos,
      fromSide: port.side,
      fromColor: port.color,
      livePos: fromPos,
      snapTarget: null,
    });
  }, [blocks, blockPositions]);

  // Background pan handlers
  const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    isPanning.current = true;
    setIsPanningState(true);
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleBgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;

    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cz = zoomRef.current;
    const { w: cbW, h: cbH } = contentBoundsRef.current;
    const scaleX = (cbW / cz) / rect.width;
    const scaleY = (cbH / cz) / rect.height;

    setPan(prev => ({
      x: prev.x - dx * scaleX,
      y: prev.y - dy * scaleY,
    }));
  }, []);

  const handleBgPointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningState(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // 14. Zoom controls (handleFit, handleZoomIn, handleZoomOut)
  const handleFit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) { setZoom(1); setPan({ x: -20, y: -20 }); return; }
    const rect = svg.getBoundingClientRect();
    const { w, h } = contentBoundsRef.current;
    const fitZoom = Math.min(rect.width / w, rect.height / h) * 0.9;
    const vbW = w / fitZoom;
    const vbH = h / fitZoom;
    // Centraliza: pan negativo de metade do espaço extra além do conteúdo
    setPan({ x: -((vbW - w) / 2), y: -((vbH - h) / 2) });
    setZoom(fitZoom);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.3, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.3, 0.3));
  }, []);

  // 15. useEffect de reset de layout (agora handleFit está declarado)
  // Reset positions and wires on inverter change
  useEffect(() => {
    if (!activeInverter) return;
    const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
    setBlockPositions(layout.positions);
    setWires(layout.wires);
    setWireHistory([]);
    setWireRedoStack([]);
    setSelectedBlockId(null);
    setDraggingWire(null);
    draggingBlock.current = null;
    setIsDraggingBlock(false);
    // L2-C5: Auto-fit after layout change
    // BUG-04: handleFit agora incluído nas deps
    const timer = setTimeout(() => handleFit(), 120);
    return () => clearTimeout(timer);
  // catalogItem?.id cobre mudanças de footprint que alteram port IDs
  }, [activeInverter?.id, catalogItem?.id, handleFit, catalogItem, footprint]);

  // 16. useEffect de wheel (não-passivo)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cz = zoomRef.current;
      const cp = panRef.current;

      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.3, Math.min(5, cz * factor));

      const rect = svg.getBoundingClientRect();
      const { w: cbW, h: cbH } = contentBoundsRef.current;

      // Current viewBox dimensions
      const vbW = cbW / cz;
      const vbH = cbH / cz;
      // Cursor position in SVG coordinate space
      const curX = cp.x + (e.clientX - rect.left) / rect.width  * vbW;
      const curY = cp.y + (e.clientY - rect.top)  / rect.height * vbH;
      // New viewBox dimensions
      const vbWn = cbW / newZoom;
      const vbHn = cbH / newZoom;

      setZoom(newZoom);
      setPan({
        x: curX - (e.clientX - rect.left) / rect.width  * vbWn,
        y: curY - (e.clientY - rect.top)  / rect.height * vbHn,
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  // 17. useEffect de auto-fit on mount
  useEffect(() => {
    const timer = setTimeout(() => handleFit(), 80);
    return () => clearTimeout(timer);
  }, [handleFit]);

  // 18. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: deselect block and cancel wire drag
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        setDraggingWire(null);
      }

      // L2-C2: Ctrl+Z / Cmd+Z: undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        setWireHistory(prev => {
          if (prev.length === 0) return prev;
          const lastState = prev[prev.length - 1];
          setWireRedoStack(r => [...r.slice(-15), wiresRef.current]); // current → redo
          setWires(lastState);
          return prev.slice(0, -1);
        });
      }

      // L2-C2: Ctrl+Y or Ctrl+Shift+Z: redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        setWireRedoStack(prev => {
          if (prev.length === 0) return prev;
          const nextState = prev[prev.length - 1];
          setWireHistory(h => [...h.slice(-15), wiresRef.current]); // current → history
          setWires(nextState);
          return prev.slice(0, -1);
        });
      }

      // L2-C4: Delete/Backspace: remove wires connected to selected block
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockIdRef.current) {
          const blockId = selectedBlockIdRef.current;
          const connected = wiresRef.current.filter(
            w => w.fromBlockId === blockId || w.toBlockId === blockId
          );
          if (connected.length > 0) {
            setWireHistory(prev => [...prev.slice(-15), wiresRef.current]);
            setWireRedoStack([]);
            setWires(prev => prev.filter(w => w.fromBlockId !== blockId && w.toBlockId !== blockId));
          }
        }
      }

      // L2-I2: Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(z * 1.3, 5));
      }
      if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z / 1.3, 0.3));
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable: setters are stable refs, use refs for reading state

  // SVG cursor
  const svgCursor = draggingWire ? 'crosshair' : isDraggingBlock ? 'move' : isPanningState ? 'grabbing' : 'grab';

  // Selected node for detail panel
  const selectedNode = useMemo(() => {
    const block = blocks.find(b => b.id === selectedBlockId);
    return block || null;
  }, [blocks, selectedBlockId]);

  // L2-I4: Highlighted wires for selected block
  const selectedBlockWireIds = useMemo(() => {
    if (!selectedBlockId) return new Set<string>();
    return new Set(wires.filter(w => w.fromBlockId === selectedBlockId || w.toBlockId === selectedBlockId).map(w => w.id));
  }, [selectedBlockId, wires]);

  // Overlapping blocks detection
  const overlappingBlockIds = useMemo(() => {
    const ids = new Set<string>();
    const positioned = blocks.filter(b => blockPositions[b.id]);
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        const ap = blockPositions[a.id];
        const bp = blockPositions[b.id];
        // AABB overlap test with 4px tolerance
        const overlaps =
          ap.x < bp.x + b.w - 4 && ap.x + a.w - 4 > bp.x &&
          ap.y < bp.y + b.h - 4 && ap.y + a.h - 4 > bp.y;
        if (overlaps) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [blocks, blockPositions]);

  // Reset Layout handler
  const handleResetLayout = useCallback(() => {
    if (!activeInverter) return;
    const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
    // L2-C3: Save current state before resetting
    setWireHistory(prev => [...prev.slice(-15), wiresRef.current]);
    setWireRedoStack([]); // clear redo
    setBlockPositions(layout.positions);
    setWires(layout.wires);
    setSelectedBlockId(null);
    setDraggingWire(null);
    draggingBlock.current = null;
    setIsDraggingBlock(false);
  }, [activeInverter, catalogItem, footprint]);

  // Clear Manual Wires handler
  const handleClearManualWires = useCallback(() => {
    if (!activeInverter) return;
    const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
    setWireHistory(prev => [...prev.slice(-15), wires]);
    setWireRedoStack([]); // L2-I3: clear redo stack
    setWires(layout.wires);
  }, [activeInverter, catalogItem, footprint, wires]);

  // SVG export handler
  const handleExport = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { w, h } = contentBoundsRef.current;
    // Clone SVG and set full-content viewBox for export
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    // Add dark background as first child
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
    bg.setAttribute('fill', '#020617');
    clone.insertBefore(bg, clone.firstChild);
    // Serialize and trigger download
    const svgStr = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagrama-blocos-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []); // contentBoundsRef is a ref, always current

  // Empty state
  if (techInverters.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
        <Cpu size={48} className="text-slate-800 mb-4" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest text-center">
          Nenhum inversor configurado
        </p>
        <p className="text-slate-700 text-[10px] mt-2 uppercase tracking-tighter">
          Configure strings na aba de Engenharia
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#020617] relative flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers className="h-4 w-4" /> Layer 2 — Diagrama de Blocos
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                CAD Interativo — Blocos Arrastáveis e Conexões Magnéticas
              </span>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 border border-slate-800 rounded-md">
                <div className={`w-1.5 h-1.5 rounded-full ${draggingWire ? 'bg-amber-400' : isDraggingBlock ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-600">
                  {draggingWire ? 'Conectando' : isDraggingBlock ? 'Movendo' : 'Selecionar'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              title="Exportar diagrama SVG"
              className="p-1.5 rounded border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleClearManualWires}
              title="Restaurar conexões automáticas"
              className="p-1.5 rounded border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetLayout}
              title="Resetar layout"
              className="p-1.5 rounded border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-slate-600 text-[8px] font-bold uppercase">Inversor Ativo</span>
              <span className="text-slate-300 font-mono text-[10px] font-bold uppercase">
                {catalogItem?.manufacturer} {catalogItem?.model}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-inverter tabs */}
        {techInverters.length > 1 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            {techInverters.map((inv, idx) => {
              const invCatalog = catalog.find((c: InverterCatalogItem) => c.id === inv.catalogId);
              return (
                <button
                  key={inv.id}
                  onClick={() => {
                    setActiveInverterIdx(idx);
                    setSelectedBlockId(null);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-widest transition-colors',
                    idx === activeInverterIdx
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                  )}
                >
                  INV {idx + 1} - {invCatalog?.model || inv.snapshot.model}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Canvas SVG */}
      <div className="flex-1 relative z-10">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${pan.x} ${pan.y} ${contentBounds.w / zoom} ${contentBounds.h / zoom}`}
          style={{ cursor: svgCursor, display: 'block' }}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          {/* Background (pan capture) */}
          <rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill="transparent"
            onPointerDown={handleBgPointerDown}
            onPointerMove={handleBgPointerMove}
            onPointerUp={handleBgPointerUp}
            onPointerCancel={handleBgPointerUp}
          />

          {/* Dot grid */}
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="#1e293b" />
            </pattern>
          </defs>
          <rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill="url(#dot-grid)"
            opacity={0.4}
            style={{ pointerEvents: 'none' }}
          />

          {/* Wire layer (below blocks) */}
          {wires.map(wire => (
            <WireRenderer
              key={wire.id}
              wire={wire}
              blocks={blocks}
              blockPositions={blockPositions}
              isHighlighted={selectedBlockWireIds.has(wire.id)}
              onDelete={(id) => {
                setWireHistory(prev => [...prev.slice(-15), wires]);
                setWireRedoStack([]); // clear redo on delete
                setWires(prev => prev.filter(w => w.id !== id));
              }}
            />
          ))}

          {/* Rubber band wire */}
          {draggingWire && (
            <RubberBandWire
              from={draggingWire.fromPos}
              fromSide={draggingWire.fromSide}
              to={draggingWire.snapTarget?.pos || draggingWire.livePos}
              toSide={draggingWire.snapTarget?.side}
              color={draggingWire.fromColor}
              hasSnap={draggingWire.snapTarget !== null}
            />
          )}

          {/* Wire drop feedback flash */}
          {wireDropFeedback && (
            <g style={{ pointerEvents: 'none' }}>
              <circle cx={wireDropFeedback.x} cy={wireDropFeedback.y} r={10}
                fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.8}
                className="animate-ping"
              />
              <line x1={wireDropFeedback.x - 5} y1={wireDropFeedback.y - 5}
                    x2={wireDropFeedback.x + 5} y2={wireDropFeedback.y + 5}
                stroke="#ef4444" strokeWidth={2} />
              <line x1={wireDropFeedback.x + 5} y1={wireDropFeedback.y - 5}
                    x2={wireDropFeedback.x - 5} y2={wireDropFeedback.y + 5}
                stroke="#ef4444" strokeWidth={2} />
            </g>
          )}

          {/* Block layer */}
          {blocks.map(block => {
            const pos = blockPositions[block.id];
            if (!pos) return null;
            const snapTargetPortId = draggingWire?.snapTarget?.blockId === block.id
              ? draggingWire.snapTarget.portId : null;
            return (
              <BlockRenderer
                key={block.id}
                block={block}
                pos={pos}
                isSelected={selectedBlockId === block.id}
                isOverlapping={overlappingBlockIds.has(block.id)}
                snapTargetPortId={snapTargetPortId}
                draggingWire={draggingWire}
                onPointerDown={(e) => handleBlockPointerDown(e, block.id)}
                onPortPointerDown={(e, portId) => handlePortPointerDown(e, block.id, portId)}
                onClick={() => setSelectedBlockId(prev => prev === block.id ? null : block.id)}
              />
            );
          })}
        </svg>
      </div>

      {/* Zoom Controls */}
      <ZoomControls zoom={zoom} panelOpen={selectedNode !== null} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFit={handleFit} onExport={handleExport} />

      {/* Footer: Legenda */}
      <div className="z-10 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-3">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
              Fios CC — ver legenda →
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
              Saída CA (AC)
            </span>
          </div>
          <div className="flex items-center gap-3 justify-end flex-wrap">
            {(() => {
              const inverterBlock = blocks.find(b => b.kind === 'inverter');
              if (!inverterBlock) return null;
              const mpptColors: { index: number; color: string }[] = [];
              inverterBlock.ports
                .filter(p => p.type === 'mppt-in')
                .forEach(p => {
                  if (p.mpptIndex !== undefined && !mpptColors.some(m => m.index === p.mpptIndex)) {
                    mpptColors.push({ index: p.mpptIndex, color: p.color });
                  }
                });
              return mpptColors.map(({ index, color }) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>
                    M{index + 1}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Detail Panel — String */}
      {selectedNode && selectedNode.kind === 'string' && (
        <StringDetailPanel
          stringData={selectedNode.meta.string}
          mpptId={selectedNode.meta.mpptId}
          onClose={() => setSelectedBlockId(null)}
        />
      )}

      {/* Detail Panel — Inversor */}
      {selectedNode && selectedNode.kind === 'inverter' && (
        <InverterDetailPanel
          block={selectedNode}
          catalogItem={catalogItem}
          footprint={footprint}
          onClose={() => setSelectedBlockId(null)}
        />
      )}

      {/* Detail Panel — Saída CA */}
      {selectedNode && selectedNode.kind === 'ac-panel' && (
        <ACPanelDetailPanel
          block={selectedNode}
          onClose={() => setSelectedBlockId(null)}
        />
      )}
    </div>
  );
};
