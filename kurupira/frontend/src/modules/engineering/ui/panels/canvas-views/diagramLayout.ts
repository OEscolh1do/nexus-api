/**
 * diagramLayout.ts — Tipos, constantes e motor de layout do DiagramCanvasView (Layer 2)
 *
 * Extrai a lógica de layout (buildInitialLayout) e as definições de dados do canvas
 * para manter DiagramCanvasView focado na camada de interação/renderização.
 *
 * Consumidores: DiagramCanvasView.tsx
 */

import type { InverterState, StringDef } from '../../../store/useTechStore';
import type { InverterCatalogItem, BlockDiagramFootprint } from '@/core/schemas/inverterSchema';

// =============================================================================
// TYPES
// =============================================================================

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Point = { x: number; y: number };
export type PortType = 'string-out' | 'mppt-in' | 'ac-out' | 'ac-in';

export interface FlexiblePort {
  id: string;
  side: Side;
  offset: number;   // 0..1 along the side
  type: PortType;
  mpptIndex?: number;
  label: string;
  color: string;
}

export interface DiagramBlock {
  id: string;
  kind: 'inverter' | 'string' | 'ac-panel';
  w: number;
  h: number;
  ports: FlexiblePort[];
  label: string;
  subLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

export type BlockPositions = Record<string, Point>;

export interface DiagramWire {
  id: string;
  fromBlockId: string;
  fromPortId: string;
  toBlockId: string;
  toPortId: string;
  color: string;
  label?: string; // A: user-defined annotation label shown at wire midpoint
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const MPPT_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#fb923c', '#a855f7'];

export const SNAP_RADIUS = 28;
export const VIEW_W = 800;
export const VIEW_H = 600;
export const BLOCK_STRING_W = 160;
export const BLOCK_STRING_H = 48;
export const BLOCK_INV_W = 160;
export const BLOCK_AC_W = 96;
export const BLOCK_AC_H = 48;
export const GRID_SIZE = 24;

// =============================================================================
// LAYOUT ENGINE
// =============================================================================

/**
 * Constrói o layout inicial do diagrama de blocos a partir do estado do inversor.
 *
 * Responsabilidades:
 * - Cria blocos de string, inversor e painel CA
 * - Posiciona blocos no canvas
 * - Gera os fios de conexão
 * - Respeita o footprint do catálogo (entradas MPPT, fases, labels)
 */
export function buildInitialLayout(
  inverter: InverterState,
  catalogItem: InverterCatalogItem | undefined,
  footprint: BlockDiagramFootprint | null
): { blocks: DiagramBlock[]; positions: BlockPositions; wires: DiagramWire[] } {
  const blocks: DiagramBlock[] = [];
  const positions: BlockPositions = {};
  const wires: DiagramWire[] = [];

  const mpptCount = inverter.mpptConfigs.length;

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
        // BUG SWEEP 14 AREA 8: Use chIdx instead of ch.mpptIndex to ensure unique port IDs
        // (catalog may have duplicate or non-sequential mpptIndex values)
        inverterPorts.push({
          id: `mppt-${chIdx}-in${i}`,
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
    subLabel: catalogItem?.model || inverter.snapshot?.model || 'Inversor',
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
      // BUG SWEEP 14 AREA 10: Use chIdx (not mppt.mpptId) to match inverter port ID scheme
      const toPortId = `mppt-${chIdx >= 0 ? chIdx : mpptIdx}-in${inputIdx}`;

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
  // BUG SWEEP 12 AREA 6: Fix centering math — add initial offset back when calculating invY
  const totalStringsHeight = currentY - 24;
  const invY = totalStringsHeight > invH ? 24 + (totalStringsHeight - invH) / 2 : 24;
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
