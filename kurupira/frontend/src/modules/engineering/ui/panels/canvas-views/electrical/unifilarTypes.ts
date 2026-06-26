/**
 * unifilarTypes — Types, constants and colour helpers for UnifilarSchematicCanvas
 *
 * Extracted from UnifilarSchematicCanvas.tsx (H1) to keep the main file under budget.
 * All layout geometry constants live here so both the layout engine and the canvas
 * component can share them without import cycles.
 */

import type React from 'react';

// =============================================================================
// CSS VAR HELPER
// =============================================================================

/** Allows CSS custom properties (--x: value) in React style objects without TS errors. */
export type CSSV = React.CSSProperties & { [k: string]: string | number | undefined };

// =============================================================================
// SCHEMATIC TYPES
// =============================================================================

// ── Node data types (discriminated union) ───────────────────────────────────
export type SchematicNodeData =
  | { type: 'pv-string'; string: any; mpptId: number; mpptIdx: number; mpptColor: string; fuseRef: string; unitPmax: number; moduleModel: string; }
  | { type: 'fuse'; stringId: string; mpptId: number; mpptIdx: number; mpptColor: string; refDesig: string; }
  | { type: 'bus-bar'; mpptId: number; mpptIdx: number; mpptColor: string; }
  | { type: 'dps-tap'; mpptId: number; mpptIdx: number; mpptColor: string; refDesig: string; }
  | { type: 'dc-switch'; mpptIdx: number; mpptId: number; mpptColor: string; refDesig: string; }
  | { type: 'inverter'; inverter: any; catalogItem: any; mpptCount: number; refDesig: string; }
  | { type: 'ac-breaker'; refDesig: string; }
  | { type: 'meter'; refDesig: string; }
  | { type: 'grid'; phase: 'tri' | 'mono'; }
  | { type: 'earth-symbol'; mpptIdx?: number; mpptId?: number; };

export interface SchematicNode {
  id: string;
  type: 'pv-string' | 'fuse' | 'bus-bar' | 'dps-tap' | 'dc-switch' | 'inverter' | 'ac-breaker' | 'meter' | 'grid' | 'earth-symbol';
  x: number; y: number; w: number; h: number;
  data: SchematicNodeData;
}

export interface SchematicWire {
  id: string;
  mpptIdx: number;
  polarity: 'dc' | 'ac' | 'gnd';
  path: string;
  nodeIds: string[];
}

export interface SchematicLabel {
  id: string;
  text: string;
  x: number; y: number;
  rotate?: number;
  color: string;
  fontSize: number;
  anchor: 'start' | 'middle' | 'end';
  bold?: boolean;
  category?: 'designator' | 'electrical';
}

export interface SchematicMarker {
  id: string;
  x: number; y: number;
  severity: 'error' | 'warn';
  messages: string[];
}

export interface JunctionDot {
  id: string;
  x: number; y: number;
  color: string;
}

export interface UnifilarLayout {
  nodes: SchematicNode[];
  wires: SchematicWire[];
  labels: SchematicLabel[];
  markers: SchematicMarker[];
  junctions: JunctionDot[];
  viewBox: { x: number; y: number; w: number; h: number };
}

export interface MpptValidationError {
  severity: 'error' | 'warn';
  messages: string[];
}

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

export const PAD_X = 68;
export const PAD_Y = 64;
export const PV_W = 62;   // IEC 60617 compact symbol (no info panel inside)
export const PV_H = 46;   // Proportional rectangle — taller for clean diagonal + radiation arrows
export const STR_GAP = 28; // Extra gap to accommodate external below-symbol annotation
export const MPPT_GAP = 48;

export const FUSE_X_OFFSET = 24;
export const FUSE_W = 22;
export const FUSE_H = 13;

// BUS_X = PAD_X + PV_W + FUSE_X_OFFSET + FUSE_W + 28 = 68+62+24+22+28 = 204
export const BUS_X = PAD_X + PV_W + FUSE_X_OFFSET + FUSE_W + 28;

export const DPS_TAP_X = BUS_X + 56;        // = 260
export const DC_SWITCH_W = 16;
export const DC_SWITCH_H = 16;
export const DC_SWITCH_X = DPS_TAP_X + 36;  // = 296 — chave seccionadora CC (NBR 16690 §5.4)
export const INV_X = DC_SWITCH_X + DC_SWITCH_W + 22;  // = 334
export const INV_W = 96;
export const INV_H_BASE = 80;
export const MPPT_PORT_SPACING = 38;

export const AC_OUT_X = INV_X + INV_W;      // = 430
export const BREAKER_X = AC_OUT_X + 36;     // = 466
export const BREAKER_W = 18;
export const BREAKER_H = 18;
export const METER_W = 22;
export const METER_H = 22;
export const METER_X = BREAKER_X + BREAKER_W + 20; // = 504 — medidor bidirecional
export const GRID_X = METER_X + METER_W + 20;       // = 546
export const GRID_W = 40;
export const GRID_H = 46;

export const DPS_W = 14;
export const DPS_H = 24;

// =============================================================================
// COLOUR PALETTE
// =============================================================================

export const MPPT_PALETTE = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981',
  '#f43f5e', '#06b6d4', '#fb923c', '#a855f7',
];

export const getMpptColor = (idx: number) => MPPT_PALETTE[idx % MPPT_PALETTE.length];

// BUG-11 fix: module-level constant — prevents a new Set being allocated every render.
// Nodes starting with 'earth-' are also always visible (checked with startsWith in render).
export const ALWAYS_VISIBLE_NODE_IDS = new Set(['inverter', 'ac-breaker', 'meter', 'grid']);
