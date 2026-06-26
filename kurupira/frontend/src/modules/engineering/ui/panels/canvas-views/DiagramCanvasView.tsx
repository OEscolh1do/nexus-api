import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTechStore, type InverterState, type StringDef } from '../../../store/useTechStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { useUIStore } from '@/core/state/uiStore';
import { useDiagramStore } from '../../../store/useDiagramStore';
import { useInverterUIStore } from '../../../store/useInverterUIStore';
import { toArray } from '@/core/types/normalized.types';
import type { InverterCatalogItem, BlockDiagramFootprint } from '@/core/schemas/inverterSchema';
import { cn } from '@/lib/utils';
import { Cpu, Layers, Zap, X, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCcw, Eraser, Download, MapPin, Wand2, Copy, Image as ImageIcon, Lock, Unlock, LayoutGrid, Save, Upload, History, AlertTriangle } from 'lucide-react';
import {
  type Side, type Point, type PortType,
  type FlexiblePort, type DiagramBlock, type BlockPositions, type DiagramWire,
  SNAP_RADIUS, VIEW_W, VIEW_H, GRID_SIZE, MPPT_COLORS,
  buildInitialLayout,
} from './diagramLayout';

// =============================================================================
// DIAGRAM CANVAS VIEW (LAYER 2) — Interactive CAD MVP
// =============================================================================
// Fully interactive diagram editor: draggable blocks, flexible ports,
// magnetic wire routing. Interaction feels like draw.io — intuitive but powerful.
// Types, constants and buildInitialLayout live in ./diagramLayout.ts
// =============================================================================

// ─── 1. LOCAL INTERACTION TYPES ──────────────────────────────────────────────

interface DraggingBlock {
  blockId: string;
  startMouse: Point;
  startPos: Point;
}

// BUG SWEEP 12 AREA 1: Define HistoryEntry type for undo/redo system
interface HistoryEntry {
  wires: DiagramWire[];
  positions: BlockPositions;
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

// BUG SWEEP 10 AREA 6: Extend snapshot to include wireLabels and blockNotes
interface DiagramSnapshot {
  id: string;
  name: string;
  timestamp: number;
  positions: BlockPositions;
  wires: DiagramWire[];
  wireLabels?: Record<string, string>;
  blockNotes?: Record<string, string>;
}

// ─── 2. LOCAL HELPERS ────────────────────────────────────────────────────────

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

// B: Voltage drop calculation (copper conductor, 80°C)
const RHO_CU_80 = 0.02267; // Ω·mm²/m at 80°C
function calcVoltageDrop(cableLength: number, cableSection: number, isc: number): number {
  if (cableSection <= 0 || cableLength <= 0) return 0;
  return RHO_CU_80 * 2 * cableLength * isc / cableSection;
}
// Suggest minimum standard section for ΔV ≤ threshold
const STD_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25];
function suggestCableSection(cableLength: number, isc: number, vDropMax: number): number {
  const sMin = RHO_CU_80 * 2 * cableLength * isc / Math.max(vDropMax, 0.01);
  return STD_SECTIONS.find(s => s >= sMin) ?? STD_SECTIONS[STD_SECTIONS.length - 1];
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

// BUG SWEEP 10 AREA 4: Add lockedBlockIds parameter to prevent snapping to locked blocks
function findNearestCompatiblePort(
  blocks: DiagramBlock[],
  blockPositions: BlockPositions,
  livePos: Point,
  fromBlockId: string,
  fromPortId: string,
  lockedBlockIds?: Set<string>
): { blockId: string; portId: string; pos: Point; side: Side } | null {
  const fromBlock = blocks.find(b => b.id === fromBlockId);
  if (!fromBlock) return null;
  const fromPort = fromBlock.ports.find(p => p.id === fromPortId);
  if (!fromPort) return null;

  let nearest: { blockId: string; portId: string; pos: Point; side: Side; dist: number } | null = null;

  for (const block of blocks) {
    if (block.id === fromBlockId) continue;
    // BUG SWEEP 10 AREA 4: Skip locked blocks during wire snap
    if (lockedBlockIds?.has(block.id)) continue;
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
  const ax = fromPos.x, ay = fromPos.y;
  const bx = toPos.x, by = toPos.y;
  // BUG-06 fix: Guard against degenerate path when fromPos === toPos
  const dist = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  if (dist < 1) {
    // Self-loop or collapsed ports: render a tiny circle instead of Bezier
    return `M ${ax} ${ay} m -2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0`;
  }
  // Adaptive elbow: scales with distance, clamps between 36 and 88
  let el = Math.min(Math.max(dist * 0.42, 36), 88);

  // BUG SWEEP 6 AREA 5: Same-side routing fix — ensure outward loops
  if (fromSide === toSide) {
    // Both ports on same side — need to route outward to avoid self-crossing
    el = Math.max(el, 60); // Increase control point distance for same-side
    if (fromSide === 'right' || fromSide === 'left') {
      // Horizontal sides: check if ports are aligned or need offset
      if (Math.abs(ay - by) < 20) el = Math.max(el, 80); // Nearly aligned — loop further
    } else {
      // Vertical sides (top/bottom): check if ports are aligned
      if (Math.abs(ax - bx) < 20) el = Math.max(el, 80);
    }
  }

  // Tangent control points exit perpendicular from each port side
  const cx1 = fromSide === 'right' ? ax + el : fromSide === 'left' ? ax - el : ax;
  const cy1 = fromSide === 'bottom' ? ay + el : fromSide === 'top' ? ay - el : ay;
  const cx2 = toSide === 'right' ? bx + el : toSide === 'left' ? bx - el : bx;
  const cy2 = toSide === 'bottom' ? by + el : toSide === 'top' ? by - el : by;
  return `M ${ax} ${ay} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${bx} ${by}`;
}

// ── SVG → canvas helper (PNG export / clipboard) ──────────────────────────
// BUG SWEEP 7 AREA 7: Apply device pixel ratio for sharp exports on HiDPI screens
function svgToCanvas(svg: SVGSVGElement, w: number, h: number, scale = 2): Promise<HTMLCanvasElement> {
  const dpr = window.devicePixelRatio || 1;
  const effectiveScale = scale * dpr;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  clone.setAttribute('width', String(w * effectiveScale));
  clone.setAttribute('height', String(h * effectiveScale));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
  bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
  bg.setAttribute('fill', '#020617');
  clone.insertBefore(bg, clone.firstChild);
  const svgStr = new XMLSerializer().serializeToString(clone);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * effectiveScale;
      canvas.height = h * effectiveScale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, w * scale, h * scale);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  });
}

// buildInitialLayout → ./diagramLayout.ts

// ─── 4. SUB-COMPONENTS ───────────────────────────────────────────────────────

interface PortCircleProps {
  port: FlexiblePort;
  worldPos: Point;
  isSnapTarget: boolean;
  isOrigin?: boolean;
  isConnected?: boolean;        // has an active wire attached
  isCompatibleTarget?: boolean; // valid drop target for the current wire drag
  isDragActive?: boolean;       // any wire drag is in progress (used to dim incompatibles)
  alwaysShowLabel?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

const PortCircle: React.FC<PortCircleProps> = ({
  port, worldPos, isSnapTarget, isOrigin = false,
  isConnected = false, isCompatibleTarget = false, isDragActive = false,
  alwaysShowLabel = false, onPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  let labelDx = 0, labelDy = 0;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  switch (port.side) {
    case 'left':   labelDx = -12; textAnchor = 'end';   break;
    case 'right':  labelDx = 12;  textAnchor = 'start'; break;
    case 'top':    labelDy = -12; break;
    case 'bottom': labelDy = 12;  break;
  }

  // Dim ports that can't receive the wire — guides the user to valid targets
  const isDimmed = isDragActive && !isCompatibleTarget && !isOrigin && !isSnapTarget;

  // BUG SWEEP 14 AREA 10: Larger port circles (6px base, 7px on hover) for easier targeting
  const r = isHovered || isOrigin ? 7 : isCompatibleTarget ? 6.5 : 6;
  const strokeColor = isSnapTarget       ? '#10b981'
    : isOrigin                           ? '#6366f1'
    : isCompatibleTarget                 ? '#22c55e'
    : isHovered                          ? port.color  // Highlight on hover
    : port.color;
  const strokeW = isSnapTarget || isHovered || isOrigin || isCompatibleTarget ? 2.5 : isConnected ? 2 : 1.5;
  // Connected ports get a subtle tinted fill so the user sees "occupied"
  const fillColor = isConnected && !isOrigin ? `${port.color}28` : '#0f172a';

  return (
    <g style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 0.12s' }}>
      {/* Invisible hit area */}
      <circle cx={worldPos.x} cy={worldPos.y} r={12} fill="transparent"
        style={{ cursor: 'crosshair' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={onPointerDown}
      />

      {/* Compatible-target glow ring — shown during drag for valid free ports */}
      {isCompatibleTarget && !isSnapTarget && (
        <circle cx={worldPos.x} cy={worldPos.y} r={9}
          fill="none" stroke="#22c55e" strokeWidth={1.5} opacity={0.55}
          className="animate-pulse" style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Visual dot */}
      <circle cx={worldPos.x} cy={worldPos.y} r={r}
        fill={fillColor} stroke={strokeColor} strokeWidth={strokeW}
        style={{ pointerEvents: 'none' }}
        className={cn((isSnapTarget || isOrigin) && 'animate-pulse')}
      />

      {/* Snap-target lock ring */}
      {isSnapTarget && (
        <circle cx={worldPos.x} cy={worldPos.y} r={8}
          fill="none" stroke="#10b981" strokeWidth={1.5} opacity={0.6}
          className="animate-pulse" style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Label — sempre visível no inversor, on-hover nos demais */}
      {(isHovered || alwaysShowLabel) && (
        <text x={worldPos.x + labelDx} y={worldPos.y + labelDy}
          textAnchor={textAnchor} dominantBaseline="middle"
          fill={port.color} fontSize={8} fontWeight="bold" fontFamily="monospace"
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
  isFlashing?: boolean;
  snapTargetPortId: string | null;
  draggingWire: DraggingWire | null;
  connectedPortIds?: Set<string>;        // which ports on this block have wires
  draggingFromPortType?: PortType | null; // type of port being dragged (null = no drag)
  isMultiSelected?: boolean;             // part of a multi-block selection
  isDragging?: boolean;                  // B: this block is being dragged (show live coords)
  isLocked?: boolean;                    // C: block is locked (cannot be dragged)
  zoom?: number;                         // C: current zoom level for semantic rendering
  note?: string;                         // B: sticky note text for this block
  onPointerDown: (e: React.PointerEvent) => void;
  onPortPointerDown: (e: React.PointerEvent, portId: string) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

// BUG SWEEP 6 AREA 9: Memoize BlockRenderer to prevent ALL blocks re-rendering on every drag move
const BlockRenderer = React.memo<BlockRendererProps>(({
  block,
  pos,
  isSelected,
  isOverlapping,
  isFlashing,
  snapTargetPortId,
  draggingWire,
  connectedPortIds,
  draggingFromPortType,
  isMultiSelected = false,
  isDragging = false,
  isLocked = false,
  zoom = 1,
  note,
  onPointerDown,
  onPortPointerDown,
  onClick,
  onDoubleClick,
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
        rx={0}
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
        rx={0}
        fill={bgFill}
        stroke={borderStroke}
        strokeWidth={borderWidth}
        style={{ cursor: 'move' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={(e) => {
          if (e.detail === 2) {
            e.preventDefault();
            return;
          }
          onPointerDown(e);
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />

      {/* B: Sticky note callout above block */}
      {/* BUG SWEEP 12 AREA 3: Clamp callout position to prevent rendering above/left of canvas */}
      {note && (() => {
        const calloutY = Math.max(4, pos.y - 20); // Clamp to at least 4px from top
        const calloutX = Math.max(4, pos.x); // Clamp to at least 4px from left
        const calloutW = Math.min(block.w, note.length * 5.5 + 10);
        // BUG SWEEP 13 AREA 8: Truncate long note text to fit within rect (SVG text doesn't auto-wrap)
        const maxChars = Math.floor((calloutW - 18) / 5.5); // 18px = emoji + padding
        const displayNote = note.length > maxChars ? note.slice(0, maxChars - 1) + '…' : note;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={calloutX} y={calloutY} width={calloutW} height={14}
              fill="#0f172a" stroke="#854d0e" strokeWidth={0.7} opacity={0.95} />
            <text x={calloutX + 5} y={calloutY + 7} dominantBaseline="middle"
              fill="#fcd34d" fontSize={7} fontFamily="monospace" style={{ userSelect: 'none' }}>
              📌 {displayNote}
            </text>
          </g>
        );
      })()}

      {/* Collision warning overlay */}
      {isOverlapping && (
        <>
          <rect
            x={pos.x + 1}
            y={pos.y + 1}
            width={block.w - 2}
            height={block.h - 2}
            rx={0}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            opacity={0.6}
            style={{ pointerEvents: 'none' }}
            className="animate-pulse"
          />
          {/* UX-09: Label de colisão */}
          <text
            x={pos.x + block.w / 2}
            y={pos.y - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#f59e0b"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            Colisão — solte para desfazer
          </text>
        </>
      )}

      {/* A1 fix: Flash overlay de colisão via state (não DOM query) */}
      {isFlashing && (
        <rect
          x={pos.x + 1}
          y={pos.y + 1}
          width={block.w - 2}
          height={block.h - 2}
          rx={0}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          opacity={0.7}
          style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
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

      {/* Multi-select indicator: dashed outline */}
      {isMultiSelected && !isSelected && (
        <rect
          x={pos.x + 1} y={pos.y + 1}
          width={block.w - 2} height={block.h - 2}
          fill="none" stroke="#6366f1" strokeWidth={1}
          strokeDasharray="4 2" opacity={0.6}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* C: Lock indicator — top-right corner badge */}
      {isLocked && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={pos.x + block.w - 14} y={pos.y + 2} width={12} height={12} fill="#0f172a" stroke="#f59e0b" strokeWidth={0.8} />
          <text x={pos.x + block.w - 8} y={pos.y + 9} textAnchor="middle" dominantBaseline="middle"
            fill="#f59e0b" fontSize={7} fontFamily="monospace">🔒</text>
        </g>
      )}

      {/* B: Live coord badge during drag */}
      {isDragging && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={pos.x + 2} y={pos.y - 19} width={64} height={14}
            fill="#020617" stroke="#6366f1" strokeWidth={0.8} opacity={0.95} />
          <text x={pos.x + 34} y={pos.y - 12}
            textAnchor="middle" dominantBaseline="middle"
            fill="#818cf8" fontSize={7} fontFamily="monospace" fontWeight="bold">
            {Math.round(pos.x)},{Math.round(pos.y)}
          </text>
        </g>
      )}

      {/* Block-specific rendering */}
      {block.kind === 'inverter' && (
        <>
          {/* Connection completeness badge — top-right corner */}
          {connectedPortIds && (() => {
            const mpptInPorts = block.ports.filter(p => p.type === 'mppt-in');
            const connected = mpptInPorts.filter(p => connectedPortIds.has(p.id)).length;
            const total = mpptInPorts.length;
            if (total === 0) return null;
            const isComplete = connected === total;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={pos.x + block.w - 36} y={pos.y + 5} width={32} height={13} rx={0}
                  fill={isComplete ? '#052e16' : '#1c1917'}
                  stroke={isComplete ? '#22c55e40' : '#44403c40'}
                  strokeWidth={0.8}
                />
                <text x={pos.x + block.w - 20} y={pos.y + 12}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isComplete ? '#4ade80' : '#a8a29e'}
                  fontSize={7} fontFamily="monospace" fontWeight="bold"
                >
                  {connected}/{total}
                </text>
              </g>
            );
          })()}

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
                // A9 fix: não renderizar label se não houver espaço (bloco pequeno)
                const hasSpace = block.h >= 60;
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
                    {hasSpace && (
                      <text
                        x={(x1 + x2) / 2} y={bracketY + 9}
                        textAnchor="middle"
                        fill={color} fontSize={6}
                        fontFamily="monospace" opacity={0.65}
                        fontWeight="bold"
                      >
                        {mpptLabel}
                      </text>
                    )}
                  </g>
                );
              });
          })()}

          {/* B: MPPT utilization mini-bars — one row per MPPT, bottom-left inside block */}
          {connectedPortIds && (() => {
            const groups: Record<number, FlexiblePort[]> = {};
            block.ports.filter(p => p.type === 'mppt-in').forEach(p => {
              const k = p.mpptIndex ?? 0;
              (groups[k] ??= []).push(p);
            });
            const entries = Object.entries(groups);
            if (entries.length === 0) return null;
            const BAR_W = 28, BAR_H = 3, ROW_H = 8;
            const startY = pos.y + block.h - entries.length * ROW_H - 6;
            return (
              <g style={{ pointerEvents: 'none' }}>
                {entries.map(([k, ports], i) => {
                  const color = ports[0].color;
                  const total = ports.length;
                  const filled = ports.filter(p => connectedPortIds.has(p.id)).length;
                  const fillW = total > 0 ? (filled / total) * BAR_W : 0;
                  const y = startY + i * ROW_H;
                  return (
                    <g key={k}>
                      <rect x={pos.x + 6} y={y} width={BAR_W} height={BAR_H}
                        fill="#1e293b" rx={1} />
                      <rect x={pos.x + 6} y={y} width={fillW} height={BAR_H}
                        fill={color} rx={1} opacity={filled === total ? 1 : 0.75} />
                      <text x={pos.x + 6 + BAR_W + 3} y={y + BAR_H / 2}
                        dominantBaseline="middle" fill={color}
                        fontSize={5} fontFamily="monospace" opacity={0.7}>
                        {filled}/{total}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
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
            rx={0}
            fill={block.meta?.mpptColor || '#6366f1'}
            style={{ pointerEvents: 'none' }}
          />

          {/* Name */}
          <text
            x={pos.x + 12}
            y={pos.y + block.h / (zoom < 0.4 ? 2 : 2) - (zoom < 0.4 ? 0 : 6)}
            fill="#e2e8f0"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {block.label}
          </text>

          {/* SubLabel — hidden at low zoom (semantic zoom) */}
          {zoom >= 0.4 && (
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
          )}
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

      {/* Mini info tooltip on hover — appears before the detail panel opens */}
      {isHovered && !isSelected && (() => {
        const lines: Array<{ text: string; size: number; color: string; bold: boolean }> = [];
        if (block.kind === 'string') {
          const str = block.meta?.string as StringDef | undefined;
          const mpptId = block.meta?.mpptId as number | undefined;
          lines.push({ text: block.label, size: 8, color: '#cbd5e1', bold: true });
          lines.push({
            text: `${mpptId !== undefined ? `MPPT ${mpptId}` : 'Sem MPPT'} · ${str?.modulesCount ?? 0} mód.`,
            size: 7, color: '#64748b', bold: false,
          });
          if (str?.cableSection) {
            lines.push({ text: `${str.cableSection} mm² · ${str.cableLength ?? '?'} m`, size: 7, color: '#475569', bold: false });
          }
        } else if (block.kind === 'inverter') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ci = block.meta?.catalogItem as any;
          const mfr = ci?.manufacturer ?? '';
          const mdl = ci?.model ?? block.subLabel ?? '';
          lines.push({ text: `${mfr} ${mdl}`.trim() || block.label, size: 8, color: '#7dd3fc', bold: true });
          if (ci?.nominalPowerW) {
            lines.push({ text: `${(ci.nominalPowerW / 1000).toFixed(1)} kW`, size: 7, color: '#64748b', bold: false });
          }
        } else if (block.kind === 'ac-panel') {
          lines.push({ text: block.label, size: 8, color: '#6ee7b7', bold: true });
          if (block.subLabel) lines.push({ text: block.subLabel, size: 7, color: '#64748b', bold: false });
        }
        if (lines.length === 0) return null;
        const TW = 152, LINE_H = 13, PAD = 7;
        const th = lines.length * LINE_H + PAD * 2 - 2;
        const tx = pos.x + block.w / 2 - TW / 2;
        // Position above the block, or below if block is near the canvas top
        const ty = pos.y > 72 ? pos.y - th - 6 : pos.y + block.h + 6;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={ty} width={TW} height={th} fill="#020617" stroke="#334155" strokeWidth={0.8} opacity={0.97} />
            {lines.map((line, i) => (
              <text key={i}
                x={tx + TW / 2} y={ty + PAD + i * LINE_H + LINE_H / 2}
                textAnchor="middle" dominantBaseline="middle"
                fill={line.color} fontSize={line.size}
                fontFamily="monospace" fontWeight={line.bold ? 'bold' : 'normal'}
              >{line.text}</text>
            ))}
          </g>
        );
      })()}

      {/* Render ports */}
      {block.ports.map((port) => {
        const portPos = getPortWorldPos(block, pos, port);
        const isOrigin = draggingWire?.fromBlockId === block.id && draggingWire?.fromPortId === port.id;
        const isConnectedPort = connectedPortIds?.has(port.id) ?? false;
        const isDragActive = draggingFromPortType != null;
        // A compatible target: different block, compatible types, port not already wired
        const isCompatibleTarget = isDragActive
          && block.id !== draggingWire?.fromBlockId
          && areCompatible(draggingFromPortType!, port.type)
          && !isConnectedPort;
        return (
          <PortCircle
            key={port.id}
            port={port}
            worldPos={portPos}
            isSnapTarget={snapTargetPortId === port.id}
            isOrigin={isOrigin}
            isConnected={isConnectedPort}
            isCompatibleTarget={isCompatibleTarget}
            isDragActive={isDragActive}
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
}, (prev, next) => {
  // BUG SWEEP 6 AREA 9: Custom comparator — only re-render when visual props change
  return prev.block.id === next.block.id &&
    prev.pos.x === next.pos.x &&
    prev.pos.y === next.pos.y &&
    prev.isSelected === next.isSelected &&
    prev.isOverlapping === next.isOverlapping &&
    prev.isFlashing === next.isFlashing &&
    prev.snapTargetPortId === next.snapTargetPortId &&
    prev.draggingWire?.fromBlockId === next.draggingWire?.fromBlockId &&
    prev.draggingFromPortType === next.draggingFromPortType &&
    prev.isMultiSelected === next.isMultiSelected &&
    prev.isDragging === next.isDragging &&
    prev.isLocked === next.isLocked &&
    prev.zoom === next.zoom &&
    prev.note === next.note &&
    prev.connectedPortIds === next.connectedPortIds;
  // Handlers (onPointerDown, onClick, etc.) are event listeners — intentionally NOT compared
});

interface WireRendererProps {
  wire: DiagramWire;
  blocks: DiagramBlock[];
  blockPositions: BlockPositions;
  isHighlighted?: boolean;
  label?: string;
  onDelete: (id: string) => void;
  onLabelDblClick?: () => void;
}

// B4 fix: memo para evitar re-renders excessivos no hover
// PERF-01 fix: custom comparator — only re-render when wire.id, isHighlighted, or isSelected changes
const WireRenderer = React.memo<WireRendererProps>(({ wire, blocks, blockPositions, isHighlighted = false, label, onDelete, onLabelDblClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const fromBlock = blocks.find(b => b.id === wire.fromBlockId);
  const toBlock = blocks.find(b => b.id === wire.toBlockId);
  if (!fromBlock || !toBlock) return null;

  const fromPos = blockPositions[wire.fromBlockId];
  const toPos = blockPositions[wire.toBlockId];
  if (!fromPos || !toPos) return null;

  const fromPort = fromBlock.ports.find(p => p.id === wire.fromPortId);
  const toPort = toBlock.ports.find(p => p.id === wire.toPortId);
  // BUG SWEEP 14 AREA 9: Show orphaned wire indicator when ports are not found
  const isOrphaned = !fromPort || !toPort;
  if (isOrphaned) {
    // Render a broken wire indicator instead of nothing
    const fromCenter = { x: fromPos.x + fromBlock.w / 2, y: fromPos.y + fromBlock.h / 2 };
    const toCenter = { x: toPos.x + toBlock.w / 2, y: toPos.y + toBlock.h / 2 };
    const midX = (fromCenter.x + toCenter.x) / 2;
    const midY = (fromCenter.y + toCenter.y) / 2;
    return (
      <g>
        <line x1={fromCenter.x} y1={fromCenter.y} x2={toCenter.x} y2={toCenter.y}
          stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" opacity={0.4} />
        <g onClick={(e) => { e.stopPropagation(); onDelete(wire.id); }} style={{ cursor: 'pointer' }}>
          <circle cx={midX} cy={midY} r={8} fill="#ef4444" opacity={0.9} />
          <text x={midX} y={midY + 1} textAnchor="middle" dominantBaseline="middle"
            fill="#ffffff" fontSize={9} fontWeight="bold" style={{ pointerEvents: 'none' }}>
            !
          </text>
        </g>
        <text x={midX} y={midY - 14} textAnchor="middle" fill="#ef4444" fontSize={8}
          fontFamily="monospace" fontWeight="bold" style={{ pointerEvents: 'none' }}>
          Fio órfão (porta não encontrada)
        </text>
      </g>
    );
  }

  const fromWorldPos = getPortWorldPos(fromBlock, fromPos, fromPort);
  const toWorldPos = getPortWorldPos(toBlock, toPos, toPort);

  const path = routeWire(fromWorldPos, fromPort.side, toWorldPos, toPort.side);

  // BUG SWEEP 6 AREA 10: Calculate true Bézier curve midpoint (t=0.5) for accurate label placement
  // For cubic Bézier: P(0.5) = (P0 + 3*P1 + 3*P2 + P3) / 8
  const dist = Math.sqrt((toWorldPos.x - fromWorldPos.x) ** 2 + (toWorldPos.y - fromWorldPos.y) ** 2);
  const el = Math.min(Math.max(dist * 0.42, 36), 88);
  // Reconstruct control points (must match routeWire logic)
  let elbow = el;
  if (fromPort.side === toPort.side) {
    elbow = Math.max(el, 60);
    if ((fromPort.side === 'right' || fromPort.side === 'left') && Math.abs(fromWorldPos.y - toWorldPos.y) < 20) {
      elbow = Math.max(el, 80);
    } else if ((fromPort.side === 'top' || fromPort.side === 'bottom') && Math.abs(fromWorldPos.x - toWorldPos.x) < 20) {
      elbow = Math.max(el, 80);
    }
  }
  const cx1 = fromPort.side === 'right' ? fromWorldPos.x + elbow : fromPort.side === 'left' ? fromWorldPos.x - elbow : fromWorldPos.x;
  const cy1 = fromPort.side === 'bottom' ? fromWorldPos.y + elbow : fromPort.side === 'top' ? fromWorldPos.y - elbow : fromWorldPos.y;
  const cx2 = toPort.side === 'right' ? toWorldPos.x + elbow : toPort.side === 'left' ? toWorldPos.x - elbow : toWorldPos.x;
  const cy2 = toPort.side === 'bottom' ? toWorldPos.y + elbow : toPort.side === 'top' ? toWorldPos.y - elbow : toWorldPos.y;
  // True Bézier midpoint at t=0.5
  const midX = (fromWorldPos.x + 3 * cx1 + 3 * cx2 + toWorldPos.x) / 8;
  const midY = (fromWorldPos.y + 3 * cy1 + 3 * cy2 + toWorldPos.y) / 8;

  // Cable length from string meta (actual project data, not SVG distance)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cableLength = (fromBlock.meta?.string as any)?.cableLength as string | number | undefined;

  return (
    <g>
      {/* UX-03: Wire tooltip */}
      <title>{`${fromBlock.label} [${fromPort.label ?? fromPort.id}] → ${toBlock.label} [${toPort.label ?? toPort.id}]`}</title>

      {/* Invisible wide path for hover detection + double-click to label */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: 'pointer' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onDoubleClick={onLabelDblClick}
      />

      {/* Visible wire — animated dashes when highlighted (selected block) */}
      <path
        d={path}
        stroke={wire.color}
        strokeWidth={isHovered || isHighlighted ? 2.5 : 1.5}
        fill="none"
        opacity={isHovered || isHighlighted ? 1 : 0.7}
        strokeDasharray={isHighlighted ? '8 4' : undefined}
        markerEnd="url(#wire-arrow)"
        className="transition-all duration-200"
        style={{
          pointerEvents: 'none',
          ...(isHighlighted ? { animation: 'wire-flow 0.6s linear infinite' } : {}),
        }}
      />

      {/* A: Hover pulse glow ring */}
      {isHovered && (
        <path d={path} stroke={wire.color} strokeWidth={5}
          fill="none" opacity={0.15} className="animate-pulse"
          style={{ pointerEvents: 'none' }} />
      )}

      {/* Cable length label — shown when hovered if string has project cableLength */}
      {isHovered && cableLength != null && (
        <text
          x={midX} y={midY - 14}
          textAnchor="middle" dominantBaseline="middle"
          fill={wire.color} fontSize={8} fontFamily="monospace" fontWeight="bold"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {cableLength} m
        </text>
      )}

      {/* A: User-defined wire annotation label */}
      {label && !isHovered && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={midX - label.length * 3 - 4} y={midY - 22} width={label.length * 6 + 8} height={11}
            fill="#0f172a" stroke={wire.color} strokeWidth={0.6} opacity={0.9} />
          <text x={midX} y={midY - 16} textAnchor="middle" dominantBaseline="middle"
            fill={wire.color} fontSize={7} fontFamily="monospace" fontWeight="bold"
            style={{ userSelect: 'none' }}>
            {label}
          </text>
        </g>
      )}

      {/* A: MPPT ID label at wire midpoint — hidden when hovered (delete button takes over) */}
      {!isHovered && toPort.type === 'mppt-in' && toPort.mpptIndex !== undefined && (
        <text x={midX} y={midY - 5} textAnchor="middle" dominantBaseline="middle"
          fill={wire.color} fontSize={7} fontFamily="monospace" opacity={0.65}
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          M{toPort.mpptIndex + 1}
        </text>
      )}

      {/* A: Polarity + marker at string output end */}
      <text
        x={fromWorldPos.x + (fromPort.side === 'right' ? 7 : fromPort.side === 'left' ? -7 : 0)}
        y={fromWorldPos.y + (fromPort.side === 'bottom' ? 7 : fromPort.side === 'top' ? -7 : 0)}
        textAnchor="middle" dominantBaseline="middle"
        fill={wire.color} fontSize={7} fontFamily="monospace" fontWeight="bold" opacity={0.55}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>+</text>

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
}, (prev, next) => {
  // Only re-render if wire data, positions, or visual state changes
  // Handlers (onDelete, onLabelDblClick) are intentionally NOT compared — they're event listeners
  return prev.wire.id === next.wire.id &&
    prev.isHighlighted === next.isHighlighted &&
    prev.label === next.label &&
    prev.blockPositions[prev.wire.fromBlockId]?.x === next.blockPositions[next.wire.fromBlockId]?.x &&
    prev.blockPositions[prev.wire.fromBlockId]?.y === next.blockPositions[next.wire.fromBlockId]?.y &&
    prev.blockPositions[prev.wire.toBlockId]?.x  === next.blockPositions[next.wire.toBlockId]?.x  &&
    prev.blockPositions[prev.wire.toBlockId]?.y  === next.blockPositions[next.wire.toBlockId]?.y;
});

interface RubberBandWireProps {
  from: Point;
  fromSide: Side;
  to: Point;
  toSide?: Side;  // lado do snap target; undefined quando flutuando
  color: string;
  hasSnap: boolean;
}

// B1 fix: inline getMpptColorForPort para encontrar cor do MPPT de destino
function getMpptColorForPort(portId: string, blocks: DiagramBlock[]): string | null {
  for (const block of blocks) {
    const port = block.ports.find(p => p.id === portId);
    if (port) return port.color;
  }
  return null;
}

const RubberBandWire: React.FC<RubberBandWireProps> = ({ from, fromSide, to, toSide, color, hasSnap }) => {
  // Quando flutuando (sem snap), estima o lado oposto como destino plausível
  const effectiveToSide: Side = toSide ?? (
    fromSide === 'right'  ? 'left' :
    fromSide === 'left'   ? 'right' :
    fromSide === 'bottom' ? 'top'   : 'bottom'
  );
  const path = routeWire(from, fromSide, to, effectiveToSide);

  // BUG SWEEP 14 AREA 10: Enhanced wire drag feedback — green when snapped, source color when floating
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Background glow for visibility */}
      <path
        d={path}
        stroke={hasSnap ? '#10b981' : color}
        strokeWidth={6}
        fill="none"
        opacity={0.15}
      />
      {/* Main wire path */}
      <path
        d={path}
        stroke={hasSnap ? '#10b981' : color}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray={hasSnap ? undefined : '6 3'}
        opacity={0.9}
      />
      {/* Endpoint circle */}
      <circle
        cx={to.x}
        cy={to.y}
        r={hasSnap ? 5 : 4}
        fill={hasSnap ? '#10b981' : color}
        stroke={hasSnap ? '#065f46' : 'none'}
        strokeWidth={hasSnap ? 1.5 : 0}
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

// A5 fix: adicionado transition-all para suavizar movimento quando painel abre
// BUG-11 fix: Memoize to prevent re-renders when parent changes (callbacks are stable via useCallback)
const ZoomControls = React.memo<ZoomControlsProps>(({ zoom, panelOpen, onZoomIn, onZoomOut, onFit, onExport }) => {
  return (
    <div className={`absolute bottom-6 flex flex-col gap-2 z-20 transition-all duration-300 ${panelOpen ? 'right-[296px]' : 'right-6'}`}>
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 transition-colors"
          title="Exportar SVG"
        >
          <Download className="h-4 w-4 text-slate-400" />
        </button>
      )}
      <button
        onClick={onZoomIn}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4 text-slate-400" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4 text-slate-400" />
      </button>
      <button
        onClick={onFit}
        className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 transition-colors"
        title="Fit to View"
      >
        <Maximize2 className="h-4 w-4 text-slate-400" />
      </button>
      <span className="text-[7px] text-slate-700 font-mono tabular-nums mt-0.5">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
});

interface StringDetailPanelProps {
  stringData: StringDef;
  mpptId: number;
  onClose: () => void;
}

const StringDetailPanel: React.FC<StringDetailPanelProps> = ({ stringData, mpptId, onClose }) => {
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const setActiveTool = useUIStore(s => s.setActiveTool);

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
          className="p-1 hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-600 uppercase font-bold">Identificação</span>
          </div>
          <div className="text-sm font-mono text-slate-300 font-bold">{stringData.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">MPPT</div>
            <div className="text-lg font-mono text-indigo-400 font-bold">{mpptId}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Módulos</div>
            <div className="text-lg font-mono text-emerald-400 font-bold">{stringData.modulesCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-2">
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

        {/* B: Voltage drop analysis */}
        {stringData.cableLength > 0 && stringData.cableSection > 0 && (() => {
          const ISC_EST = 10; // A — conservative typical string Isc
          const VOC_EST = stringData.modulesCount * 40; // V — rough Voc estimate (40V/module)
          const vDrop = calcVoltageDrop(stringData.cableLength, stringData.cableSection, ISC_EST);
          const vDropPct = VOC_EST > 0 ? (vDrop / VOC_EST) * 100 : 0;
          const suggestion = suggestCableSection(stringData.cableLength, ISC_EST, VOC_EST * 0.01);
          const isExcessive = vDropPct > 1.5;
          return (
            <div className={`border p-3 space-y-2 ${isExcessive ? 'border-amber-800/50 bg-amber-950/20' : 'border-slate-800 bg-slate-900/50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600 uppercase font-bold">Queda de Tensão</span>
                {isExcessive && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-mono">ΔV (Isc ≈{ISC_EST}A)</span>
                <span className={`text-[11px] font-mono font-bold tabular-nums ${isExcessive ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {vDrop.toFixed(2)} V · {vDropPct.toFixed(2)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isExcessive ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, vDropPct * 66.7)}%` }} />
              </div>
              {suggestion !== stringData.cableSection && (
                <div className="flex items-center justify-between pt-0.5 border-t border-slate-800">
                  <span className="text-[8px] text-slate-600 font-mono">Seção mín. recomendada</span>
                  <span className="text-[9px] text-indigo-400 font-mono font-bold">{suggestion} mm²</span>
                </div>
              )}
              <div className="text-[7px] text-slate-700 font-mono">ρ Cu 80°C = {RHO_CU_80} Ω·mm²/m · NBR 16690</div>
            </div>
          );
        })()}

        {(stringData.azimuth !== undefined || stringData.inclination !== undefined) && (
          <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-2">
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
            setActiveTool('STRINGING');
            setCanvasViewMode('CONTEXT');
            onClose();
          }}
          className="w-full px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30  flex items-center justify-center gap-2 transition-colors group"
        >
          <MapPin className="h-3 w-3 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Ver módulos no mapa</span>
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
  connectedPortIds?: Set<string>;
  onClose: () => void;
}

const InverterDetailPanel: React.FC<InverterDetailPanelProps> = ({ block, catalogItem, footprint, connectedPortIds, onClose }) => {
  const totalInputs = footprint?.mpptChannels.reduce((s, ch) => s + ch.inputCount, 0) ?? 0;
  const safeConnectedPortIds = connectedPortIds ?? new Set<string>();

  return (
    <div className="absolute top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Inversor</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Identificação */}
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1">
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
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Potência</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">
              {catalogItem?.nominalPowerW
                ? `${(catalogItem.nominalPowerW / 1000).toFixed(1)} kW`
                : '—'}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">MPPTs</div>
            <div className="text-sm font-mono text-sky-400 font-bold">
              {footprint?.mpptChannels.length ?? catalogItem?.mppts?.length ?? '—'}
            </div>
          </div>
        </div>

        {/* Footprint */}
        {footprint && (
          <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-2">
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
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Total de Entradas CC</div>
            <div className="text-lg font-mono text-indigo-400 font-bold">{totalInputs}</div>
          </div>
        )}

        {/* D: MPPT Port Utilization Scorecard */}
        {footprint && (
          <div className="bg-slate-900/50 border border-slate-800 p-3 space-y-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold">Utilização de Portas MPPT</div>
            {footprint.mpptChannels.map(ch => {
              const chPorts = block.ports.filter(p => p.type === 'mppt-in' && p.mpptIndex === ch.mpptIndex);
              const usedCount = chPorts.filter(p => safeConnectedPortIds.has(p.id)).length;
              const totalCount = chPorts.length;
              const color = MPPT_COLORS[ch.mpptIndex % MPPT_COLORS.length];
              const fillPct = totalCount > 0 ? (usedCount / totalCount) * 100 : 0;
              const statusColor = usedCount === totalCount ? '#4ade80' : usedCount > 0 ? '#fbbf24' : '#475569';
              return (
                <div key={ch.mpptIndex} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold" style={{ color }}>MPPT {ch.mpptIndex + 1}</span>
                    <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: statusColor }}>
                      {usedCount}/{totalCount} {usedCount === totalCount ? '✓' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-300"
                      style={{ width: `${fillPct}%`, backgroundColor: color, opacity: 0.85 }} />
                  </div>
                  {ch.inputLabels && (
                    <div className="text-[7px] font-mono text-slate-700">{ch.inputLabels.join(' · ')}</div>
                  )}
                </div>
              );
            })}
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
              <span className="text-[8px] font-mono text-slate-600">Total utilizado</span>
              <span className="text-[8px] font-mono font-bold text-indigo-400 tabular-nums">
                {block.ports.filter(p => p.type === 'mppt-in' && safeConnectedPortIds.has(p.id)).length}/{totalInputs}
              </span>
            </div>
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
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Rótulo</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">{label ?? block.label}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800  p-3">
            <div className="text-[9px] text-slate-600 uppercase font-bold mb-1">Fase</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">
              {phase === 'tri' ? '3φ — Trifásico' : phase === 'mono' ? '1φ — Monofásico' : block.subLabel ?? '—'}
            </div>
          </div>
        </div>
        {footprint && (
          <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-2">
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
  // L2-P1: selector específico para catalog
  const catalog = useCatalogStore(s => s.inverters);
  const techInverters = useMemo(() => toArray<InverterState>(invertersNorm), [invertersNorm]);

  return { techInverters, catalog };
}

// ─── 6. MAIN COMPONENT ───────────────────────────────────────────────────────

export const DiagramCanvasView: React.FC = () => {
  const { techInverters, catalog } = useDiagramData();

  const { activeInverterId, setActiveInverterId } = useInverterUIStore();
  const activeInverterIdx = useMemo(() => {
    if (!activeInverterId) return 0;
    const idx = techInverters.findIndex(i => i.id === activeInverterId);
    return idx >= 0 ? idx : 0;
  }, [techInverters, activeInverterId]);

  // 1. Refs (stable, não causam re-render)
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: -40, y: -40 });
  const contentBoundsRef = useRef({ w: VIEW_W, h: VIEW_H });
  const hasMountedFitRef = useRef(false);
  const handleFitRef = useRef<(() => void) | null>(null);
  const handleFitToSelectionRef = useRef<(() => void) | null>(null);

  // 2. Zoom e pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: -40, y: -40 });

  // L2-I4: save status indicator + timestamp
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // C: Canvas polish states
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [svgMousePos, setSvgMousePos] = useState<Point | null>(null);
  // B: Dragging block ID for live coord display
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  // C: Locked blocks (cannot be dragged)
  const [lockedBlockIds, setLockedBlockIds] = useState<Set<string>>(new Set());
  // D: Named snapshots
  const [snapshots, setSnapshots] = useState<DiagramSnapshot[]>([]);
  const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);

  // 3. Todos os estados de dados (declarados ANTES de serem usados)
  const [blockPositions, setBlockPositions] = useState<BlockPositions>({});
  const [wires, setWires] = useState<DiagramWire[]>([]);
  // BUG SWEEP 12 AREA 1: History stores both wires AND positions
  const [wireHistory, setWireHistory] = useState<HistoryEntry[]>([]);
  const [wireRedoStack, setWireRedoStack] = useState<HistoryEntry[]>([]);
  const [wireDropFeedback, setWireDropFeedback] = useState<{ x: number; y: number; reason?: string } | null>(null);
  // D: History diff visual — briefly renders removed wires in red
  const [flashRemovedWires, setFlashRemovedWires] = useState<DiagramWire[]>([]);
  const flashRemovedWiresTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A: Wire annotation labels (double-click wire to set)
  const [wireLabels, setWireLabels] = useState<Record<string, string>>({});
  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [editingWireValue, setEditingWireValue] = useState('');
  // B: Block sticky notes (double-click block body to set)
  const [blockNotes, setBlockNotes] = useState<Record<string, string>>({});
  const [editingBlockNoteId, setEditingBlockNoteId] = useState<string | null>(null);
  const [editingBlockNoteValue, setEditingBlockNoteValue] = useState('');

  // 4. Estados de drag e pan
  const draggingBlock = useRef<DraggingBlock | null>(null);
  const [draggingWire, setDraggingWire] = useState<DraggingWire | null>(null);
  // BUG SWEEP 6 AREA 2: Add ref to track draggingWire for consistent state reading in event handlers
  const draggingWireRef = useRef<DraggingWire | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const isPanning = useRef(false);
  const lastPt = useRef<Point>({ x: 0, y: 0 });
  const [isPanningState, setIsPanningState] = useState(false);

  // 5. Selected block state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  // A1 fix: flash state para collision feedback
  const [flashBlockId, setFlashBlockId] = useState<string | null>(null);
  // B: Multi-select state
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // 6. Refs para keyboard handlers (usados no useEffect de keyboard)
  const wiresRef = useRef<DiagramWire[]>(wires);
  const selectedBlockIdRef = useRef<string | null>(null);
  // L2-C1: refs para closure stale em wire drag (declarados aqui sem inicializar, sincronizados depois)
  const blocksRef = useRef<DiagramBlock[]>([]);
  const blockPositionsRef = useRef<BlockPositions>({});
  // L2-C3: ref para posição inicial do bloco (snap back on collision)
  const blockDragStartPosRef = useRef<Point | null>(null);
  // B: Multi-select refs
  const selectedBlockIdsRef = useRef<Set<string>>(new Set());
  const isRubberBanding = useRef(false);
  const rubberBandStartRef = useRef<Point>({ x: 0, y: 0 });
  const groupDragStartPositions = useRef<Record<string, Point>>({});

  // 7. Sync wiresRef com wires state
  // A7 fix: ref sempre em sincronia — atualiza também dentro do setState
  useEffect(() => {
    wiresRef.current = wires;
  }, [wires]);

  // Wrapper para setWires que garante ref em sincronia
  const setWiresSafe = useCallback((updater: DiagramWire[] | ((prev: DiagramWire[]) => DiagramWire[])) => {
    setWires(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      wiresRef.current = next;
      return next;
    });
  }, []);

  // 8. Sync selectedBlockIdRef com selectedBlockId state (BUG SWEEP 10 AREA 2: inline sync below)
  useEffect(() => {
    selectedBlockIdRef.current = selectedBlockId;
  }, [selectedBlockId]);

  // B: Sync selectedBlockIdsRef (BUG SWEEP 10 AREA 2: inline sync below)
  useEffect(() => {
    selectedBlockIdsRef.current = selectedBlockIds;
  }, [selectedBlockIds]);

  // BUG SWEEP 6 AREA 2: Sync draggingWireRef
  useEffect(() => {
    draggingWireRef.current = draggingWire;
  }, [draggingWire]);

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

  // 11. blocks useMemo (depende de activeInverter, catalogItem)
  // L2-P2: removido footprint das deps (já acessível via catalogItem)
  const blocks = useMemo(() => {
    if (!activeInverter) return [];
    return buildInitialLayout(activeInverter, catalogItem, footprint).blocks;
  }, [activeInverter?.id, catalogItem?.id]);

  // L2-C1: Sync blocksRef e blockPositionsRef (APÓS declaração de blocks)
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    blockPositionsRef.current = blockPositions;
  }, [blockPositions]);

  // 12. contentBounds useMemo (depende de blocks e blockPositions)
  // BUG-04 fix: Considera blocos com posições negativas (minX/minY)
  const contentBounds = useMemo(() => {
    if (Object.keys(blockPositions).length === 0) return { w: VIEW_W, h: VIEW_H };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    blocks.forEach(block => {
      const pos = blockPositions[block.id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + block.w);
        maxY = Math.max(maxY, pos.y + block.h);
      }
    });
    // Se todos os blocos estiverem em posições negativas, ajusta o contentBounds
    if (minX === Infinity) return { w: VIEW_W, h: VIEW_H };
    const PAD = 120;
    const w = Math.max(VIEW_W, maxX - Math.min(0, minX) + PAD);
    const h = Math.max(VIEW_H, maxY - Math.min(0, minY) + PAD);
    return { w, h };
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
  // L2-C1 fix: usa blocksRef e blockPositionsRef para evitar closure stale
  const handleSvgPointerMove = useCallback((e: React.PointerEvent) => {
    const svgPt = toSvgPt(e);
    setSvgMousePos(svgPt); // C: crosshair tracking

    // Block drag
    if (draggingBlock.current) {
      const dx = svgPt.x - draggingBlock.current.startMouse.x;
      const dy = svgPt.y - draggingBlock.current.startMouse.y;
      const sel = selectedBlockIdsRef.current;

      if (sel.size > 1 && sel.has(draggingBlock.current.blockId)) {
        // BUG-03 fix: Group move — skip locked blocks
        const updates: BlockPositions = {};
        sel.forEach(bid => {
          if (lockedBlockIds.has(bid)) return; // skip locked
          const startPos = groupDragStartPositions.current[bid];
          if (!startPos) return;
          updates[bid] = {
            x: Math.max(0, snapToGrid(startPos.x + dx)),
            y: Math.max(0, snapToGrid(startPos.y + dy)),
          };
        });
        setBlockPositions(prev => {
          const next = { ...prev, ...updates };
          // BUG SWEEP 8 AREA 10: Sync ref immediately to avoid stale reads in same frame
          blockPositionsRef.current = next;
          return next;
        });
      } else {
        // Single block move
        let newX = snapToGrid(draggingBlock.current.startPos.x + dx);
        let newY = snapToGrid(draggingBlock.current.startPos.y + dy);
        // C: Magnetic snap to other block edges (±8px)
        const MAG_SNAP = 8;
        const draggedBlock = blocksRef.current.find(b => b.id === draggingBlock.current!.blockId);
        if (draggedBlock) {
          for (const other of blocksRef.current) {
            if (other.id === draggingBlock.current!.blockId) continue;
            const op = blockPositionsRef.current[other.id];
            if (!op) continue;
            // Snap left edge to other's right edge
            if (Math.abs(newX - (op.x + other.w)) < MAG_SNAP) newX = op.x + other.w;
            // Snap right edge to other's left edge
            if (Math.abs((newX + draggedBlock.w) - op.x) < MAG_SNAP) newX = op.x - draggedBlock.w;
            // Snap top to other's bottom
            if (Math.abs(newY - (op.y + other.h)) < MAG_SNAP) newY = op.y + other.h;
            // Snap bottom to other's top
            if (Math.abs((newY + draggedBlock.h) - op.y) < MAG_SNAP) newY = op.y - draggedBlock.h;
            // Snap tops aligned
            if (Math.abs(newY - op.y) < MAG_SNAP) newY = op.y;
            // Snap centers aligned horizontally
            if (Math.abs((newY + draggedBlock.h / 2) - (op.y + other.h / 2)) < MAG_SNAP) newY = op.y + (other.h - draggedBlock.h) / 2;
          }
        }
        setBlockPositions(prev => {
          const next = {
            ...prev,
            [draggingBlock.current!.blockId]: { x: Math.max(0, newX), y: Math.max(0, newY) },
          };
          // BUG SWEEP 8 AREA 10: Sync ref immediately to avoid stale reads in same frame
          blockPositionsRef.current = next;
          return next;
        });
      }
      // BUG SWEEP 13 AREA 3: Clear redo stack on position change (prevents inconsistent undo/redo)
      setWireRedoStack([]);
    }

    // Wire drag — usa refs em vez de closure
    if (draggingWire) {
      // BUG SWEEP 10 AREA 4: Pass lockedBlockIds to prevent wire snapping to locked blocks
      const snapTarget = findNearestCompatiblePort(
        blocksRef.current,
        blockPositionsRef.current,
        svgPt,
        draggingWire.fromBlockId,
        draggingWire.fromPortId,
        lockedBlockIds
      );
      setDraggingWire(prev => prev ? { ...prev, livePos: svgPt, snapTarget } : null);
    }
  }, [toSvgPt, draggingWire]);

  // Handle SVG pointer up
  const handleSvgPointerUp = useCallback((e: React.PointerEvent) => {
    // BUG SWEEP 11 AREA 1: Release pointer capture on pointer up
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    // L2-C3: Clear block drag — snap back se colidindo
    if (draggingBlock.current) {
      const blockId = draggingBlock.current.blockId;

      // Calcula overlapping inline para evitar dependência circular
      const isOverlapping = (() => {
        const blocks = blocksRef.current;
        const blockPositions = blockPositionsRef.current;
        const positioned = blocks.filter(b => blockPositions[b.id]);
        const currentBlock = blocks.find(b => b.id === blockId);
        if (!currentBlock) return false;
        const currentPos = blockPositions[blockId];
        if (!currentPos) return false;

        for (const other of positioned) {
          if (other.id === blockId) continue;
          const otherPos = blockPositions[other.id];
          if (!otherPos) continue;
          const overlaps =
            currentPos.x < otherPos.x + other.w - 4 && currentPos.x + currentBlock.w - 4 > otherPos.x &&
            currentPos.y < otherPos.y + other.h - 4 && currentPos.y + currentBlock.h - 4 > otherPos.y;
          if (overlaps) return true;
        }
        return false;
      })();

      if (isOverlapping && blockDragStartPosRef.current) {
        // Reverte para posição inicial
        setBlockPositions(prev => ({
          ...prev,
          [blockId]: blockDragStartPosRef.current!,
        }));
        // A1 fix: Flash via state (não DOM query)
        setFlashBlockId(blockId);
        setTimeout(() => setFlashBlockId(null), 300);
      } else {
        // L2-P3: persist blockPositions somente no pointerUp (após soltar)
        if (activeInverter) {
          useDiagramStore.getState().setBlockPositions(activeInverter.id, blockPositionsRef.current);
        }
      }
      draggingBlock.current = null;
      blockDragStartPosRef.current = null;
      setIsDraggingBlock(false);
      setDraggingBlockId(null); // B: clear coord display
      // BUG-06 fix: Limpa group drag positions após completar
      groupDragStartPositions.current = {};
    }

    // BUG SWEEP 11 AREA 10: Clear draggingWire on background drop (no snapTarget)
    // Complete wire drag
    if (draggingWire && draggingWire.snapTarget) {
      const { fromBlockId, fromPortId } = draggingWire;
      const { blockId: toBlockId, portId: toPortId } = draggingWire.snapTarget;

      // BUG-08 fix: Block self-loop wires
      if (fromBlockId === toBlockId) {
        setWireDropFeedback({ x: draggingWire.livePos.x, y: draggingWire.livePos.y, reason: "Self-loop não permitido" });
        setTimeout(() => setWireDropFeedback(null), 1500);
        setDraggingWire(null);
        return;
      }

      // Check for duplicates
      const isDuplicate = wires.some(
        w =>
          (w.fromBlockId === fromBlockId && w.fromPortId === fromPortId && w.toBlockId === toBlockId && w.toPortId === toPortId) ||
          (w.fromBlockId === toBlockId && w.fromPortId === toPortId && w.toBlockId === fromBlockId && w.toPortId === fromPortId)
      );

      // BUG-01 fix: Block both string-out and mppt-in ports from having multiple wires.
      const fromBlock = blocksRef.current.find(b => b.id === fromBlockId);
      const fromPort = fromBlock?.ports.find(p => p.id === fromPortId);
      const toBlock = blocksRef.current.find(b => b.id === toBlockId);
      const toPort = toBlock?.ports.find(p => p.id === toPortId);

      const isStringOut = fromPort?.type === 'string-out';
      const isMpptIn = toPort?.type === 'mppt-in';

      const fromPortAlreadyUsed = isStringOut && wires.some(
        w => w.fromBlockId === fromBlockId && w.fromPortId === fromPortId
      );
      const toPortAlreadyUsed = isMpptIn && wires.some(
        w => w.toBlockId === toBlockId && w.toPortId === toPortId
      );

      const portAlreadyUsed = fromPortAlreadyUsed || toPortAlreadyUsed;

      if (!isDuplicate && !portAlreadyUsed) {
        // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
        setWireHistory(prev => [...prev.slice(-15), { wires, positions: blockPositionsRef.current }]);
        setWireRedoStack([]); // clear redo on new action
        const newWire: DiagramWire = {
          id: `wire-${Date.now()}`,
          fromBlockId,
          fromPortId,
          toBlockId,
          toPortId,
          color: draggingWire.fromColor,
        };
        setWiresSafe(prev => [...prev, newWire]);
      } else {
        // UX-04 fix: Show rejection reason
        let reason = "Sem destino válido";
        if (portAlreadyUsed) reason = "Porta já ocupada";
        if (isDuplicate) reason = "Conexão duplicada";
        setWireDropFeedback({ x: draggingWire.livePos.x, y: draggingWire.livePos.y, reason });
        setTimeout(() => setWireDropFeedback(null), 1500);
      }

      setDraggingWire(null);
      // BUG SWEEP 11 AREA 10: Clear wireDropFeedback after creating wire
      setWireDropFeedback(null);
    } else if (draggingWire) {
      // BUG SWEEP 11 AREA 10: Wire dropped on background (no port) — cancel wire creation
      // UX-04 fix: Show "no snap" feedback flash at the drop position
      setWireDropFeedback({ x: draggingWire.livePos.x, y: draggingWire.livePos.y, reason: "Porta incompatível" });
      setTimeout(() => setWireDropFeedback(null), 1500);
      setDraggingWire(null);
    }

    // Clear pan state
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningState(false);
    }
  }, [draggingWire, wires, activeInverter]);

  // Handle block pointer down
  // BUG SWEEP 7 AREA 9: Add lockedBlockIds to deps (used in line 1822)
  const handleBlockPointerDown = useCallback((e: React.PointerEvent, blockId: string) => {
    e.stopPropagation();
    // BUG SWEEP 9 AREA 4 fix: Guard against concurrent pointer events (multi-touch)
    if (draggingBlock.current !== null || isPanning.current) return;
    // C: Locked blocks cannot be dragged
    if (lockedBlockIds.has(blockId)) return;
    const svgPt = toSvgPt(e);
    const currentPos = blockPositions[blockId];
    if (!currentPos) return;

    // L2-C3: salva posição inicial para possível snap back
    blockDragStartPosRef.current = { ...currentPos };

    // BUG SWEEP 11 AREA 1: Set pointer capture during block drag to prevent event loss
    e.currentTarget.setPointerCapture(e.pointerId);

    draggingBlock.current = {
      blockId,
      startMouse: svgPt,
      startPos: currentPos,
    };
    setIsDraggingBlock(true);
    setDraggingBlockId(blockId); // B: live coord display

    // B: Group drag — save start positions for all selected blocks
    // BUG SWEEP 11 AREA 4: Include the dragged block itself in groupDragStartPositions
    if (selectedBlockIdsRef.current.size > 1 && selectedBlockIdsRef.current.has(blockId)) {
      groupDragStartPositions.current = {};
      selectedBlockIdsRef.current.forEach(bid => {
        const pos = blockPositionsRef.current[bid];
        if (pos) groupDragStartPositions.current[bid] = { ...pos };
      });
    } else if (selectedBlockIdsRef.current.has(blockId)) {
      // Single block selected — still save its initial position
      groupDragStartPositions.current = { [blockId]: { ...currentPos } };
    }
  }, [toSvgPt, blockPositions, lockedBlockIds]);

  // Handle port pointer down
  const handlePortPointerDown = useCallback((e: React.PointerEvent, blockId: string, portId: string) => {
    // BUG SWEEP 10 AREA 4: Prevent wire creation from/to locked blocks
    if (lockedBlockIds.has(blockId)) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const port = block.ports.find(p => p.id === portId);
    if (!port) return;
    const blockPos = blockPositions[blockId];
    if (!blockPos) return;

    const fromPos = getPortWorldPos(block, blockPos, port);

    // BUG SWEEP 11 AREA 1: Set pointer capture during port drag to prevent event loss
    e.currentTarget.setPointerCapture(e.pointerId);

    setDraggingWire({
      fromBlockId: blockId,
      fromPortId: portId,
      fromPos,
      fromSide: port.side,
      fromColor: port.color,
      livePos: fromPos,
      snapTarget: null,
    });
  }, [blocks, blockPositions, lockedBlockIds]);

  // Background pan + rubber-band handlers
  const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // BUG SWEEP 9 AREA 4 fix: Guard against concurrent pointer events (multi-touch)
    if (draggingBlock.current !== null || isPanning.current || isRubberBanding.current) return;
    // Ignore double-click on background to prevent opening editor
    if (e.detail === 2) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey) {
      // BUG SWEEP 13 AREA 9: Shift+drag → rubber-band multi-select (rect shown only after movement threshold)
      isRubberBanding.current = true;
      const svgPt = toSvgPt(e);
      rubberBandStartRef.current = svgPt;
      // Don't show rect yet — wait for handleBgPointerMove to detect movement
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    // Regular drag → pan + clear multi-select
    setSelectedBlockIds(new Set());
    isPanning.current = true;
    setIsPanningState(true);
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [toSvgPt]);

  const handleBgPointerMove = useCallback((e: React.PointerEvent) => {
    if (isRubberBanding.current) {
      const svgPt = toSvgPt(e);
      // BUG SWEEP 13 AREA 9: Only show rect after movement threshold (4px) to avoid 0×0 flash on Shift+click
      const dx = Math.abs(svgPt.x - rubberBandStartRef.current.x);
      const dy = Math.abs(svgPt.y - rubberBandStartRef.current.y);
      if (dx > 4 || dy > 4) {
        setSelectionRect({
          x1: rubberBandStartRef.current.x, y1: rubberBandStartRef.current.y,
          x2: svgPt.x, y2: svgPt.y,
        });
      }
      return;
    }
    if (!isPanning.current) return;

    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };

    // BUG SWEEP 10 AREA 1: Divide screen delta by zoom so pan speed is zoom-invariant
    // At zoom=2, 1px screen move should translate to 0.5 SVG units, not 1
    const cz = zoomRef.current;
    setPan(prev => ({
      x: prev.x - dx / cz,
      y: prev.y - dy / cz,
    }));
  }, [toSvgPt]);

  const handleBgPointerUp = useCallback((e: React.PointerEvent) => {
    if (isRubberBanding.current) {
      isRubberBanding.current = false;
      setSelectionRect(null);
      const svgPt = toSvgPt(e);
      const x1 = Math.min(rubberBandStartRef.current.x, svgPt.x);
      const x2 = Math.max(rubberBandStartRef.current.x, svgPt.x);
      const y1 = Math.min(rubberBandStartRef.current.y, svgPt.y);
      const y2 = Math.max(rubberBandStartRef.current.y, svgPt.y);
      // BUG SWEEP 11 AREA 9: Add movement threshold before showing selection rect
      const hasMovement = (x2 - x1 > 4 || y2 - y1 > 4);
      // BUG SWEEP 11 AREA 2: Additive rubber-band with Shift — preserve existing selection
      if (hasMovement) {
        const ids = blocksRef.current
          .filter(b => {
            const pos = blockPositionsRef.current[b.id];
            if (!pos) return false;
            return pos.x < x2 && pos.x + b.w > x1 && pos.y < y2 && pos.y + b.h > y1;
          })
          .map(b => b.id);
        if (ids.length > 0) {
          // Shift was held during rubber-band start — ADD to existing selection
          setSelectedBlockIds(prev => new Set([...prev, ...ids]));
          setSelectedBlockId(null);
        }
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningState(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [toSvgPt]);

  // BUG-05 fix: Cleanup rubber-band e pan state em pointerCancel/Leave
  const handleBgPointerCancel = useCallback(() => {
    if (isRubberBanding.current) {
      isRubberBanding.current = false;
      setSelectionRect(null);
    }
    if (isPanning.current) {
      isPanning.current = false;
      setIsPanningState(false);
    }
    // BUG SWEEP 13 AREA 10: Clear block drag state on pointercancel (OS interrupt)
    if (draggingBlock.current) {
      draggingBlock.current = null;
      blockDragStartPosRef.current = null;
      setIsDraggingBlock(false);
      setDraggingBlockId(null);
      groupDragStartPositions.current = {};
    }
    // BUG-01 fix: Limpa wireDropFeedback se pointer sair do SVG
    setWireDropFeedback(null);
    // BUG SWEEP 6 AREA 2: Read draggingWire from ref to avoid stale closure
    if (draggingWireRef.current) {
      setDraggingWire(null);
    }
  }, []); // No deps — reads from refs

  // 14. Zoom controls (handleFit, handleZoomIn, handleZoomOut)
  const handleFit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) { setZoom(1); setPan({ x: -20, y: -20 }); return; }
    const rect = svg.getBoundingClientRect();
    // BUG-03 fix: discount panel width (280px) when detail panel is open
    const panelOpen = selectedBlockId !== null;
    const availW = rect.width - (panelOpen ? 280 : 0);
    const { w, h } = contentBoundsRef.current;
    const fitZoom = Math.min(availW / w, rect.height / h) * 0.9;
    const ZOOM_MIN = 0.15;
    const ZOOM_MAX = 5.0;
    const clampedFitZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fitZoom));
    const vbW = w / clampedFitZoom;
    const vbH = h / clampedFitZoom;
    // Centraliza: pan negativo de metade do espaço extra além do conteúdo
    setPan({ x: -((vbW - w) / 2), y: -((vbH - h) / 2) });
    setZoom(clampedFitZoom);
  }, [selectedBlockId]);

  // BUG-01 fix: Keep handleFitRef in sync
  useEffect(() => {
    handleFitRef.current = handleFit;
  }, [handleFit]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.3, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.3, 0.15));
  }, []);

  // 15. useEffect de reset de layout (agora handleFit está declarado)
  // Reset positions and wires on inverter change
  // A3 fix: usa ref para cancelar timer anterior (evita closures stale)
  const fitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!activeInverter) return;

    // BUG-09 fix: Cancela timer pendente e reseta flag antes de processar novo inversor
    clearTimeout(fitTimerRef.current);
    hasMountedFitRef.current = false;

    // Tenta restaurar estado persistido para este inversor
    const store = useDiagramStore.getState();
    const savedWires     = store.wiresMap[activeInverter.id];
    const savedPositions = store.blockPositionsMap[activeInverter.id];
    const hasSavedState  = savedWires && savedPositions && Object.keys(savedPositions).length > 0;

    if (hasSavedState) {
      setWiresSafe(savedWires as any);
      setBlockPositions(savedPositions);
      // BUG 8.1 fix: Restore wireLabels, blockNotes, lockedBlockIds
      setWireLabels(store.wireLabelsMap[activeInverter.id] ?? {});
      setBlockNotes(store.blockNotesMap[activeInverter.id] ?? {});
      const savedLocked = store.lockedBlockIdsMap[activeInverter.id];
      setLockedBlockIds(savedLocked ? new Set(savedLocked) : new Set());
    } else {
      const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
      setBlockPositions(layout.positions);
      setWiresSafe(layout.wires);
      // BUG 8.1 fix: Clear custom state for new layouts
      setWireLabels({});
      setBlockNotes({});
      setLockedBlockIds(new Set());
    }

    setWireHistory([]);
    setWireRedoStack([]);
    setSelectedBlockId(null);
    setDraggingWire(null);
    draggingBlock.current = null;
    setIsDraggingBlock(false);
    fitTimerRef.current = setTimeout(() => {
      // BUG-01 fix: Read through stable ref to avoid handleFit identity changes
      handleFitRef.current?.();
    }, 120);
    return () => clearTimeout(fitTimerRef.current);
  }, [activeInverter?.id, catalogItem?.id, setWiresSafe]); // BUG-01: handleFit removed from deps

  // ── Sync wires → persistent store (debounced 400ms) ──────────────────────
  useEffect(() => {
    if (!activeInverter) return;
    setSaveStatus('saving'); // L2-I4
    const id = activeInverter.id;
    const timer = setTimeout(() => {
      useDiagramStore.getState().setWires(id, wires);
      setSaveStatus('saved');
      setLastSavedAt(new Date()); // D: track last save timestamp
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
    return () => clearTimeout(timer);
  }, [wires, activeInverter?.id]);

  // BUG 8.1 fix: Persist wireLabels (debounced 400ms)
  useEffect(() => {
    if (!activeInverter) return;
    const timer = setTimeout(() => {
      useDiagramStore.getState().setWireLabels(activeInverter.id, wireLabels);
    }, 400);
    return () => clearTimeout(timer);
  }, [wireLabels, activeInverter?.id]);

  // BUG 8.1 fix: Persist blockNotes (debounced 400ms)
  useEffect(() => {
    if (!activeInverter) return;
    const timer = setTimeout(() => {
      useDiagramStore.getState().setBlockNotes(activeInverter.id, blockNotes);
    }, 400);
    return () => clearTimeout(timer);
  }, [blockNotes, activeInverter?.id]);

  // BUG 8.1 fix: Persist lockedBlockIds (debounced 400ms)
  useEffect(() => {
    if (!activeInverter) return;
    const timer = setTimeout(() => {
      useDiagramStore.getState().setLockedBlockIds(activeInverter.id, [...lockedBlockIds]);
    }, 400);
    return () => clearTimeout(timer);
  }, [lockedBlockIds, activeInverter?.id]);

  // L2-P3: blockPositions persist movido para handleSvgPointerUp (sem debounce)
  // Removido useEffect de blockPositions debounce

  // 16. useEffect de wheel (não-passivo)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      // BUG SWEEP 7 AREA 4: Only zoom on Ctrl+wheel (pinch-to-zoom) or explicit zoom scroll
      // Regular two-finger scroll (without Ctrl) should not zoom
      if (!e.ctrlKey) return; // Allow regular scroll to pass through (browser native pan)
      e.preventDefault();
      const cz = zoomRef.current;
      const cp = panRef.current;

      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.15, Math.min(5, cz * factor));

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
    if (hasMountedFitRef.current) return;
    const timer = setTimeout(() => {
      handleFitRef.current?.(); // read through ref — avoids stale closure on selectedBlockId
      hasMountedFitRef.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, []); // intentionally empty — run once on mount only

  // 18. Keyboard shortcuts
  useEffect(() => {
    // BUG SWEEP 6 AREA 7: Clear interaction state on window blur (key stuck on focus loss)
    const handleBlur = () => {
      isRubberBanding.current = false;
      setSelectionRect(null);
      draggingBlock.current = null;
      blockDragStartPosRef.current = null;
      setIsDraggingBlock(false);
      setDraggingBlockId(null);
      setDraggingWire(null);
      groupDragStartPositions.current = {};
      if (isPanning.current) {
        isPanning.current = false;
        setIsPanningState(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore when focus is in an input/textarea
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Tab / Shift+Tab: cycle between blocks
      if (e.key === 'Tab') {
        e.preventDefault();
        const blockIds = blocksRef.current
          .filter(b => blockPositionsRef.current[b.id])
          .map(b => b.id);
        if (blockIds.length === 0) return;
        const currentIdx = selectedBlockIdRef.current
          ? blockIds.indexOf(selectedBlockIdRef.current)
          : -1;
        const delta = e.shiftKey ? -1 : 1;
        const nextIdx = ((currentIdx + delta) + blockIds.length) % blockIds.length;
        setSelectedBlockId(blockIds[nextIdx]);
        return;
      }

      // Escape: deselect block and cancel wire drag
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        setDraggingWire(null);
        // A4 fix: limpa também wireDropFeedback ao cancelar
        setWireDropFeedback(null);
        // BUG-04 fix: Limpa refs de drag ao cancelar com Escape
        draggingBlock.current = null;
        blockDragStartPosRef.current = null;
        setIsDraggingBlock(false);
        setDraggingBlockId(null);
        groupDragStartPositions.current = {};
      }

      // C: '?' key — toggle keyboard shortcuts overlay
      if (e.key === '?') {
        setShowShortcuts(s => !s);
        return;
      }

      // C: 'L' key — lock/unlock selected block
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const sel = selectedBlockIdRef.current;
        if (!sel) return;
        setLockedBlockIds(prev => {
          const next = new Set(prev);
          if (next.has(sel)) next.delete(sel); else next.add(sel);
          return next;
        });
        return;
      }

      // L2-C2 (BUG-09 fix): Ctrl+Z / Cmd+Z: undo
      // A7 fix: usa setWiresSafe para garantir ref em sincronia
      // BUG SWEEP 12 AREA 1: Restore both wires AND positions atomically
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const currentSnapshot = { wires: wiresRef.current, positions: blockPositionsRef.current };
        setWireHistory(prev => {
          if (prev.length === 0) return prev;
          const lastEntry = prev[prev.length - 1];
          // D: compute removed wires for diff flash
          const removed = currentSnapshot.wires.filter(w => !lastEntry.wires.some(lw => lw.id === w.id));
          if (removed.length > 0) {
            setFlashRemovedWires(removed);
            // BUG-10 fix: Limpa timer anterior antes de criar novo
            if (flashRemovedWiresTimerRef.current) clearTimeout(flashRemovedWiresTimerRef.current);
            flashRemovedWiresTimerRef.current = setTimeout(() => setFlashRemovedWires([]), 350);
          }
          setWireRedoStack(r => [...r.slice(-15), currentSnapshot]); // snapshot → redo
          setWiresSafe(lastEntry.wires);
          setBlockPositions(lastEntry.positions);
          return prev.slice(0, -1);
        });
      }

      // L2-C2 (BUG-09 fix): Ctrl+Y or Ctrl+Shift+Z: redo
      // BUG SWEEP 12 AREA 1: Restore both wires AND positions atomically
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const currentSnapshot = { wires: wiresRef.current, positions: blockPositionsRef.current };
        setWireRedoStack(prev => {
          if (prev.length === 0) return prev;
          const nextEntry = prev[prev.length - 1];
          setWireHistory(h => [...h.slice(-15), currentSnapshot]); // snapshot → history
          setWiresSafe(nextEntry.wires);
          setBlockPositions(nextEntry.positions);
          return prev.slice(0, -1);
        });
      }

      // L2-C4: Delete/Backspace: remove wires connected to selected block(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // BUG SWEEP 9 AREA 1 fix: Support both single and multi-select
        const selectedIds = selectedBlockIdsRef.current.size > 0
          ? [...selectedBlockIdsRef.current]
          : (selectedBlockIdRef.current ? [selectedBlockIdRef.current] : []);
        if (selectedIds.length > 0) {
          const connected = wiresRef.current.filter(
            w => selectedIds.includes(w.fromBlockId) || selectedIds.includes(w.toBlockId)
          );
          if (connected.length > 0) {
            // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
            setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
            setWireRedoStack([]);
            setWiresSafe(prev => prev.filter(w =>
              !selectedIds.includes(w.fromBlockId) && !selectedIds.includes(w.toBlockId)
            ));
            // BUG 1.2 fix: Clean up wireLabels entries for deleted wires
            setWireLabels(prev => {
              const next = { ...prev };
              connected.forEach(w => delete next[w.id]);
              return next;
            });
          }
        }
      }

      // C: 'G' key — fit to selection (or all if no selection)
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        handleFitToSelectionRef.current?.();
        return;
      }

      // BUG SWEEP 9 AREA 9 fix: Ctrl+A — select all blocks
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allBlockIds = blocksRef.current
          .filter(b => blockPositionsRef.current[b.id])
          .map(b => b.id);
        if (allBlockIds.length > 0) {
          setSelectedBlockIds(new Set(allBlockIds));
          setSelectedBlockId(null);
        }
        return;
      }

      // B: Alt+N — clear all block notes
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setBlockNotes({});
        return;
      }

      // L2-I2: Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(z * 1.3, 5));
      }
      if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z / 1.3, 0.15));
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // BUG SWEEP 6 AREA 7: Register blur listener
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      if (flashRemovedWiresTimerRef.current) clearTimeout(flashRemovedWiresTimerRef.current);
    };
  }, [setWiresSafe]); // BUG-01: handleFit and handleFitToSelection read via refs — stable; all state reads use refs/functional updaters

  // SVG cursor
  const svgCursor = draggingWire ? 'crosshair' : isDraggingBlock ? 'move' : isPanningState ? 'grabbing' : 'grab';

  // Smart: type of port being dragged — used by BlockRenderer to highlight compatible targets
  const draggingFromPortType: PortType | null = draggingWire
    ? (blocks.find(b => b.id === draggingWire.fromBlockId)?.ports.find(p => p.id === draggingWire.fromPortId)?.type ?? null)
    : null;

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

  // Smart: which ports on each block are currently wired
  const connectedPortsByBlock = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    wires.forEach(w => {
      (map[w.fromBlockId] ??= new Set()).add(w.fromPortId);
      (map[w.toBlockId]   ??= new Set()).add(w.toPortId);
    });
    return map;
  }, [wires]);

  // Smart: string connection completeness (for status chip + auto-connect button)
  const stringConnectionStatus = useMemo(() => {
    const stringBlocks = blocks.filter(b => b.kind === 'string');
    const total = stringBlocks.length;
    const connected = stringBlocks.filter(b => connectedPortsByBlock[b.id]?.has('out')).length;
    return { connected, total, allConnected: total > 0 && connected === total };
  }, [blocks, connectedPortsByBlock]);

  // Overlapping blocks detection
  // BUG SWEEP 11 AREA 5: Optimize overlap detection — only check dragged block, not all pairs
  const overlappingBlockIds = useMemo(() => {
    const ids = new Set<string>();
    const positioned = blocks.filter(b => blockPositions[b.id]);
    // If a block is being dragged, only check that block for overlaps (O(n) instead of O(n²))
    if (draggingBlockId) {
      const draggedBlock = blocks.find(b => b.id === draggingBlockId);
      if (draggedBlock) {
        const draggedPos = blockPositions[draggingBlockId];
        if (draggedPos) {
          for (const other of positioned) {
            if (other.id === draggingBlockId) continue;
            const otherPos = blockPositions[other.id];
            if (!otherPos) continue;
            const overlaps =
              draggedPos.x < otherPos.x + other.w - 4 && draggedPos.x + draggedBlock.w - 4 > otherPos.x &&
              draggedPos.y < otherPos.y + other.h - 4 && draggedPos.y + draggedBlock.h - 4 > otherPos.y;
            if (overlaps) {
              ids.add(draggingBlockId);
              ids.add(other.id);
            }
          }
        }
      }
    } else {
      // No drag active — check all pairs (only happens when idle, so perf is acceptable)
      for (let i = 0; i < positioned.length; i++) {
        for (let j = i + 1; j < positioned.length; j++) {
          const a = positioned[i];
          const b = positioned[j];
          const ap = blockPositions[a.id];
          const bp = blockPositions[b.id];
          const overlaps =
            ap.x < bp.x + b.w - 4 && ap.x + a.w - 4 > bp.x &&
            ap.y < bp.y + b.h - 4 && ap.y + a.h - 4 > bp.y;
          if (overlaps) {
            ids.add(a.id);
            ids.add(b.id);
          }
        }
      }
    }
    return ids;
  }, [blocks, blockPositions, draggingBlockId]);

  // Reset Layout handler
  const handleResetLayout = useCallback(() => {
    if (!activeInverter) return;
    const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
    // L2-C3: Save current state before resetting
    // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
    setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
    setWireRedoStack([]); // clear redo
    setBlockPositions(layout.positions);
    setWiresSafe(layout.wires); // BUG 2.1 fix: use setWiresSafe to sync ref
    setSelectedBlockId(null);
    setDraggingWire(null);
    draggingBlock.current = null;
    setIsDraggingBlock(false);
    // BUG 2.1 fix: Clear ALL custom state
    setWireLabels({});
    setBlockNotes({});
    setLockedBlockIds(new Set());
    setSelectedBlockIds(new Set());
    // Limpa estado persistido para forçar rebuild no próximo load
    if (activeInverter) useDiagramStore.getState().clearDiagram(activeInverter.id);
  }, [activeInverter, catalogItem, footprint, setWiresSafe]);

  // Clear Manual Wires handler
  // BUG-26 fix: use wiresRef.current instead of wires to avoid recreating
  // callback on every wire change (wires removed from deps array)
  const handleClearManualWires = useCallback(() => {
    if (!activeInverter) return;
    const layout = buildInitialLayout(activeInverter, catalogItem, footprint);
    // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
    setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
    setWireRedoStack([]);
    // BUG-02 fix: Usa setWiresSafe para manter wiresRef sincronizado
    setWiresSafe(layout.wires);
    // BUG 2.2 fix: Clear wireLabels when replacing wires (old wire IDs are orphaned)
    setWireLabels({});
    if (activeInverter) useDiagramStore.getState().clearDiagram(activeInverter.id);
  }, [activeInverter, catalogItem, footprint, setWiresSafe]); // wiresRef is a ref — always current, no dep needed

  // Smart: connect all unconnected string-out ports to their matching MPPT inputs
  const handleAutoConnect = useCallback(() => {
    const inverterBlock = blocks.find(b => b.id === 'inverter');
    if (!inverterBlock) return;

    const usedToKeys   = new Set(wiresRef.current.map(w => `${w.toBlockId}:${w.toPortId}`));
    const usedFromKeys = new Set(wiresRef.current.map(w => `${w.fromBlockId}:${w.fromPortId}`));
    const newWires: DiagramWire[] = [];

    blocks
      .filter(b => b.kind === 'string' && !usedFromKeys.has(`${b.id}:out`))
      .forEach(strBlock => {
        const outPort = strBlock.ports.find(p => p.id === 'out');
        if (!outPort) return;

        const mpptId = strBlock.meta?.mpptId as number | undefined;
        const candidates = inverterBlock.ports.filter(p => p.type === 'mppt-in');

        // Prefer port matching mpptId, fall back to any free port
        const targetPort =
          (mpptId !== undefined ? candidates.find(p => p.id.startsWith(`mppt-${mpptId}-`) && !usedToKeys.has(`inverter:${p.id}`)) : undefined)
          ?? candidates.find(p => !usedToKeys.has(`inverter:${p.id}`));

        if (!targetPort) return;

        newWires.push({
          id: `wire-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fromBlockId: strBlock.id,
          fromPortId: 'out',
          toBlockId: 'inverter',
          toPortId: targetPort.id,
          color: outPort.color,
        });
        usedToKeys.add(`inverter:${targetPort.id}`);
        usedFromKeys.add(`${strBlock.id}:out`);
      });

    if (newWires.length === 0) return;
    // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
    setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
    setWireRedoStack([]);
    setWiresSafe(prev => [...prev, ...newWires]);
  }, [blocks, setWiresSafe]); // wiresRef always current — not a dep

  // ── Layout Assist: Alignment & Distribution handlers ─────────────────────
  // BUG-05 fix: Filter out blocks without positions before Math.min/max
  const handleAlignLeft = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current].filter(id => blockPositionsRef.current[id]);
    if (ids.length < 2) return;
    const minX = Math.min(...ids.map(id => blockPositionsRef.current[id].x));
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => { if (next[id]) next[id] = { ...next[id], x: minX }; });
      return next;
    });
  }, []);

  const handleAlignRight = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current];
    if (ids.length < 2) return;
    const maxRight = Math.max(...ids.map(id =>
      (blockPositionsRef.current[id]?.x ?? 0) + (blocksRef.current.find(b => b.id === id)?.w ?? 0)
    ));
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        const bw = blocksRef.current.find(b => b.id === id)?.w ?? 0;
        if (next[id]) next[id] = { ...next[id], x: maxRight - bw };
      });
      return next;
    });
  }, []);

  const handleAlignCenterH = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current];
    if (ids.length < 2) return;
    const centers = ids.map(id =>
      (blockPositionsRef.current[id]?.x ?? 0) + (blocksRef.current.find(b => b.id === id)?.w ?? 0) / 2
    );
    const avg = centers.reduce((a, b) => a + b, 0) / centers.length;
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        const bw = blocksRef.current.find(b => b.id === id)?.w ?? 0;
        if (next[id]) next[id] = { ...next[id], x: Math.round(avg - bw / 2) };
      });
      return next;
    });
  }, []);

  const handleAlignTop = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current].filter(id => blockPositionsRef.current[id]);
    if (ids.length < 2) return;
    const minY = Math.min(...ids.map(id => blockPositionsRef.current[id].y));
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => { if (next[id]) next[id] = { ...next[id], y: minY }; });
      return next;
    });
  }, []);

  const handleAlignBottom = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current];
    if (ids.length < 2) return;
    const maxBottom = Math.max(...ids.map(id =>
      (blockPositionsRef.current[id]?.y ?? 0) + (blocksRef.current.find(b => b.id === id)?.h ?? 0)
    ));
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        const bh = blocksRef.current.find(b => b.id === id)?.h ?? 0;
        if (next[id]) next[id] = { ...next[id], y: maxBottom - bh };
      });
      return next;
    });
  }, []);

  const handleAlignCenterV = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current];
    if (ids.length < 2) return;
    const centers = ids.map(id =>
      (blockPositionsRef.current[id]?.y ?? 0) + (blocksRef.current.find(b => b.id === id)?.h ?? 0) / 2
    );
    const avg = centers.reduce((a, b) => a + b, 0) / centers.length;
    setBlockPositions(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        const bh = blocksRef.current.find(b => b.id === id)?.h ?? 0;
        if (next[id]) next[id] = { ...next[id], y: Math.round(avg - bh / 2) };
      });
      return next;
    });
  }, []);

  // BUG-10 fix: Clamp negative gap to 0 (overlapping blocks)
  const handleDistributeH = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current].filter(id => blockPositionsRef.current[id]);
    if (ids.length < 3) return;
    const sorted = ids.sort((a, b) => (blockPositionsRef.current[a]?.x ?? 0) - (blockPositionsRef.current[b]?.x ?? 0));
    const firstX = blockPositionsRef.current[sorted[0]]?.x ?? 0;
    const lastId = sorted[sorted.length - 1];
    const lastX = (blockPositionsRef.current[lastId]?.x ?? 0) + (blocksRef.current.find(b => b.id === lastId)?.w ?? 0);
    const totalW = sorted.reduce((s, id) => s + (blocksRef.current.find(b => b.id === id)?.w ?? 0), 0);
    const gap = Math.max(0, (lastX - firstX - totalW) / (sorted.length - 1));
    setBlockPositions(prev => {
      const next = { ...prev };
      let curX = firstX;
      sorted.forEach(id => {
        if (next[id]) next[id] = { ...next[id], x: Math.round(curX) };
        curX += (blocksRef.current.find(b => b.id === id)?.w ?? 0) + gap;
      });
      return next;
    });
  }, []);

  const handleDistributeV = useCallback(() => {
    const ids = [...selectedBlockIdsRef.current].filter(id => blockPositionsRef.current[id]);
    if (ids.length < 3) return;
    const sorted = ids.sort((a, b) => (blockPositionsRef.current[a]?.y ?? 0) - (blockPositionsRef.current[b]?.y ?? 0));
    const firstY = blockPositionsRef.current[sorted[0]]?.y ?? 0;
    const lastId = sorted[sorted.length - 1];
    const lastY = (blockPositionsRef.current[lastId]?.y ?? 0) + (blocksRef.current.find(b => b.id === lastId)?.h ?? 0);
    const totalH = sorted.reduce((s, id) => s + (blocksRef.current.find(b => b.id === id)?.h ?? 0), 0);
    const gap = Math.max(0, (lastY - firstY - totalH) / (sorted.length - 1));
    setBlockPositions(prev => {
      const next = { ...prev };
      let curY = firstY;
      sorted.forEach(id => {
        if (next[id]) next[id] = { ...next[id], y: Math.round(curY) };
        curY += (blocksRef.current.find(b => b.id === id)?.h ?? 0) + gap;
      });
      return next;
    });
  }, []);

  // ── A: Auto-arrange blocks by hierarchy ──────────────────────────────────
  const handleAutoArrange = useCallback(() => {
    // BUG SWEEP 7 AREA 5: Skip locked blocks when auto-arranging
    const stringBlocks = blocks.filter(b => b.kind === 'string' && !lockedBlockIds.has(b.id));
    const inverterBlocks = blocks.filter(b => b.kind === 'inverter' && !lockedBlockIds.has(b.id));
    const acPanelBlocks = blocks.filter(b => b.kind === 'ac-panel' && !lockedBlockIds.has(b.id));
    if (stringBlocks.length === 0 && inverterBlocks.length === 0) return;

    const GAP_Y = 14;
    const COL_GAP_X = 80;
    const updates: BlockPositions = {};

    // Sort strings by mpptId
    const sortedStrings = [...stringBlocks].sort((a, b) => ((a.meta?.mpptId as number) ?? 0) - ((b.meta?.mpptId as number) ?? 0));
    const strColX = 40;
    let curY = 40;
    sortedStrings.forEach(b => { updates[b.id] = { x: strColX, y: curY }; curY += b.h + GAP_Y; });

    const totalStrH = curY - GAP_Y - 40;
    const centerY = 40 + totalStrH / 2;

    // BUG-06 fix: Handle case where there are no strings (only inverter + AC panel)
    const strBlockWidth = sortedStrings.length > 0 ? (sortedStrings[0]?.w ?? 160) : 160;
    const invColX = strColX + strBlockWidth + COL_GAP_X;
    let invCurY = centerY - (inverterBlocks.reduce((s, b) => s + b.h + 16, 0) / 2);
    inverterBlocks.forEach(b => { updates[b.id] = { x: invColX, y: invCurY }; invCurY += b.h + 16; });

    const acColX = invColX + (inverterBlocks[0]?.w ?? 96) + COL_GAP_X;
    let acCurY = centerY - (acPanelBlocks.reduce((s, b) => s + b.h + 16, 0) / 2);
    acPanelBlocks.forEach(b => { updates[b.id] = { x: acColX, y: acCurY }; acCurY += b.h + 16; });

    // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
    setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
    setBlockPositions(prev => ({ ...prev, ...updates }));
    setTimeout(() => handleFitRef.current?.(), 60);
  }, [blocks, lockedBlockIds, setWireHistory]);

  // ── C: Fit-to-selection — zooms viewport to bounding box of selected blocks ─
  const handleFitToSelection = useCallback(() => {
    const sel = [...selectedBlockIdsRef.current];
    const single = selectedBlockIdRef.current;
    const ids = sel.length > 0 ? sel : (single ? [single] : []);
    if (ids.length === 0) { handleFitRef.current?.(); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach(id => {
      const p = blockPositionsRef.current[id];
      const b = blocksRef.current.find(bb => bb.id === id);
      if (!p || !b) return;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + b.w); maxY = Math.max(maxY, p.y + b.h);
    });
    if (minX === Infinity) return;
    const PAD = 64;
    const bw = maxX - minX + PAD * 2, bh = maxY - minY + PAD * 2;
    const svg = svgRef.current;
    if (!svg) return;
    const { width: sw, height: sh } = svg.getBoundingClientRect();
    if (!sw || !sh) return;
    const newZoom = Math.min(5, Math.max(0.15, Math.min(sw / bw, sh / bh)));
    setZoom(newZoom);
    setPan({ x: minX - PAD, y: minY - PAD });
  }, []);

  // Keep ref in sync so keyboard handler can always call the latest version (after render completes)
  useEffect(() => { handleFitToSelectionRef.current = handleFitToSelection; }, [handleFitToSelection]);

  // ── A: Wire crossing count ────────────────────────────────────────────────
  const wireCrossingCount = useMemo(() => {
    if (wires.length < 2) return 0;
    let crossings = 0;
    // Approximate: count pairs of wires whose straight-line segments (from→to) intersect
    const segs = wires.map(w => {
      const fb = blocks.find(b => b.id === w.fromBlockId);
      const tb = blocks.find(b => b.id === w.toBlockId);
      if (!fb || !tb) return null;
      const fp = blockPositions[w.fromBlockId];
      const tp = blockPositions[w.toBlockId];
      if (!fp || !tp) return null;
      const fPort = fb.ports.find(p => p.id === w.fromPortId);
      const tPort = tb.ports.find(p => p.id === w.toPortId);
      if (!fPort || !tPort) return null;
      const a = getPortWorldPos(fb, fp, fPort);
      const b = getPortWorldPos(tb, tp, tPort);
      return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
    }).filter(Boolean) as { ax: number; ay: number; bx: number; by: number }[];

    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const p = segs[i], q = segs[j];
        // Line segment intersection test
        const d1x = p.bx - p.ax, d1y = p.by - p.ay;
        const d2x = q.bx - q.ax, d2y = q.by - q.ay;
        const cross = d1x * d2y - d1y * d2x;
        if (Math.abs(cross) < 1e-10) continue; // parallel
        const t = ((q.ax - p.ax) * d2y - (q.ay - p.ay) * d2x) / cross;
        const u = ((q.ax - p.ax) * d1y - (q.ay - p.ay) * d1x) / cross;
        if (t > 0 && t < 1 && u > 0 && u < 1) crossings++;
      }
    }
    return crossings;
  }, [wires, blocks, blockPositions]);

  // ── D: Snapshot save/restore ──────────────────────────────────────────────
  const handleSaveSnapshot = useCallback(() => {
    const name = window.prompt('Nome do snapshot:')?.trim();
    if (!name) return;
    // BUG-03 fix: Lê de refs para evitar closure stale
    // BUG SWEEP 7 AREA 2: Deep copy positions and wires to avoid shared references
    // BUG SWEEP 10 AREA 6: Include wireLabels and blockNotes in snapshot
    setSnapshots(prev => [...prev.slice(-9), {
      id: `snap-${Date.now()}`,
      name,
      timestamp: Date.now(),
      positions: structuredClone(blockPositionsRef.current),
      wires: structuredClone(wiresRef.current),
      wireLabels: structuredClone(wireLabels),
      blockNotes: structuredClone(blockNotes),
    }]);
  }, [wireLabels, blockNotes]); // BUG SWEEP 10 AREA 6: Add wireLabels and blockNotes to deps

  const handleRestoreSnapshot = useCallback((snap: DiagramSnapshot) => {
    // BUG 9 fix: Clear undo/redo history when restoring snapshot to avoid confusing UX
    // (undoing after restore would go back to pre-restore state which is inconsistent)
    setWireHistory([]);
    setWireRedoStack([]);
    setBlockPositions(snap.positions);
    setWiresSafe(snap.wires);
    // BUG SWEEP 10 AREA 6: Restore wireLabels and blockNotes from snapshot
    setWireLabels(snap.wireLabels ?? {});
    setBlockNotes(snap.blockNotes ?? {});
    // BUG-09 fix: Reset all UI state when restoring snapshot to avoid inconsistency
    setSelectedBlockId(null);
    setSelectedBlockIds(new Set());
    setDraggingWire(null);
    draggingBlock.current = null;
    setIsDraggingBlock(false);
    setDraggingBlockId(null);
    setFlashBlockId(null);
    setEditingWireId(null);
    setEditingBlockNoteId(null);
    setWireDropFeedback(null);
    setSelectionRect(null);
    isRubberBanding.current = false;
    blockDragStartPosRef.current = null;
    groupDragStartPositions.current = {};
    setSnapshotPanelOpen(false);
  }, [setWiresSafe]);

  // ── D: JSON export/import ─────────────────────────────────────────────────
  // BUG-07 fix: Lê snapshots e wires de refs/state diretamente no callback
  const snapshotsRef = useRef<DiagramSnapshot[]>(snapshots);
  useEffect(() => { snapshotsRef.current = snapshots; }, [snapshots]);

  const handleExportJSON = useCallback(() => {
    // Lê estado atual via refs para evitar closure stale
    // BUG SWEEP 14 AREA 5: Include wireLabels, blockNotes, lockedBlockIds in export
    const data = JSON.stringify({
      blockPositions: blockPositionsRef.current,
      wires: wiresRef.current,
      wireLabels,
      blockNotes,
      lockedBlockIds: [...lockedBlockIds],
      snapshots: snapshotsRef.current
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diagrama-${activeInverter?.id ?? 'inv'}-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [activeInverter?.id, wireLabels, blockNotes, lockedBlockIds]);

  const importFileRef = useRef<HTMLInputElement>(null);
  const handleImportFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        // BUG SWEEP 6 AREA 4: Add type validation for imported data
        // BUG SWEEP 12 AREA 1: Save both wires AND positions in history before import
        let importSuccess = false;
        if (data.blockPositions && typeof data.blockPositions === 'object') {
          setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
          // BUG-13 fix: Filter orphan block IDs — only import positions for blocks that exist
          const validBlockIds = new Set(blocksRef.current.map(b => b.id));
          const filteredPositions: BlockPositions = {};
          Object.entries(data.blockPositions).forEach(([id, pos]) => {
            if (validBlockIds.has(id) && pos && typeof pos === 'object' && typeof (pos as any).x === 'number' && typeof (pos as any).y === 'number') {
              filteredPositions[id] = pos as Point;
            }
          });
          setBlockPositions(filteredPositions);
          importSuccess = true;
        }
        if (data.wires && Array.isArray(data.wires)) {
          // BUG SWEEP 6 AREA 4: Validate wire structure
          const validWires = data.wires.filter((w: any) =>
            w && typeof w === 'object' &&
            typeof w.id === 'string' &&
            typeof w.fromBlockId === 'string' &&
            typeof w.fromPortId === 'string' &&
            typeof w.toBlockId === 'string' &&
            typeof w.toPortId === 'string' &&
            typeof w.color === 'string'
          );
          if (validWires.length > 0) {
            setWiresSafe(validWires);
            importSuccess = true;
          }
        }
        // BUG SWEEP 14 AREA 5: Import wireLabels, blockNotes, lockedBlockIds
        if (data.wireLabels && typeof data.wireLabels === 'object') {
          setWireLabels(data.wireLabels);
          importSuccess = true;
        }
        if (data.blockNotes && typeof data.blockNotes === 'object') {
          setBlockNotes(data.blockNotes);
          importSuccess = true;
        }
        if (data.lockedBlockIds && Array.isArray(data.lockedBlockIds)) {
          setLockedBlockIds(new Set(data.lockedBlockIds.filter((id: any) => typeof id === 'string')));
          importSuccess = true;
        }
        if (data.snapshots && Array.isArray(data.snapshots)) {
          setSnapshots(data.snapshots);
          importSuccess = true;
        }
        // BUG SWEEP 6 AREA 4: User feedback on import result
        if (!importSuccess) {
          alert('Nenhum dado válido encontrado no arquivo JSON.');
        } else {
          // BUG SWEEP 7 AREA 10: Reset selection and auto-fit after import
          setSelectedBlockId(null);
          setSelectedBlockIds(new Set());
          setTimeout(() => handleFitRef.current?.(), 100);
        }
      } catch (err) {
        // BUG SWEEP 6 AREA 4: Show error message instead of silent fail
        alert('Erro ao importar: arquivo JSON inválido ou corrompido.');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-imported
  }, [setWiresSafe]);

  // ── Export: PNG download & clipboard ────────────────────────────────────
  // BUG SWEEP 11 AREA 3: Wrap PNG export in try/finally to restore UI state on error
  const handleExportPNG = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { w, h } = contentBoundsRef.current;
    if (w <= 0 || h <= 0) return;
    // Save current UI state before export
    const prevSelectedBlockId = selectedBlockIdRef.current;
    const prevSelectedBlockIds = new Set(selectedBlockIdsRef.current);
    try {
      // Clear selection for clean export
      setSelectedBlockId(null);
      setSelectedBlockIds(new Set());
      // Wait for re-render before capturing
      await new Promise(resolve => setTimeout(resolve, 50));
      const canvas = await svgToCanvas(svg, w, h, 2);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `diagrama-blocos-${Date.now()}.png`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      // Restore selection state
      setSelectedBlockId(prevSelectedBlockId);
      setSelectedBlockIds(prevSelectedBlockIds);
    }
  }, []);

  const handleCopyPNG = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { w, h } = contentBoundsRef.current;
    if (w <= 0 || h <= 0) return;
    // BUG SWEEP 11 AREA 3: Save and restore UI state
    const prevSelectedBlockId = selectedBlockIdRef.current;
    const prevSelectedBlockIds = new Set(selectedBlockIdsRef.current);
    try {
      setSelectedBlockId(null);
      setSelectedBlockIds(new Set());
      await new Promise(resolve => setTimeout(resolve, 50));
      const canvas = await svgToCanvas(svg, w, h, 2);
      canvas.toBlob(async blob => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
          // Clipboard API unavailable: fall back to download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `diagrama-blocos-${Date.now()}.png`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('PNG copy failed:', err);
    } finally {
      setSelectedBlockId(prevSelectedBlockId);
      setSelectedBlockIds(prevSelectedBlockIds);
    }
  }, []);

  // SVG export handler
  // BUG-27 fix: validate bounds before export
  // A10 fix: copiar defs/filters do documento original
  // BUG SWEEP 11 AREA 3: Wrap SVG export in try/finally to restore UI state
  const handleExport = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { w, h } = contentBoundsRef.current;
    if (w <= 0 || h <= 0) return;
    // Save current UI state before export
    const prevSelectedBlockId = selectedBlockIdRef.current;
    const prevSelectedBlockIds = new Set(selectedBlockIdsRef.current);
    try {
      // Clear selection for clean export
      setSelectedBlockId(null);
      setSelectedBlockIds(new Set());
      // Clone SVG and set full-content viewBox for export
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // A10 fix: copiar defs do SVG original se não existirem no clone
      const globalDefs = document.querySelectorAll('defs');
      if (globalDefs.length > 0) {
        let defsClone = clone.querySelector('defs');
        if (!defsClone) {
          defsClone = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          clone.prepend(defsClone);
        }
        globalDefs.forEach(d => {
          Array.from(d.children).forEach(child => {
            defsClone!.appendChild(child.cloneNode(true));
          });
        });
      }

      // Add dark background as first child (after defs)
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
      bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
      bg.setAttribute('fill', '#020617');
      const firstChildAfterDefs = clone.querySelector('defs')?.nextSibling ?? clone.firstChild;
      clone.insertBefore(bg, firstChildAfterDefs);

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
    } catch (err) {
      console.error('SVG export failed:', err);
    } finally {
      // Restore selection state
      setSelectedBlockId(prevSelectedBlockId);
      setSelectedBlockIds(prevSelectedBlockIds);
    }
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
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 border border-slate-800 ">
                <div className={`w-1.5 h-1.5 ${draggingWire ? 'bg-amber-400' : isDraggingBlock ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-600">
                  {draggingWire ? 'Conectando' : isDraggingBlock ? 'Movendo' : 'Selecionar'}
                </span>
              </div>
              {/* L2-I4: Save status indicator + timestamp */}
              {saveStatus === 'saving' && (
                <span className="text-[8px] text-amber-500 animate-pulse">Salvando…</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[8px] text-emerald-500">✓ Salvo</span>
              )}
              {saveStatus === 'idle' && lastSavedAt && (
                <span className="text-[8px] text-slate-700 font-mono">
                  {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              {/* D: Undo/redo history chips */}
              {(wireHistory.length > 0 || wireRedoStack.length > 0) && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900/60 border border-slate-800">
                  <span className="text-[7px] font-mono text-slate-600 tabular-nums">
                    ↩{wireHistory.length}
                  </span>
                  {wireRedoStack.length > 0 && (
                    <span className="text-[7px] font-mono text-slate-700 tabular-nums">
                      ↪{wireRedoStack.length}
                    </span>
                  )}
                </div>
              )}
              {/* Smart: connection completeness status chip */}
              {stringConnectionStatus.total > 0 && (
                <div className={`flex items-center gap-1 px-2 py-0.5 border text-[8px] font-mono font-bold uppercase transition-colors ${
                  stringConnectionStatus.allConnected
                    ? 'border-emerald-800/40 text-emerald-600 bg-emerald-950/30'
                    : 'border-amber-800/40 text-amber-600 bg-amber-950/20'
                }`}>
                  <div className={`w-1 h-1 ${stringConnectionStatus.allConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {stringConnectionStatus.allConnected
                    ? 'Completo'
                    : `${stringConnectionStatus.total - stringConnectionStatus.connected} sem fio`}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* A: Wire crossing count badge */}
            {wireCrossingCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/40">
                <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                <span className="text-[7px] font-mono text-amber-500 font-bold">{wireCrossingCount} cruzamento{wireCrossingCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {/* Smart: auto-connect unconnected strings — only visible when there's work to do */}
            {stringConnectionStatus.total > 0 && !stringConnectionStatus.allConnected && (
              <button
                onClick={handleAutoConnect}
                title={`Auto-conectar ${stringConnectionStatus.total - stringConnectionStatus.connected} string(s) pendente(s)`}
                className="flex items-center gap-1.5 px-2 py-1.5 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400/60 transition-colors bg-slate-900/40"
              >
                <Wand2 className="h-3 w-3" />
                <span className="text-[8px] font-bold uppercase tracking-widest">
                  Auto ({stringConnectionStatus.total - stringConnectionStatus.connected})
                </span>
              </button>
            )}
            {/* A: Auto-arrange by hierarchy */}
            <button onClick={handleAutoArrange} title="Organizar por hierarquia (strings → inversor → CA)"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-indigo-300 hover:border-indigo-600 transition-colors bg-slate-900/40">
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            {/* C: Lock selected block */}
            <button
              onClick={() => {
                const current = selectedBlockIdRef.current; // BUG SWEEP 10 AREA 2: read from ref for consistency
                if (!current) return;
                setLockedBlockIds(prev => { const n = new Set(prev); if (n.has(current)) n.delete(current); else n.add(current); return n; });
              }}
              title={selectedBlockId && lockedBlockIds.has(selectedBlockId) ? 'Desbloquear bloco (L)' : 'Bloquear bloco selecionado (L)'}
              className={`p-1.5 border transition-colors bg-slate-900/40 ${selectedBlockId && lockedBlockIds.has(selectedBlockId) ? 'border-amber-600/50 text-amber-400 hover:border-amber-500' : 'border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600'}`}
            >
              {selectedBlockId && lockedBlockIds.has(selectedBlockId) ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            </button>
            {/* D: Snapshot save/panel */}
            <button onClick={handleSaveSnapshot} title="Salvar snapshot nomeado"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-emerald-300 hover:border-emerald-700 transition-colors bg-slate-900/40">
              <Save className="h-3.5 w-3.5" />
            </button>
            {snapshots.length > 0 && (
              <button onClick={() => setSnapshotPanelOpen(v => !v)} title="Ver snapshots"
                className={`p-1.5 border transition-colors bg-slate-900/40 ${snapshotPanelOpen ? 'border-emerald-600/50 text-emerald-400' : 'border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600'}`}>
                <History className="h-3.5 w-3.5" />
              </button>
            )}
            {/* D: JSON export/import */}
            <button onClick={handleExportJSON} title="Exportar JSON"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40">
              <Upload className="h-3.5 w-3.5" />
            </button>
            <label title="Importar JSON" className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40 cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFileChange} />
            </label>
            <button
              onClick={handleExportPNG}
              title="Exportar PNG (alta resolução)"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopyPNG}
              title="Copiar imagem para clipboard"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExport}
              title="Exportar diagrama SVG"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleClearManualWires}
              title="Restaurar conexões automáticas"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetLayout}
              title="Resetar layout"
              className="p-1.5 border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 transition-colors bg-slate-900/40"
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
                    setActiveInverterId(inv.id);
                    setSelectedBlockId(null);
                  }}
                  className={cn(
                    'px-3 py-1.5 border text-[10px] font-mono uppercase tracking-widest transition-colors',
                    idx === activeInverterIdx
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                  )}
                >
                  INV {idx + 1} - {invCatalog?.model || inv.snapshot?.model || 'Inv.'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* C: Alignment toolbar — floats above canvas when 2+ blocks selected */}
      {selectedBlockIds.size >= 2 && (
        <div className="absolute top-[5.5rem] left-1/2 -translate-x-1/2 z-30 flex items-center gap-0 bg-slate-900/95 border border-slate-700 backdrop-blur-sm">
          {[
            { label: '↤', title: 'Alinhar esquerda', fn: handleAlignLeft },
            { label: '↔', title: 'Centralizar horizontal', fn: handleAlignCenterH },
            { label: '↦', title: 'Alinhar direita', fn: handleAlignRight },
          ].map(({ label, title, fn }) => (
            <button key={title} onClick={fn} title={title}
              className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800">
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-700" />
          {[
            { label: '↥', title: 'Alinhar topo', fn: handleAlignTop },
            { label: '↕', title: 'Centralizar vertical', fn: handleAlignCenterV },
            { label: '↧', title: 'Alinhar base', fn: handleAlignBottom },
          ].map(({ label, title, fn }) => (
            <button key={title} onClick={fn} title={title}
              className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800">
              {label}
            </button>
          ))}
          {selectedBlockIds.size >= 3 && (
            <>
              <div className="w-px h-4 bg-slate-700" />
              <button onClick={handleDistributeH} title="Distribuir horizontalmente"
                className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800">
                ⇔
              </button>
              <button onClick={handleDistributeV} title="Distribuir verticalmente"
                className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800">
                ⇕
              </button>
            </>
          )}
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button onClick={handleFitToSelection} title="Zoom para seleção (G)"
            className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800">
            ⊡
          </button>
          <span className="px-2 text-[7px] text-slate-600 font-mono">{selectedBlockIds.size} sel.</span>
          <button onClick={() => { setSelectedBlockIds(new Set()); setSelectedBlockId(null); }}
            title="Limpar seleção"
            className="px-2 py-1 text-[9px] font-mono text-slate-600 hover:text-red-400 transition-colors">
            ✕
          </button>
        </div>
      )}

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
            onPointerCancel={handleBgPointerCancel}
            onPointerLeave={handleBgPointerCancel}
          />

          {/* Dot grid + animation defs */}
          <defs>
            <style>{`@keyframes wire-flow { to { stroke-dashoffset: -12; } }`}</style>
            {/* A: Direction arrowhead — context-stroke inherits wire color */}
            <marker id="wire-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <polygon points="0,0 0,6 6,3" fill="context-stroke" opacity="0.7" />
            </marker>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="#1e293b" />
            </pattern>
            {isDraggingBlock && (
              <pattern id="snap-grid" x="0" y="0" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <line x1={GRID_SIZE} y1="0" x2={GRID_SIZE} y2={GRID_SIZE} stroke="#4f46e5" strokeWidth={0.25} />
                <line x1="0" y1={GRID_SIZE} x2={GRID_SIZE} y2={GRID_SIZE} stroke="#4f46e5" strokeWidth={0.25} />
              </pattern>
            )}
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
          {/* Snap-to-grid overlay during block drag */}
          {isDraggingBlock && (
            <rect
              x={-50000} y={-50000} width={100000} height={100000}
              fill="url(#snap-grid)" opacity={0.55}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* C: Crosshair cursor overlay */}
          {svgMousePos && !isDraggingBlock && !draggingWire && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={svgMousePos.x} y1={pan.y - 10000} x2={svgMousePos.x} y2={pan.y + 10000}
                stroke="#6366f1" strokeWidth={0.4} opacity={0.18} strokeDasharray="4 8" />
              <line x1={pan.x - 10000} y1={svgMousePos.y} x2={pan.x + 10000} y2={svgMousePos.y}
                stroke="#6366f1" strokeWidth={0.4} opacity={0.18} strokeDasharray="4 8" />
            </g>
          )}

          {/* Wire layer (below blocks) */}
          {wires.map(wire => (
            <WireRenderer
              key={wire.id}
              wire={wire}
              blocks={blocks}
              blockPositions={blockPositions}
              isHighlighted={selectedBlockWireIds.has(wire.id)}
              label={wireLabels[wire.id]}
              onDelete={(id) => {
                // BUG SWEEP 12 AREA 1: Save both wires AND positions in history
                setWireHistory(prev => [...prev.slice(-15), { wires: wiresRef.current, positions: blockPositionsRef.current }]);
                setWireRedoStack([]); // clear redo on delete
                setWires(prev => prev.filter(w => w.id !== id));
                // BUG 1.1 fix: Clean up wireLabels entry for deleted wire
                setWireLabels(prev => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
              }}
              onLabelDblClick={() => {
                setEditingWireId(wire.id);
                setEditingWireValue(wireLabels[wire.id] ?? '');
              }}
            />
          ))}

          {/* D: Flash removed wires in red during undo diff visual */}
          {flashRemovedWires.map(wire => {
            const fb = blocks.find(b => b.id === wire.fromBlockId);
            const tb = blocks.find(b => b.id === wire.toBlockId);
            if (!fb || !tb) return null;
            const fp = blockPositions[wire.fromBlockId];
            const tp = blockPositions[wire.toBlockId];
            if (!fp || !tp) return null;
            const fPort = fb.ports.find(p => p.id === wire.fromPortId);
            const tPort = tb.ports.find(p => p.id === wire.toPortId);
            if (!fPort || !tPort) return null;
            const fWorld = getPortWorldPos(fb, fp, fPort);
            const tWorld = getPortWorldPos(tb, tp, tPort);
            const flashPath = routeWire(fWorld, fPort.side, tWorld, tPort.side);
            return (
              <path key={`flash-${wire.id}`} d={flashPath}
                stroke="#ef4444" strokeWidth={3} fill="none" opacity={0.75}
                className="animate-pulse" style={{ pointerEvents: 'none' }} />
            );
          })}

          {/* No-wire hint */}
          {wires.length === 0 && blocks.length > 0 && (
            <text
              x={VIEW_W / 2}
              y={-24}
              textAnchor="middle"
              fill="#1e293b"
              fontSize={10}
              fontFamily="monospace"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              Arraste uma porta para conectar string → MPPT
            </text>
          )}

          {/* Rubber band wire */}
          {draggingWire && (() => {
            // B1 fix: usa cor do MPPT de destino quando há snapTarget
            const rubberBandColor = draggingWire.snapTarget
              ? (getMpptColorForPort(draggingWire.snapTarget.portId, blocks) ?? draggingWire.fromColor)
              : draggingWire.fromColor;
            return (
              <RubberBandWire
                from={draggingWire.fromPos}
                fromSide={draggingWire.fromSide}
                to={draggingWire.snapTarget?.pos || draggingWire.livePos}
                toSide={draggingWire.snapTarget?.side}
                color={rubberBandColor}
                hasSnap={draggingWire.snapTarget !== null}
              />
            );
          })()}

          {/* A: Wire label inline editor */}
          {editingWireId && (() => {
            const wire = wires.find(w => w.id === editingWireId);
            if (!wire) return null;
            const fb = blocks.find(b => b.id === wire.fromBlockId);
            const tb = blocks.find(b => b.id === wire.toBlockId);
            if (!fb || !tb) return null;
            const fp = blockPositions[wire.fromBlockId];
            const tp = blockPositions[wire.toBlockId];
            if (!fp || !tp) return null;
            const fPort = fb.ports.find(p => p.id === wire.fromPortId);
            const tPort = tb.ports.find(p => p.id === wire.toPortId);
            if (!fPort || !tPort) return null;
            const fW = getPortWorldPos(fb, fp, fPort);
            const tW = getPortWorldPos(tb, tp, tPort);
            const mx = (fW.x + tW.x) / 2;
            const my = (fW.y + tW.y) / 2;
            return (
              <foreignObject x={mx - 44} y={my - 32} width={88} height={18} style={{ overflow: 'visible' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <input ref={(el: any) => el?.focus()} type="text" value={editingWireValue}
                  onChange={e => setEditingWireValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setWireLabels(prev => ({ ...prev, [editingWireId]: editingWireValue }));
                      setEditingWireId(null);
                    }
                    // BUG-04 fix: Escape should cancel edit and revert to original value
                    if (e.key === 'Escape') {
                      setEditingWireValue(wireLabels[editingWireId] ?? '');
                      setEditingWireId(null);
                    }
                  }}
                  onBlur={() => {
                    const currentWireId = editingWireId;
                    setWireLabels(prev => ({ ...prev, [currentWireId]: editingWireValue }));
                    setEditingWireId(null);
                  }}
                  style={{ width: '100%', height: '18px', background: '#0f172a', border: `1px solid ${wire.color}`,
                    color: wire.color, fontSize: '8px', fontFamily: 'monospace', padding: '1px 4px',
                    outline: 'none', textAlign: 'center' }}
                />
              </foreignObject>
            );
          })()}

          {/* B: Block note inline editor */}
          {editingBlockNoteId && (() => {
            const blk = blocks.find(b => b.id === editingBlockNoteId);
            const bpos = blockPositions[editingBlockNoteId];
            if (!blk || !bpos) return null;
            return (
              <foreignObject x={bpos.x} y={bpos.y - 36} width={blk.w} height={18} style={{ overflow: 'visible' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <input ref={(el: any) => el?.focus()} type="text" value={editingBlockNoteValue}
                  placeholder="Nota…"
                  onChange={e => setEditingBlockNoteValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setBlockNotes(prev => ({ ...prev, [editingBlockNoteId]: editingBlockNoteValue }));
                      setEditingBlockNoteId(null);
                    }
                    // BUG-05 fix: Escape should cancel edit and revert to original value
                    if (e.key === 'Escape') {
                      setEditingBlockNoteValue(blockNotes[editingBlockNoteId] ?? '');
                      setEditingBlockNoteId(null);
                    }
                  }}
                  onBlur={() => {
                    const currentBlockNoteId = editingBlockNoteId;
                    const currentValue = editingBlockNoteValue;
                    setBlockNotes(prev => currentValue.trim()
                      ? { ...prev, [currentBlockNoteId]: currentValue }
                      : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== currentBlockNoteId))
                    );
                    setEditingBlockNoteId(null);
                  }}
                  style={{ width: '100%', height: '18px', background: '#0f172a', border: '1px solid #854d0e',
                    color: '#fcd34d', fontSize: '8px', fontFamily: 'monospace', padding: '1px 4px', outline: 'none' }}
                />
              </foreignObject>
            );
          })()}

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
              {/* UX-04: Rejection reason tooltip */}
              {wireDropFeedback.reason && (
                <text
                  x={wireDropFeedback.x}
                  y={wireDropFeedback.y - 18}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {wireDropFeedback.reason}
                </text>
              )}
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
                isFlashing={flashBlockId === block.id}
                snapTargetPortId={snapTargetPortId}
                draggingWire={draggingWire}
                connectedPortIds={connectedPortsByBlock[block.id]}
                draggingFromPortType={draggingFromPortType}
                isMultiSelected={selectedBlockIds.size > 1 && selectedBlockIds.has(block.id)}
                isDragging={draggingBlockId === block.id}
                isLocked={lockedBlockIds.has(block.id)}
                zoom={zoom}
                note={blockNotes[block.id]}
                onPointerDown={(e) => handleBlockPointerDown(e, block.id)}
                onPortPointerDown={(e, portId) => handlePortPointerDown(e, block.id, portId)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingBlockNoteId(block.id);
                  setEditingBlockNoteValue(blockNotes[block.id] ?? '');
                }}
                onClick={(e) => {
                  if (e.shiftKey) {
                    // Shift+click: toggle in multi-select
                    setSelectedBlockIds(prev => {
                      const next = new Set(prev);
                      if (next.has(block.id)) next.delete(block.id); else next.add(block.id);
                      return next;
                    });
                    setSelectedBlockId(null);
                  } else {
                    // BUG SWEEP 13 AREA 5: Regular click on already-selected block in multi-select should switch to single-select
                    // If block is already the only selected one, toggle it off; otherwise make it the only selection
                    const isOnlySelected = selectedBlockId === block.id && selectedBlockIds.size === 1;
                    setSelectedBlockId(isOnlySelected ? null : block.id);
                    setSelectedBlockIds(new Set(isOnlySelected ? [] : [block.id]));
                  }
                }}
              />
            );
          })}

          {/* Rubber-band selection rect */}
          {selectionRect && (
            <rect
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x2 - selectionRect.x1)}
              height={Math.abs(selectionRect.y2 - selectionRect.y1)}
              fill="#6366f115" stroke="#6366f1" strokeWidth={0.8}
              strokeDasharray="5 3" opacity={0.85}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* C: Minimap — bottom-left overview of all blocks + viewport indicator */}
        {blocks.length > 0 && (
          <div className="absolute bottom-3 left-3 z-20 border border-slate-800 bg-slate-950/90 backdrop-blur-sm overflow-hidden" title="Minimapa">
            <svg width={108} height={76} viewBox={`0 0 ${contentBounds.w} ${contentBounds.h}`} style={{ display: 'block' }}>
              {blocks.map(b => {
                const p = blockPositions[b.id];
                if (!p) return null;
                const fill = b.kind === 'string' ? ((b.meta?.mpptColor as string) || '#6366f1') : b.kind === 'inverter' ? '#7dd3fc' : '#10b981';
                return <rect key={b.id} x={p.x} y={p.y} width={b.w} height={b.h} fill={fill} opacity={0.55} />;
              })}
              {/* Viewport indicator */}
              {/* BUG-08 fix: strokeWidth relativo ao minimap, não ao conteúdo */}
              {/* BUG-02 fix: enforce minimum stroke width of 3 to keep viewport rect visible */}
              <rect x={pan.x} y={pan.y}
                width={contentBounds.w / zoom} height={contentBounds.h / zoom}
                fill="#6366f110" stroke="#6366f1" strokeWidth={Math.max(3, contentBounds.w / 200)} opacity={0.5} />
            </svg>
          </div>
        )}

        {/* C: Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}>
            <div className="bg-slate-950 border border-slate-700 p-5 min-w-[260px] shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Atalhos de Teclado</span>
                <button onClick={() => setShowShortcuts(false)} className="text-slate-600 hover:text-white text-xs">✕</button>
              </div>
              <div className="space-y-1.5">
                {[
                  ['Tab / Shift+Tab', 'Ciclar blocos'],
                  ['Esc', 'Desselecionar / cancelar fio'],
                  ['Del / Backspace', 'Remover fios do bloco selecionado'],
                  ['Ctrl+Z', 'Desfazer'],
                  ['Ctrl+Y / Ctrl+Shift+Z', 'Refazer'],
                  ['+  /  −', 'Zoom in / out'],
                  ['F', 'Fit to view'],
                  ['L', 'Bloquear/desbloquear bloco'],
                  ['Shift+Drag', 'Seleção em área'],
                  ['Shift+Click', 'Adicionar à seleção'],
                  ['G', 'Zoom para seleção'],
                  ['Duplo-clique (bloco)', 'Editar nota (Alt+N limpa)'],
                  ['Duplo-clique (fio)', 'Editar rótulo do fio'],
                  ['?', 'Esta janela'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <kbd className="text-[8px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-slate-300">{key}</kbd>
                    <span className="text-[9px] text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* D: Snapshot panel */}
        {snapshotPanelOpen && snapshots.length > 0 && (
          <div className="absolute top-12 right-3 z-40 w-64 bg-slate-950 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Snapshots</span>
              <button onClick={() => setSnapshotPanelOpen(false)} className="text-slate-600 hover:text-white text-xs">✕</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {snapshots.slice().reverse().map(snap => (
                <div key={snap.id} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono text-slate-200 font-bold truncate">{snap.name}</div>
                    <div className="text-[7px] text-slate-600 font-mono">
                      {new Date(snap.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{Object.keys(snap.positions).length} blocos · {snap.wires.length} fios
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleRestoreSnapshot(snap)}
                      className="text-[8px] px-1.5 py-0.5 border border-emerald-800/50 text-emerald-500 hover:bg-emerald-950/30 transition-colors font-mono">
                      Restaurar
                    </button>
                    <button onClick={() => setSnapshots(prev => prev.filter(s => s.id !== snap.id))}
                      className="text-[8px] text-slate-700 hover:text-red-400 transition-colors px-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <ZoomControls zoom={zoom} panelOpen={selectedNode !== null} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFit={handleFit} onExport={handleExport} />

      {/* Footer: Legenda */}
      <div className="z-10 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-3">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3 flex-wrap">
            {(() => {
              if (!blocks.length) return <span className="text-[9px] text-slate-700 uppercase font-bold">Layer 2</span>;
              const inverterBlock = blocks.find(b => b.kind === 'inverter');
              if (!inverterBlock) return null;
              const mppts = inverterBlock.ports.filter(p => p.type === 'mppt-in')
                .reduce((acc, p) => {
                  const k = p.mpptIndex ?? 0;
                  if (!acc.has(k)) acc.set(k, p.color);
                  return acc;
                }, new Map<number, string>());
              return [...mppts.entries()].map(([idx, color]) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-4 h-[2px]" style={{ backgroundColor: color }} />
                  <span className="text-[8px] font-bold uppercase" style={{ color }}>M{idx + 1}</span>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 " />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
              Saída CA (AC)
            </span>
            <span className="text-[8px] text-slate-700 font-mono ml-auto tabular-nums">
              {Math.round(zoom * 100)}% · {contentBounds.w}×{contentBounds.h}
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
                  <div className="w-2.5 h-2.5 " style={{ backgroundColor: color }} />
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
          connectedPortIds={connectedPortsByBlock[selectedNode.id]}
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
