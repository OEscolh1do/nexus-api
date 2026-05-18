/**
 * UnifilarSchematicCanvas — Layer 3 CAD Engine v2
 *
 * Diagrama Unifilar IEC 60617 / NBR 16690 em SVG puro.
 * Topologia: PV String → Fusível [Fn] → Bus CC → DPS [DPSn] → Inversor [INV-01] → DJ [DJ1] → Rede
 *
 * P0 features:
 *   • Pan / Zoom  (scroll + drag)
 *   • Labels nos condutores (seção de cabo, Voc, Isc)
 *   • Designadores de referência (F1…Fn, DPS1…n, INV-01, DJ1)
 *   • Marcadores de validação diretamente no canvas (⚠ / ✕ por MPPT)
 */

import React, {
  useMemo, useState, useCallback, useRef, useEffect,
} from 'react';
import type { InverterState, MPPTConfig, StringDef } from '../../../../store/useTechStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { Zap, X, Info, ZoomIn, ZoomOut, Maximize2, Download, Tag, ChevronRight } from 'lucide-react';

// =============================================================================
// 1. TYPES
// =============================================================================

interface SchematicNode {
  id: string;
  type: 'pv-string' | 'fuse' | 'bus-bar' | 'dps-tap' | 'dc-switch' | 'inverter' | 'ac-breaker' | 'meter' | 'grid' | 'earth-symbol';
  x: number; y: number; w: number; h: number;
  data: any;
}

interface SchematicWire {
  id: string;
  mpptIdx: number;
  polarity: 'dc' | 'ac' | 'gnd';
  path: string;
  nodeIds: string[];
}

interface SchematicLabel {
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

interface SchematicMarker {
  id: string;
  x: number; y: number;
  severity: 'error' | 'warn';
  messages: string[];
}

interface JunctionDot {
  id: string;
  x: number; y: number;
  color: string;
}

interface UnifilarLayout {
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
// 2. CONSTANTS
// =============================================================================

const PAD_X = 68;
const PAD_Y = 64;
const PV_W = 62;   // IEC 60617 compact symbol (no info panel inside)
const PV_H = 46;   // Proportional rectangle — taller for clean diagonal + radiation arrows
const STR_GAP = 28; // Extra gap to accommodate external below-symbol annotation
const MPPT_GAP = 48;

const FUSE_X_OFFSET = 24;
const FUSE_W = 22;
const FUSE_H = 13;

// BUS_X = PAD_X + PV_W + FUSE_X_OFFSET + FUSE_W + 28 = 68+62+24+22+28 = 204
const BUS_X = PAD_X + PV_W + FUSE_X_OFFSET + FUSE_W + 28;

const DPS_TAP_X = BUS_X + 56;        // = 260
const DC_SWITCH_W = 16;
const DC_SWITCH_H = 16;
const DC_SWITCH_X = DPS_TAP_X + 36;  // = 296 — chave seccionadora CC (NBR 16690 §5.4)
const INV_X = DC_SWITCH_X + DC_SWITCH_W + 22;  // = 334
const INV_W = 96;
const INV_H_BASE = 80;
const MPPT_PORT_SPACING = 38;

const AC_OUT_X = INV_X + INV_W;      // = 430
const BREAKER_X = AC_OUT_X + 36;     // = 466
const BREAKER_W = 18;
const BREAKER_H = 18;
const METER_W = 22;
const METER_H = 22;
const METER_X = BREAKER_X + BREAKER_W + 20; // = 504 — medidor bidirecional
const GRID_X = METER_X + METER_W + 20;       // = 546
const GRID_W = 40;
const GRID_H = 46;

const DPS_W = 14;
const DPS_H = 24;

// =============================================================================
// 3. COLOUR PALETTE
// =============================================================================

const MPPT_PALETTE = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981',
  '#f43f5e', '#06b6d4', '#fb923c', '#a855f7',
];

// BUG-11 fix: module-level constant — prevents a new Set being allocated every render.
// Nodes starting with 'earth-' are also always visible (checked with startsWith in render).
const ALWAYS_VISIBLE_NODE_IDS = new Set(['inverter', 'ac-breaker', 'meter', 'grid']);
const getMpptColor = (idx: number) => MPPT_PALETTE[idx % MPPT_PALETTE.length];

// =============================================================================
// 4. LAYOUT ENGINE
// =============================================================================

function computeUnifilarLayout(
  inverter: InverterState,
  catalogItem: InverterCatalogItem | undefined,
  mpptMetrics: Record<number, any>,
  validationErrors?: Record<number, MpptValidationError>,
): UnifilarLayout {
  const nodes: SchematicNode[] = [];
  const wires: SchematicWire[] = [];
  const labels: SchematicLabel[] = [];
  const markers: SchematicMarker[] = [];
  const junctions: JunctionDot[] = [];

  const mpptCount = inverter.mpptConfigs.length;
  const symbolH = catalogItem?.symbolConfig?.dimensions?.height;
  const invH = symbolH
    ? Math.max(symbolH, mpptCount * 20 + 24)  // garante que as portas cabem
    : Math.max(INV_H_BASE, mpptCount * MPPT_PORT_SPACING + 28);
  const invY = PAD_Y;

  let currentY = PAD_Y;
  let fuseCounter = 1;
  let dpsCounter = 1;

  inverter.mpptConfigs.forEach((mppt, mpptIdx) => {
    const strings: StringDef[] = mppt.strings || [];
    const mpptColor = getMpptColor(mpptIdx);
    const fuseLeftX = PAD_X + PV_W + FUSE_X_OFFSET;
    const metrics = mpptMetrics[mppt.mpptId];

    if (strings.length === 0) {
      currentY += PV_H + MPPT_GAP;
      return;
    }

    const stringCenterYs: number[] = [];
    const stringCenterMap = new Map<string, number>(); // str.id → centerY

    // ── String nodes + Fuse nodes ────────────────────────────────────────
    strings.forEach((str) => {
      // Skip string if it has no modules
      const unitIsc = metrics?.unitIsc ?? 0;
      if (str.modulesCount === 0) return;

      const cy = currentY + PV_H / 2;
      stringCenterYs.push(cy);
      stringCenterMap.set(str.id, cy);
      const fuseRef = `F${fuseCounter++}`;

      nodes.push({
        id: `pv-${mppt.mpptId}-${str.id}`,
        type: 'pv-string',
        x: PAD_X, y: currentY, w: PV_W, h: PV_H,
        data: {
          string: str,
          mpptId: mppt.mpptId,
          mpptIdx,
          mpptColor,
          fuseRef,
          unitPmax: metrics?.unitPmax ?? 0,
          moduleModel: metrics?.moduleModel ?? '',
        },
      });

      nodes.push({
        id: `fuse-${mppt.mpptId}-${str.id}`,
        type: 'fuse',
        x: fuseLeftX, y: cy - FUSE_H / 2, w: FUSE_W, h: FUSE_H,
        data: { stringId: str.id, mpptId: mppt.mpptId, mpptIdx, mpptColor, refDesig: fuseRef },
      });

      // Wire: PV → fuse
      wires.push({
        id: `w-pv-fuse-${mppt.mpptId}-${str.id}`,
        mpptIdx, polarity: 'dc',
        path: `M ${PAD_X + PV_W} ${cy} H ${fuseLeftX}`,
        nodeIds: [`pv-${mppt.mpptId}-${str.id}`, `fuse-${mppt.mpptId}-${str.id}`],
      });

      // Wire: fuse → bus bar
      wires.push({
        id: `w-fuse-bus-${mppt.mpptId}-${str.id}`,
        mpptIdx, polarity: 'dc',
        path: `M ${fuseLeftX + FUSE_W} ${cy} H ${BUS_X}`,
        nodeIds: [`fuse-${mppt.mpptId}-${str.id}`, `bus-${mppt.mpptId}`],
      });

      // Junction dot where wire meets bus bar
      junctions.push({
        id: `junction-bus-${mppt.mpptId}-${str.id}`,
        x: BUS_X,
        y: cy,
        color: mpptColor,
      });

      // ── GAP A: Label de polaridade (+) no condutor CC ────────────────
      // IEC 60617 / NBR 16690: condutores CC devem indicar polaridade
      labels.push({
        id: `lbl-pol-${str.id}`,
        text: '+',
        x: PAD_X + PV_W + 4,
        y: cy - 3,
        color: '#f87171', fontSize: 8, anchor: 'start', bold: true,
        category: 'electrical',
      });

      // ── GAP B: Seção + material + classe de tensão do cabo CC ─────────
      // NBR 16612: cabos PV devem ter isolação para 1,5 kV CC
      if (str.cableSection > 0) {
        labels.push({
          id: `lbl-cable-${str.id}`,
          text: `${str.cableSection}mm² Cu · PV1,5kV`,
          x: PAD_X + PV_W + FUSE_X_OFFSET / 2,
          y: cy - 9,
          color: '#64748b', fontSize: 6.5, anchor: 'middle',
          category: 'electrical',
        });
      }

      // ── Label: designador do fusível ─────────────────────────────────
      labels.push({
        id: `lbl-fuse-ref-${str.id}`,
        text: fuseRef,
        x: fuseLeftX + FUSE_W / 2,
        y: cy - FUSE_H / 2 - 6,
        color: '#f1f5f9', fontSize: 8, anchor: 'middle', bold: true,
        category: 'designator',
      });

      // ── GAP C: Corrente nominal + capacidade de interrupção CC ────────
      // NBR 16690: corrente ≥ 1,56 × Isc; fusível gPV com Icu CC
      const fuseA = Math.ceil(1.56 * unitIsc * 10) / 10;
      labels.push({
        id: `lbl-fuse-a-${str.id}`,
        text: unitIsc > 0 ? `${fuseA.toFixed(1)}A gPV / 10kA CC` : 'gPV / 10kA CC',
        x: fuseLeftX + FUSE_W + 4,
        y: cy + 1,
        color: '#0284c7',
        fontSize: 6.5,
        anchor: 'start',
        category: 'electrical',
      });

      currentY += PV_H + STR_GAP;
    });

    // Guard: skip MPPT if all strings were invalid
    if (stringCenterYs.length === 0) {
      currentY += MPPT_GAP;
      return;
    }

    const groupCenterY = stringCenterYs.reduce((a, b) => a + b, 0) / stringCenterYs.length;
    const busY1 = stringCenterYs[0];
    const busY2 = stringCenterYs[stringCenterYs.length - 1];

    // ── Bus bar ──────────────────────────────────────────────────────────
    nodes.push({
      id: `bus-${mppt.mpptId}`,
      type: 'bus-bar',
      x: BUS_X - 2, y: busY1, w: 4, h: Math.max(1, busY2 - busY1),
      data: { mpptId: mppt.mpptId, mpptIdx, mpptColor },
    });

    // ── DPS ──────────────────────────────────────────────────────────────
    const dpsRef = `DPS${dpsCounter++}`;
    nodes.push({
      id: `dps-${mppt.mpptId}`,
      type: 'dps-tap',
      x: DPS_TAP_X - DPS_W / 2, y: groupCenterY + 6, w: DPS_W, h: DPS_H,
      data: { mpptId: mppt.mpptId, mpptIdx, mpptColor, refDesig: dpsRef },
    });

    // ── Labels elétricos no bus ──────────────────────────────────────────
    if (metrics?.vocFrio > 0) {
      labels.push({
        id: `lbl-voc-${mppt.mpptId}`,
        text: `Voc: ${metrics.vocFrio.toFixed(0)}V`,
        x: BUS_X + 8, y: groupCenterY - 12,
        color: '#94a3b8', fontSize: 7.5, anchor: 'start',
        category: 'electrical',
      });
    }
    if (metrics?.iscTotal > 0) {
      labels.push({
        id: `lbl-isc-${mppt.mpptId}`,
        text: `Isc: ${metrics.iscTotal.toFixed(1)}A`,
        x: BUS_X + 8, y: groupCenterY + 14,
        color: '#94a3b8', fontSize: 7.5, anchor: 'start',
        category: 'electrical',
      });
    }

    // ── GAP D: Label DPS com Uc e In ────────────────────────────────────
    // IEC 61643: especificação mínima = Tipo, Uc, In descarga
    // Uc deve ser ≥ Voc frio; escolher próximo valor comercial
    const vocFrioVal = metrics?.vocFrio ?? 0;
    const ucV = vocFrioVal > 0
      ? ([600, 800, 1000, 1100, 1200].find(v => v >= Math.ceil(vocFrioVal)) ?? 1200)
      : 1000;
    labels.push({
      id: `lbl-dps-ref-${mppt.mpptId}`,
      text: `${dpsRef} CC`,
      x: DPS_TAP_X + 2,
      y: groupCenterY + 4,
      color: '#f1f5f9', fontSize: 8.5, anchor: 'middle', bold: true,
      category: 'designator',
    });
    labels.push({
      id: `lbl-dps-spec-${mppt.mpptId}`,
      text: `T.II · Uc≥${ucV}V · 5kA`,
      x: DPS_TAP_X + 11,
      y: groupCenterY + 15,
      color: '#78716c', fontSize: 6, anchor: 'start',
      category: 'electrical',
    });

    // ── GAP J: Seccionador CC com label "DC Disc." ────────────────────────────
    // NT.020.EQTL / NBR 16690 §5.4: chave identificada como "DC Disconnect"
    const switchRef = `S${dpsCounter - 1}`;
    nodes.push({
      id: `dc-switch-${mppt.mpptId}`,
      type: 'dc-switch',
      x: DC_SWITCH_X - DC_SWITCH_W / 2,
      y: groupCenterY - DC_SWITCH_H / 2,
      w: DC_SWITCH_W, h: DC_SWITCH_H,
      data: { mpptIdx, mpptId: mppt.mpptId, mpptColor, refDesig: switchRef },
    });

    labels.push({
      id: `lbl-switch-ref-${mppt.mpptId}`,
      text: `${switchRef} DC Disc.`,
      x: DC_SWITCH_X,
      y: groupCenterY - DC_SWITCH_H / 2 - 6,
      color: '#94a3b8', fontSize: 6.5, anchor: 'middle', bold: true,
      category: 'designator',
    });

    // ── Inverter left port Y & sub-ports (G1, G2) ────────────────────────
    const posPortKey = `mppt_${mppt.mpptId}_pos`;
    const symbolPort = catalogItem?.symbolConfig?.ports?.[posPortKey];
    const portY = symbolPort
      ? invY + symbolPort.offset * invH
      : invY + (invH / (mpptCount + 1)) * (mpptIdx + 1);
    const midX = (DC_SWITCH_X + INV_X) / 2;

    // G2: Compute sub-port Ys for multiple inputs
    const footprintChannel = (catalogItem as any)?.blockDiagramFootprint?.mpptChannels?.find(
      (ch: any) => ch.mpptIndex === mppt.mpptId
    );
    const inputCount = Math.max(1, footprintChannel?.inputCount ?? 1);
    const PIN_SPAN = Math.min(12, (inputCount - 1) * 5);
    const subPortYs = Array.from({ length: inputCount }, (_, j) =>
      inputCount === 1 ? portY : portY + (j / Math.max(1, inputCount - 1) - 0.5) * 2 * PIN_SPAN
    );

    wires.push({
      id: `w-bus-tap-${mppt.mpptId}`,
      mpptIdx, polarity: 'dc',
      path: `M ${BUS_X + 2} ${groupCenterY} H ${DPS_TAP_X}`,
      nodeIds: [`bus-${mppt.mpptId}`, `dps-${mppt.mpptId}`],
    });

    // Wire: DPS → DC switch
    wires.push({
      id: `w-dps-switch-${mppt.mpptId}`,
      mpptIdx, polarity: 'dc',
      path: `M ${DPS_TAP_X} ${groupCenterY} H ${DC_SWITCH_X - DC_SWITCH_W / 2}`,
      nodeIds: [`dps-${mppt.mpptId}`, `dc-switch-${mppt.mpptId}`],
    });

    // ── Earth symbol for DPS ─────────────────────────────────────────────
    // BUG-11/17 fix: include mpptIdx in data so MPPT filter logic can find it.
    // The startsWith('earth-') check in render also guarantees visibility.
    const dpsEarthY = groupCenterY + 6 + DPS_H + 2;
    nodes.push({
      id: `earth-dps-${mppt.mpptId}`,
      type: 'earth-symbol',
      x: DPS_TAP_X - 8,
      y: dpsEarthY,
      w: 16,
      h: 14,
      data: { mpptIdx, mpptId: mppt.mpptId },
    });

    wires.push({
      id: `w-dps-gnd-${mppt.mpptId}`,
      mpptIdx, polarity: 'gnd',
      path: `M ${DPS_TAP_X} ${groupCenterY} V ${dpsEarthY}`,
      nodeIds: [`dps-${mppt.mpptId}`],
    });

    // G2: Wire each string to its own sub-port — com routing individual para evitar sobreposição
    // Filtrar apenas strings que têm centerY registrado (as que passaram o guard)
    const renderedStrings = strings.filter(str => stringCenterMap.has(str.id));
    renderedStrings.forEach((str, strIdx) => {
      const targetSubPortY = subPortYs[Math.min(strIdx, inputCount - 1)];
      const stringCY = stringCenterMap.get(str.id)!; // Seguro — só strings renderizadas
      wires.push({
        id: `w-tap-inv-${mppt.mpptId}-str-${str.id}`,
        mpptIdx, polarity: 'dc',
        path: `M ${DC_SWITCH_X + DC_SWITCH_W / 2} ${groupCenterY} H ${DC_SWITCH_X + DC_SWITCH_W / 2 + 10} V ${stringCY} H ${midX} V ${targetSubPortY} H ${INV_X}`,
        nodeIds: [`dc-switch-${mppt.mpptId}`, 'inverter'],
      });
    });

    // ── Validation marker ────────────────────────────────────────────────
    const err = validationErrors?.[mppt.mpptId];
    if (err && err.messages.length > 0) {
      markers.push({
        id: `marker-mppt-${mppt.mpptId}`,
        x: BUS_X - 14,
        y: groupCenterY,
        severity: err.severity,
        messages: err.messages,
      });
    }

    currentY += MPPT_GAP;
  });

  // ── Barramento de PE do arranjo FV (equipotencialização) ─────────────────────
  // Linha horizontal verde tracejada abaixo dos módulos FV
  const peY = currentY - MPPT_GAP / 2; // abaixo do último grupo
  if (peY > PAD_Y) {
    wires.push({
      id: 'w-pe-array',
      mpptIdx: -1, polarity: 'gnd',
      path: `M ${PAD_X} ${peY} H ${INV_X + INV_W / 2}`,
      nodeIds: [],
    });
    labels.push({
      id: 'lbl-pe-array',
      text: 'PE (equipotencialização do arranjo)',
      x: PAD_X + (INV_X + INV_W / 2 - PAD_X) / 2,
      y: peY - 4,
      color: '#166534',
      fontSize: 6,
      anchor: 'middle',
      category: 'electrical',
    });
  }

  // ── Inverter block ────────────────────────────────────────────────────────
  nodes.push({
    id: 'inverter',
    type: 'inverter',
    x: INV_X, y: invY, w: INV_W, h: invH,
    data: { inverter, catalogItem, mpptCount, refDesig: 'INV-01' },
  });

  labels.push({
    id: 'lbl-inv-ref',
    text: 'INV-01',
    x: INV_X + INV_W / 2,
    y: invY - 8,
    color: '#f1f5f9', fontSize: 9, anchor: 'middle', bold: true,
    category: 'designator',
  });

  // ── GAP K: Labels ANSI + monitoramento Riso/ΔI ──────────────────────────────
  const ansiY = invY + invH + 8;
  labels.push({
    id: 'lbl-ansi-protection',
    text: 'Prot.: 27/59 · 81U/O · Anti-ilha · Riso/ΔI',
    x: INV_X + INV_W / 2,
    y: ansiY,
    color: '#334155',
    fontSize: 5.5,
    anchor: 'middle',
    category: 'electrical',
  });

  // ── GAP G: Esquema de aterramento ────────────────────────────────────────────
  // NBR 5410 / NBR 16690: declarar esquema adotado (TN-S é o mais comum em BT BR)
  labels.push({
    id: 'lbl-grounding-scheme',
    text: 'Aterr.: TN-S',
    x: INV_X + INV_W / 2,
    y: ansiY + 9,
    color: '#166534',
    fontSize: 5.5,
    anchor: 'middle',
    category: 'electrical',
  });

  // ── AC side ──────────────────────────────────────────────────────────────────
  const acPortOffset = catalogItem?.symbolConfig?.ports?.['ac_out']?.offset;
  const acCenterY = acPortOffset != null
    ? invY + acPortOffset * invH
    : invY + invH / 2;

  // ── GAP E: Tensão CA na saída do inversor ────────────────────────────────────
  // Inferida da fase do footprint; padrão BR: trifásico 380/220V, mono 220/127V
  const acPhase = (catalogItem as any)?.blockDiagramFootprint?.acOutput?.phase ?? 'tri';
  const acVoltageLabel = acPhase === 'tri' ? '380/220V ~' : '220/127V ~';
  // GAP F: Corrente nominal CA = Pnom / (√3 × 380) trifásico ou Pnom / 220 mono
  const nomW = catalogItem?.nominalPowerW ?? 0;
  const inAC = nomW > 0
    ? acPhase === 'tri'
      ? Math.ceil(nomW / (Math.sqrt(3) * 380))
      : Math.ceil(nomW / 220)
    : 0;

  labels.push({
    id: 'lbl-ac-voltage',
    text: acVoltageLabel,
    x: AC_OUT_X + 4,
    y: acCenterY - 8,
    color: '#94a3b8', fontSize: 6.5, anchor: 'start',
    category: 'electrical',
  });
  if (inAC > 0) {
    labels.push({
      id: 'lbl-ac-current',
      text: `In≈${inAC}A`,
      x: AC_OUT_X + 4,
      y: acCenterY + 8,
      color: '#94a3b8', fontSize: 6.5, anchor: 'start',
      category: 'electrical',
    });
  }

  wires.push({
    id: 'w-inv-breaker', mpptIdx: -1, polarity: 'ac',
    path: `M ${AC_OUT_X} ${acCenterY} H ${BREAKER_X}`,
    nodeIds: ['inverter', 'ac-breaker'],
  });

  nodes.push({
    id: 'ac-breaker',
    type: 'ac-breaker',
    x: BREAKER_X, y: acCenterY - BREAKER_H / 2, w: BREAKER_W, h: BREAKER_H,
    data: { refDesig: 'DJ1' },
  });

  // ── GAP F: DJ com corrente nominal ───────────────────────────────────────────
  labels.push({
    id: 'lbl-dj-ref',
    text: 'DJ1',
    x: BREAKER_X + BREAKER_W / 2,
    y: acCenterY - BREAKER_H / 2 - 11,
    color: '#f1f5f9', fontSize: 9, anchor: 'middle', bold: true,
    category: 'designator',
  });
  if (inAC > 0) {
    labels.push({
      id: 'lbl-dj-in',
      text: `In=${inAC}A`,
      x: BREAKER_X + BREAKER_W / 2,
      y: acCenterY - BREAKER_H / 2 - 3,
      color: '#94a3b8', fontSize: 6, anchor: 'middle',
      category: 'electrical',
    });
  }

  // Wire: breaker → meter
  wires.push({
    id: 'w-breaker-meter', mpptIdx: -1, polarity: 'ac',
    path: `M ${BREAKER_X + BREAKER_W} ${acCenterY} H ${METER_X}`,
    nodeIds: ['ac-breaker', 'meter'],
  });

  // Medidor bidirecional (kWh)
  nodes.push({
    id: 'meter',
    type: 'meter',
    x: METER_X, y: acCenterY - METER_H / 2, w: METER_W, h: METER_H,
    data: { refDesig: 'MED-01' },
  });

  labels.push({
    id: 'lbl-meter-ref',
    text: 'MED-01',
    x: METER_X + METER_W / 2,
    y: acCenterY - METER_H / 2 - 11,
    color: '#f1f5f9', fontSize: 8, anchor: 'middle', bold: true,
    category: 'designator',
  });

  // ── GAP H: Placa de advertência junto ao medidor ──────────────────────────────
  // NT.020.EQTL: placa "Cuidado: Risco de Choque — Geração Própria" obrigatória
  labels.push({
    id: 'lbl-warning-meter',
    text: '⚠ Geração Própria',
    x: METER_X + METER_W / 2,
    y: acCenterY + METER_H / 2 + 9,
    color: '#ca8a04', fontSize: 5.5, anchor: 'middle',
    category: 'electrical',
  });

  // Wire: meter → grid
  wires.push({
    id: 'w-meter-grid', mpptIdx: -1, polarity: 'ac',
    path: `M ${METER_X + METER_W} ${acCenterY} H ${GRID_X}`,
    nodeIds: ['meter', 'grid'],
  });

  nodes.push({
    id: 'grid',
    type: 'grid',
    x: GRID_X, y: acCenterY - GRID_H / 2, w: GRID_W, h: GRID_H,
    data: { phase: acPhase },
  });

  // G4: AC output label (from footprint, if present)
  const acLabel = (catalogItem as any)?.blockDiagramFootprint?.acOutput?.label;
  if (acLabel) {
    labels.push({
      id: 'lbl-ac-out',
      text: acLabel,
      x: AC_OUT_X + 4,
      y: acCenterY - 6,
      color: '#94a3b8', fontSize: 6, anchor: 'start',
      category: 'electrical',
    });
  }

  // ── GAP H: Placa de advertência junto ao inversor ────────────────────────────
  labels.push({
    id: 'lbl-warning-inv',
    text: '⚠ Solar CC — Risco Choque',
    x: INV_X + INV_W / 2,
    y: invY - 16,
    color: '#ca8a04', fontSize: 5.5, anchor: 'middle',
    category: 'electrical',
  });

  // ── GND stub from inverter bottom ────────────────────────────────────────
  wires.push({
    id: 'w-gnd-inv', mpptIdx: -1, polarity: 'gnd',
    path: `M ${INV_X + INV_W / 2} ${invY + invH} V ${invY + invH + 20}`,
    nodeIds: ['inverter'],
  });

  // ── Earth symbol at GND stub termination ─────────────────────────────────
  nodes.push({
    id: 'earth-symbol',
    type: 'earth-symbol',
    x: INV_X + INV_W / 2 - 8,
    y: invY + invH + 20,
    w: 16,
    h: 14,
    data: {},
  });

  // ── ViewBox ───────────────────────────────────────────────────────────────
  const svgH = Math.max(currentY, invY + invH + 60) + PAD_Y;
  const svgW = GRID_X + GRID_W + PAD_X + 20;

  return { nodes, wires, labels, markers, junctions, viewBox: { x: 0, y: 0, w: svgW, h: svgH } };
}

// =============================================================================
// 5. IEC 60617 SYMBOL SUB-COMPONENTS
// =============================================================================

// ── PV String — IEC 60617 schematic symbol ────────────────────────────────────
//
// Symbol anatomy (IEC 60617 / NBR 16690):
//   • Rectangle outline — the "block" representing the string
//   • Diagonal line from bottom-left → top-right — standard source indicator
//   • Radiation arrows (3× short ticks) near upper-right — indicates photovoltaic source
//   • Terminal marks: + upper-left, − lower-left (closest to wire exit point)
//
// Contextual annotations placed OUTSIDE the rectangle:
//   • String name    — above the symbol, in MPPT accent colour
//   • N× · kWp · Model  — below the symbol, in slate (informational)
//
const PVStringSymbol: React.FC<{
  node: SchematicNode;
  isHovered: boolean; isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}> = ({ node, isHovered, isSelected, onHover, onSelect }) => {
  const { string, mpptColor, unitPmax, moduleModel } = node.data;

  const stroke  = isSelected ? '#6366f1' : isHovered ? mpptColor : '#475569';
  const strokeW = isHovered || isSelected ? 1.4 : 0.9;
  const { x, y, w, h } = node;

  // ── IEC 60617 diagonal (source polarity line) ────────────────────────────
  const diagPad = 8;
  const diagX1 = x + diagPad;     const diagY1 = y + h - diagPad;
  const diagX2 = x + w - diagPad; const diagY2 = y + diagPad;

  // ── Radiation arrows ─────────────────────────────────────────────────────
  // 3 parallel arrows at 45°, pointing lower-left (sun shining onto panel)
  // SVG coords: dX = −1/√2 (left), dY = +1/√2 (down on screen)
  const S2 = Math.SQRT2;
  const dX = -1 / S2;            // arrow direction x
  const dY =  1 / S2;            // arrow direction y (down)
  const pX =  1 / S2;            // perpendicular spread x
  const pY =  1 / S2;            // perpendicular spread y

  const shaftLen = 11;
  const headSz   = 3.4;
  const spacing  = 6.5;
  // Group anchor — upper-right quadrant, clear of the + terminal
  const gX = x + w * 0.70;
  const gY = y + h * 0.35;

  // Arrowhead barb angles: arrow direction is atan2(dY,dX) ≈ 135° in SVG;
  // barbs point back from tip at ±150° from that direction → 285° and 345°
  const B1 = (285 * Math.PI) / 180;
  const B2 = (345 * Math.PI) / 180;

  const radiationArrows = ([-1, 0, 1] as const).map(i => {
    const cx = gX + i * spacing * pX;
    const cy = gY + i * spacing * pY;
    const x1 = cx - dX * shaftLen / 2;   // tail (upper-right)
    const y1 = cy - dY * shaftLen / 2;
    const x2 = cx + dX * shaftLen / 2;   // tip (lower-left)
    const y2 = cy + dY * shaftLen / 2;
    return {
      x1, y1, x2, y2,
      bx1: x2 + headSz * Math.cos(B1), by1: y2 + headSz * Math.sin(B1),
      bx2: x2 + headSz * Math.cos(B2), by2: y2 + headSz * Math.sin(B2),
    };
  });

  // ── External annotations ─────────────────────────────────────────────────
  const nameLabel  = string.name || 'STR';
  const unitWp     = unitPmax > 0 ? Math.round(unitPmax) : 0;
  const totalKwp   = unitPmax > 0 && string.modulesCount > 0
    ? (string.modulesCount * unitPmax / 1000).toFixed(2) : null;
  const shortModel = moduleModel
    ? (moduleModel.length > 11 ? moduleModel.substring(0, 10) + '…' : moduleModel) : null;

  return (
    <g
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node.id)}
      onPointerDown={e => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      {/* ── IEC 60617 rectangle ── */}
      <rect x={x} y={y} width={w} height={h} rx={2}
        fill="#0f172a" stroke={stroke} strokeWidth={strokeW} />

      {/* ── Diagonal source line ── */}
      <line x1={diagX1} y1={diagY1} x2={diagX2} y2={diagY2}
        stroke={stroke} strokeWidth={1} strokeLinecap="round" />

      {/* ── Radiation arrows — 3× parallel, 45°, sun → panel ── */}
      {radiationArrows.map((a, i) => (
        <g key={i} opacity={isHovered ? 1 : 0.75}>
          <line
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={mpptColor} strokeWidth={1.1} strokeLinecap="round"
          />
          <polyline
            points={`${a.bx1.toFixed(2)},${a.by1.toFixed(2)} ${a.x2.toFixed(2)},${a.y2.toFixed(2)} ${a.bx2.toFixed(2)},${a.by2.toFixed(2)}`}
            fill="none" stroke={mpptColor} strokeWidth={1.1}
            strokeLinejoin="round" strokeLinecap="round"
          />
        </g>
      ))}

      {/* ── Terminal marks ── */}
      <text x={x + 3} y={y + 9}
        fill="#f87171" fontSize={8} fontFamily="monospace" fontWeight="bold"
        style={{ userSelect: 'none' }}>+</text>
      <text x={x + 3} y={y + h - 2}
        fill="#93c5fd" fontSize={8} fontFamily="monospace" fontWeight="bold"
        style={{ userSelect: 'none' }}>−</text>

      {/* ── String name ABOVE ── */}
      <text x={x + w / 2} y={y - 5}
        textAnchor="middle" fill={mpptColor}
        fontSize={7.5} fontFamily="monospace" fontWeight="bold"
        style={{ userSelect: 'none' }}>
        {nameLabel}
      </text>

      {/* ── N × Punit Wp (below, line 1) ── */}
      {string.modulesCount > 0 && (
        <text x={x + w / 2} y={y + h + 11}
          textAnchor="middle" fill={unitWp > 0 ? '#e2e8f0' : '#64748b'}
          fontSize={6.5} fontFamily="monospace"
          style={{ userSelect: 'none' }}>
          {string.modulesCount} × {unitWp > 0 ? `${unitWp} Wp` : ''}
        </text>
      )}

      {/* ── = X.XX kWp · Modelo (below, line 2) ── */}
      {totalKwp && (
        <text x={x + w / 2} y={y + h + 21}
          textAnchor="middle" fill="#64748b"
          fontSize={6} fontFamily="monospace"
          style={{ userSelect: 'none' }}>
          = <tspan fill="#34d399">{totalKwp} kWp</tspan>{shortModel ? ` · ${shortModel}` : ''}
        </text>
      )}
    </g>
  );
};

// ── DC Fuse ───────────────────────────────────────────────────────────────────
const FuseSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const { mpptColor } = node.data;
  const cy = node.y + node.h / 2;
  const color = isActive ? mpptColor : '#475569';
  const fuseElementColor = isActive ? `${mpptColor}99` : '#47556999';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={2}
        fill="none" stroke={color} strokeWidth={isActive ? 1.2 : 0.8} />
      {/* Internal fuse element line */}
      <line x1={node.x + 3} y1={cy} x2={node.x + node.w - 3} y2={cy}
        stroke={fuseElementColor} strokeWidth={0.8} strokeDasharray="2 1" />
      <circle cx={node.x} cy={cy} r={1.2} fill={color} />
      <circle cx={node.x + node.w} cy={cy} r={1.2} fill={color} />
    </g>
  );
};

// ── Bus Bar ───────────────────────────────────────────────────────────────────
const BusBarSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const { mpptColor } = node.data;
  const cx = node.x + node.w / 2;
  const busColor = isActive ? mpptColor : '#94a3b8';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      {/* Bus bar termination marks */}
      <line x1={cx - 4} y1={node.y} x2={cx + 4} y2={node.y}
        stroke={busColor} strokeWidth={1} strokeLinecap="square" />
      <line x1={cx - 4} y1={node.y + node.h} x2={cx + 4} y2={node.y + node.h}
        stroke={busColor} strokeWidth={1} strokeLinecap="square" />
      {/* Main bus bar line */}
      <line x1={cx} y1={node.y} x2={cx} y2={node.y + node.h}
        stroke={busColor} strokeWidth={2} strokeLinecap="square" />
      <circle cx={cx} cy={node.y + node.h / 2} r={2.5}
        fill="#0f172a" stroke={isActive ? mpptColor : '#6366f1'} strokeWidth={1} />
    </g>
  );
};

// ── DPS (IEC 60364-5-54) ──────────────────────────────────────────────────────
const DPSSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const cx = node.x + node.w / 2;
  const color = isActive ? '#f59e0b' : '#64748b';
  const topY = node.y; const botY = node.y + node.h;
  const midY = node.y + node.h * 0.38;

  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      {/* Top connection line */}
      <line x1={cx} y1={topY} x2={cx} y2={midY - 4} stroke={color} strokeWidth={1.5} />
      {/* Triangle (varistor symbol) */}
      <polygon
        points={`${cx - 7},${midY - 4} ${cx + 7},${midY - 4} ${cx},${midY + 9}`}
        fill={isActive ? 'rgba(245,158,11,0.15)' : 'none'}
        stroke={color} strokeWidth={1.5} />
      {/* Base line */}
      <line x1={cx - 7} y1={midY + 11} x2={cx + 7} y2={midY + 11} stroke={color} strokeWidth={1.5} />
      {/* Ground connection line */}
      <line x1={cx} y1={midY + 11} x2={cx} y2={botY - 12} stroke={color} strokeWidth={1.5} />
      {/* Earth symbol at bottom */}
      <line x1={cx - 5} y1={botY - 8}  x2={cx + 5} y2={botY - 8}  stroke={color} strokeWidth={1.5} />
      <line x1={cx - 3} y1={botY - 5}  x2={cx + 3} y2={botY - 5}  stroke={color} strokeWidth={1} />
      <line x1={cx - 1} y1={botY - 2}  x2={cx + 1} y2={botY - 2}  stroke={color} strokeWidth={0.8} />
      {/* Indicador bipolar ± → PE */}
      <text x={cx + 9} y={midY + 5}
        fill={isActive ? '#f59e0b80' : '#47556960'} fontSize={5.5} fontFamily="monospace"
        style={{ userSelect: 'none' }}>±PE</text>
    </g>
  );
};

// ── DC Disconnect Switch (IEC 60617 — chave seccionadora) ────────────────────
// Símbolo IEC: dois terminais com lâmina angulada (interruptor seccionador)
const DCSwitchSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color = isActive ? '#f59e0b' : '#64748b';
  const cy = node.y + node.h / 2;
  const x0 = node.x;
  const x1 = node.x + node.w;
  const bladeEndX = x0 + node.w * 0.65;
  const bladeEndY = cy - node.h * 0.45;
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      {/* Terminal esquerdo */}
      <circle cx={x0} cy={cy} r={2} fill={color} />
      {/* Terminal direito */}
      <circle cx={x1} cy={cy} r={2} fill={color} />
      {/* Stub esquerdo até o pivô */}
      <line x1={x0} y1={cy} x2={x0 + node.w * 0.3} y2={cy}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      {/* Lâmina angulada (blade) */}
      <line x1={x0 + node.w * 0.3} y1={cy} x2={bladeEndX} y2={bladeEndY}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      {/* Stub direito */}
      <line x1={x1} y1={cy} x2={x1 - node.w * 0.2} y2={cy}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      {/* Indicador "CC" abaixo — diferencia de chave CA */}
      <text x={node.x + node.w / 2} y={node.y + node.h + 7}
        textAnchor="middle" fill="#475569" fontSize={6} fontFamily="monospace"
        style={{ userSelect: 'none' }}>CC</text>
    </g>
  );
};

// ── Inverter Block (G1, G3, G5) ──────────────────────────────────────────────
const InverterSchematicBlock: React.FC<{
  node: SchematicNode; isHovered: boolean; onSelect: (id: string) => void;
}> = ({ node, isHovered, onSelect }) => {
  const { inverter, catalogItem, mpptCount } = node.data;
  // G3: AC port offset
  const acOffset = (catalogItem as any)?.symbolConfig?.ports?.['ac_out']?.offset;
  const acPortY = acOffset != null ? node.y + acOffset * node.h : node.y + node.h / 2;

  return (
    <g onPointerDown={e => e.stopPropagation()}
       onClick={() => onSelect(node.id)}
       style={{ cursor: 'pointer' }}>
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={2}
        fill="#0f172a" stroke={isHovered ? '#60a5fa' : '#334155'} strokeWidth={1.5}
        filter={isHovered ? 'url(#inverter-glow-svg)' : undefined} />
      <line x1={node.x} y1={node.y + node.h} x2={node.x + node.w} y2={node.y}
        stroke="#1e293b" strokeWidth={1} opacity={0.8} />
      {/* DC input indicator on left */}
      <g transform={`translate(${node.x + 16}, ${node.y + 14})`}>
        <line x1={-5} y1={-2} x2={5} y2={-2} stroke="#475569" strokeWidth={1.2} />
        <line x1={-5} y1={2}  x2={5} y2={2}  stroke="#475569" strokeWidth={1.2} />
      </g>
      {/* AC output indicator on right */}
      <g transform={`translate(${node.x + node.w - 16}, ${node.y + node.h - 14})`}>
        <path d="M-5,0 C-5,-4 -1.5,-4 0,0 C1.5,4 5,4 5,0"
          fill="none" stroke="#94a3b8" strokeWidth={1.2} />
        <text x={-12} y={1} fill="#94a3b8" fontSize={7} fontWeight="bold" textAnchor="end">~</text>
      </g>
      <text x={node.x + node.w / 2} y={node.y + node.h / 2 - 4}
        textAnchor="middle" dominantBaseline="middle"
        fill="#475569" fontSize={11} fontWeight="bold" fontFamily="monospace">
        {catalogItem?.model || inverter.snapshot.model}
      </text>
      <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 9}
        textAnchor="middle" dominantBaseline="middle"
        fill="#94a3b8" fontSize={9} fontFamily="monospace">
        {catalogItem?.nominalPowerW ? `${(catalogItem.nominalPowerW / 1000).toFixed(1)} kW` : ''}
      </text>
      {(() => {
        const symbolConfig = catalogItem?.symbolConfig;
        const footprintChannels = (catalogItem as any)?.blockDiagramFootprint?.mpptChannels;

        return inverter.mpptConfigs.map((mppt: MPPTConfig, idx: number) => {
          const posPortKey = `mppt_${mppt.mpptId}_pos`;
          const symbolPort = symbolConfig?.ports?.[posPortKey];
          const portY = symbolPort
            ? node.y + symbolPort.offset * node.h
            : node.y + (node.h / (mpptCount + 1)) * (idx + 1);
          const portLabel = symbolPort?.label ?? `M${mppt.mpptId}`;
          const color = getMpptColor(idx);

          // G1: Multi-input sub-ports
          const footprintChannel = footprintChannels?.find((ch: any) => ch.mpptIndex === mppt.mpptId);
          const inputCount = Math.max(1, footprintChannel?.inputCount ?? 1);
          const PIN_SPAN = Math.min(12, (inputCount - 1) * 5);

          if (inputCount > 1) {
            const subPortYs = Array.from({ length: inputCount }, (_, j) =>
              portY + (j / Math.max(1, inputCount - 1) - 0.5) * 2 * PIN_SPAN
            );
            return (
              <g key={mppt.mpptId}>
                {/* Bracket connecting sub-ports */}
                <line x1={node.x - 8} y1={subPortYs[0]} x2={node.x - 8} y2={subPortYs[inputCount - 1]}
                  stroke={color} strokeWidth={1} />
                {/* Sub-port dots with triangle indicators */}
                {subPortYs.map((spY, j) => (
                  <g key={j}>
                    <polygon
                      points={`${node.x - 5},${spY - 3} ${node.x - 5},${spY + 3} ${node.x},${spY}`}
                      fill={color} stroke="none" />
                    <circle cx={node.x} cy={spY} r={2.5}
                      fill="#0f172a" stroke={color} strokeWidth={1.5} />
                    <text x={node.x + 4} y={spY} dominantBaseline="middle"
                      fill={color} fontSize={5} fontFamily="monospace" fontWeight="bold">
                      {footprintChannel?.inputLabels?.[j] ?? `PV${j+1}`}
                    </text>
                  </g>
                ))}
                {/* MPPT label */}
                <text x={node.x + 6} y={portY - PIN_SPAN - 4} dominantBaseline="middle"
                  fill={color} fontSize={6} fontFamily="monospace" fontWeight="bold">
                  {portLabel}
                </text>
              </g>
            );
          } else {
            // Single port (legacy)
            return (
              <g key={mppt.mpptId}>
                <line x1={node.x - 12} y1={portY} x2={node.x} y2={portY}
                  stroke={color} strokeWidth={1.5} />
                {/* Triangle indicator for DC input */}
                <polygon
                  points={`${node.x - 7},${portY - 4} ${node.x - 7},${portY + 4} ${node.x},${portY}`}
                  fill={color} stroke="none" />
                <circle cx={node.x} cy={portY} r={3.5}
                  fill="#0f172a" stroke={color} strokeWidth={1.5} />
                <text x={node.x + 6} y={portY} dominantBaseline="middle"
                  fill={color} fontSize={6} fontFamily="monospace" fontWeight="bold">
                  {portLabel}
                </text>
              </g>
            );
          }
        });
      })()}
      {/* AC port (G3) */}
      <circle cx={node.x + node.w} cy={acPortY} r={4}
        fill="#0f172a" stroke="#94a3b8" strokeWidth={1.5} />
      <circle cx={node.x + node.w / 2} cy={node.y + node.h} r={3}
        fill="#0f172a" stroke="#22c55e" strokeWidth={1.5} />
    </g>
  );
};

// ── AC Breaker ────────────────────────────────────────────────────────────────
const ACBreakerSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color = isActive ? '#e2e8f0' : '#94a3b8';
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const r = Math.min(node.w, node.h) / 2 - 2;
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      {/* IEC 60617 breaker symbol: circle with diagonal line */}
      <circle cx={cx} cy={cy} r={r}
        fill="#0f172a" stroke={color} strokeWidth={1.5} />
      <line x1={cx - r * 0.5} y1={cy + r * 0.5} x2={cx + r * 0.5} y2={cy - r * 0.5}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
};

// ── Medidor bidirecional (kWh) — IEC / NT.020.EQTL ─────────────────────────
// Símbolo: círculo com "kWh" e setas bidirecionais, exigido pelas concessionárias
const BidirectionalMeterSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const r  = Math.min(node.w, node.h) / 2 - 1;
  const color = isActive ? '#a78bfa' : '#64748b';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke={color} strokeWidth={1.2} />
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={5} fontFamily="monospace" fontWeight="bold"
        style={{ userSelect: 'none' }}>kWh</text>
      {/* Seta bidirecional horizontal dentro do círculo */}
      <line x1={cx - r * 0.55} y1={cy + 3} x2={cx + r * 0.55} y2={cy + 3}
        stroke={color} strokeWidth={0.8} />
      {/* Cabeça seta direita */}
      <polygon points={`${cx + r * 0.55},${cy + 3} ${cx + r * 0.3},${cy + 1.5} ${cx + r * 0.3},${cy + 4.5}`}
        fill={color} />
      {/* Cabeça seta esquerda */}
      <polygon points={`${cx - r * 0.55},${cy + 3} ${cx - r * 0.3},${cy + 1.5} ${cx - r * 0.3},${cy + 4.5}`}
        fill={color} />
    </g>
  );
};

// ── Grid Symbol ───────────────────────────────────────────────────────────────
const GridSymbol: React.FC<{ node: SchematicNode; onSelect: (id: string) => void }> = ({ node, onSelect }) => {
  const phase = node.data.phase as 'mono' | 'tri';
  const lines = phase === 'tri' ? 3 : 1;
  const sinW = node.w - 8;
  const x0 = node.x + 8;
  const groupH = (lines - 1) * 13 + 12;
  const groupStartY = node.y + (node.h - groupH) / 2;

  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <circle cx={node.x} cy={node.y + node.h / 2} r={4}
        fill="#0f172a" stroke="#94a3b8" strokeWidth={1.5} />
      {Array.from({ length: lines }).map((_, i) => {
        const midY = groupStartY + i * 13 + 6;
        const hw = sinW / 2;
        return (
          <path key={i}
            d={`M ${x0} ${midY} C ${x0+hw*0.3} ${midY-6} ${x0+hw*0.7} ${midY-6} ${x0+hw} ${midY} C ${x0+hw*1.3} ${midY+6} ${x0+hw*1.7} ${midY+6} ${x0+sinW} ${midY}`}
            fill="none" stroke="#94a3b8" strokeWidth={1.2} />
        );
      })}
      <text x={node.x + node.w / 2 + 4} y={node.y + node.h + 9}
        textAnchor="middle" fill="#64748b" fontSize={6.5}
        fontFamily="monospace" fontWeight="bold">
        {phase === 'tri' ? '3φ' : '1φ'} REDE
      </text>
    </g>
  );
};

// ── Earth Symbol (IEC 60617-2) ────────────────────────────────────────────────
const EarthSymbol: React.FC<{ node: SchematicNode }> = ({ node }) => {
  const cx = node.x + node.w / 2;
  const y0 = node.y;
  const color = '#22c55e';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <line x1={cx - 8} y1={y0}     x2={cx + 8} y2={y0}     stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={cx - 5.5} y1={y0 + 4} x2={cx + 5.5} y2={y0 + 4} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={cx - 3} y1={y0 + 8} x2={cx + 3} y2={y0 + 8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
};

// ── Wire Renderer ─────────────────────────────────────────────────────────────
const SchematicWireRenderer: React.FC<{
  wire: SchematicWire; isActive: boolean; dimmed?: boolean;
}> = ({ wire, isActive, dimmed }) => {
  const color =
    wire.polarity === 'gnd' ? '#22c55e' :
    wire.polarity === 'ac'  ? '#94a3b8' :
    getMpptColor(wire.mpptIdx);
  const strokeWidth =
    wire.polarity === 'gnd' ? (isActive ? 1.2 : 0.8) :
    wire.polarity === 'ac'  ? (isActive ? 1.8 : 1.4) :
    (isActive ? 1.6 : 1.2);
  return (
    <path d={wire.path} stroke={color}
      strokeWidth={strokeWidth} fill="none"
      strokeDasharray={wire.polarity === 'gnd' ? '4 3' : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={dimmed ? 0.08 : isActive ? 1 : 0.65}
      style={{ transition: 'stroke-width 0.1s, opacity 0.15s' }}
    />
  );
};

// ── Wire / Node Labels ────────────────────────────────────────────────────────
const LabelLayer: React.FC<{ labels: SchematicLabel[]; showElectrical: boolean }> = ({ labels, showElectrical }) => (
  <>
    {labels.filter(lbl => {
      if (lbl.category === 'electrical') return showElectrical;
      return true; // sem categoria ou designator → sempre mostrar
    }).map(lbl => (
      <text
        key={lbl.id}
        x={lbl.x} y={lbl.y}
        textAnchor={lbl.anchor}
        dominantBaseline="auto"
        fill={lbl.color}
        fontSize={lbl.fontSize}
        fontFamily="monospace"
        fontWeight={lbl.bold ? 'bold' : 'normal'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
        transform={lbl.rotate ? `rotate(${lbl.rotate}, ${lbl.x}, ${lbl.y})` : undefined}
      >
        {lbl.text}
      </text>
    ))}
  </>
);

// ── Validation Markers ────────────────────────────────────────────────────────
const ValidationMarker: React.FC<{
  marker: SchematicMarker;
  onSelect: (id: string) => void;
}> = ({ marker, onSelect }) => {
  const isError = marker.severity === 'error';
  const color = isError ? '#ef4444' : '#f59e0b';
  const r = 8;

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onSelect(marker.id)}>
      <title>{marker.messages.join('\n')}</title>
      {isError ? (
        <>
          <circle cx={marker.x} cy={marker.y} r={r}
            fill="#0f172a" stroke={color} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
          <line x1={marker.x - 4} y1={marker.y - 4} x2={marker.x + 4} y2={marker.y + 4}
            stroke={color} strokeWidth={1.8} />
          <line x1={marker.x + 4} y1={marker.y - 4} x2={marker.x - 4} y2={marker.y + 4}
            stroke={color} strokeWidth={1.8} />
        </>
      ) : (
        <>
          <polygon
            points={`${marker.x},${marker.y - r} ${marker.x - r},${marker.y + r * 0.6} ${marker.x + r},${marker.y + r * 0.6}`}
            fill="#0f172a" stroke={color} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
          <text x={marker.x} y={marker.y + r * 0.4}
            textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize={8} fontWeight="bold" fontFamily="monospace">!</text>
        </>
      )}
    </g>
  );
};

// =============================================================================
// 6. DETAIL PANELS (G5)
// =============================================================================

const StringDetailCard: React.FC<{
  node: SchematicNode;
  mpptMetrics: Record<number, any>;
  onClose: () => void;
}> = ({ node, mpptMetrics, onClose }) => {
  const { string, mpptId, mpptColor, fuseRef } = node.data;
  const metrics = mpptMetrics[mpptId];

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2 pl-1">
          <Zap className="h-3.5 w-3.5" style={{ color: mpptColor }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: mpptColor }}>
            {string.name}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">MPPT</div>
            <div className="text-sm font-mono font-bold" style={{ color: mpptColor }}>{mpptId}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Módulos</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">{string.modulesCount}</div>
          </div>
          {fuseRef && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5">
              <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Fusível</div>
              <div className="text-sm font-mono font-bold text-amber-400">{fuseRef}</div>
            </div>
          )}
        </div>

        {metrics && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-md p-3 space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Perfil Elétrico — MPPT {mpptId}</div>
            {metrics.vocFrio > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Voc (frio extremo)</span>
                <span className="text-[10px] font-mono text-sky-400 font-bold tabular-nums">{metrics.vocFrio.toFixed(1)} V</span>
              </div>
            )}
            {metrics.vmpCalor > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Vmp (calor máx.)</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold tabular-nums">{metrics.vmpCalor.toFixed(1)} V</span>
              </div>
            )}
            {metrics.iscTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Isc total MPPT</span>
                <span className="text-[10px] font-mono text-red-400 font-bold tabular-nums">{metrics.iscTotal.toFixed(2)} A</span>
              </div>
            )}
            {metrics.powerKwp > 0 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
                <span className="text-[9px] text-slate-500">Potência MPPT</span>
                <span className="text-[11px] font-mono text-emerald-400 font-black tabular-nums">{metrics.powerKwp.toFixed(2)} kWp</span>
              </div>
            )}
          </div>
        )}

        {(string.cableSection || string.cableLength) && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-md p-3 space-y-1.5">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Cabeamento</div>
            {string.cableSection > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Seção</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.cableSection} mm²</span>
              </div>
            )}
            {string.cableLength > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Comprimento</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.cableLength} m</span>
              </div>
            )}
          </div>
        )}

        {(string.azimuth !== undefined || string.inclination !== undefined) && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-md p-3 space-y-1.5">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Orientação</div>
            {string.azimuth !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Azimute</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.azimuth}°</span>
              </div>
            )}
            {string.inclination !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Inclinação</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.inclination}°</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 · IEC 60617-11
          </span>
        </div>
      </div>
    </div>
  );
};

// G5: Inverter Detail Panel
const InverterDetailPanel: React.FC<{
  node: SchematicNode;
  onClose: () => void;
}> = ({ node, onClose }) => {
  const { inverter, catalogItem } = node.data;
  const footprint = (catalogItem as any)?.blockDiagramFootprint;
  const totalInputs = footprint?.mpptChannels?.reduce((s: number, ch: any) => s + (ch.inputCount ?? 1), 0) ?? inverter.mpptConfigs.length;

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#6366f1', borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2 pl-1">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">INV-01</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 col-span-2">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Modelo</div>
            <div className="text-sm font-mono font-bold text-indigo-400">{catalogItem?.model ?? inverter.snapshot?.model ?? '—'}</div>
          </div>
          {catalogItem?.nominalPowerW && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5">
              <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Potência</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{(catalogItem.nominalPowerW / 1000).toFixed(1)} kW</div>
            </div>
          )}
          <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">MPPTs</div>
            <div className="text-sm font-mono font-bold text-sky-400">{inverter.mpptConfigs.length}</div>
          </div>
        </div>
        {footprint?.mpptChannels && footprint.mpptChannels.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-md p-3 space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Canais CC (Footprint)</div>
            {footprint.mpptChannels.map((ch: any) => (
              <div key={ch.mpptIndex} className="flex items-center justify-between">
                <span className="text-[9px] font-mono" style={{ color: getMpptColor(ch.mpptIndex - 1) }}>MPPT {ch.mpptIndex}</span>
                <span className="text-[9px] text-slate-400 font-mono">{ch.inputCount} entrad{ch.inputCount === 1 ? 'a' : 'as'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
              <span className="text-[9px] text-slate-500">Total entradas CC</span>
              <span className="text-[10px] font-mono text-white font-bold">{totalInputs}</span>
            </div>
          </div>
        )}
        {footprint?.acOutput && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-md p-3 space-y-1.5">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Saída CA</div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Rótulo</span>
              <span className="text-[10px] font-mono text-slate-300 font-bold">{footprint.acOutput.label ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Fase</span>
              <span className="text-[10px] font-mono text-slate-300 font-bold">{footprint.acOutput.phase === 'tri' ? 'Trifásico' : 'Monofásico'}</span>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 · IEC 60617-11
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Fuse Detail Card ──────────────────────────────────────────────────────────
const FuseDetailCard: React.FC<{ node: SchematicNode; mpptMetrics: Record<number, any>; onClose: () => void }> = ({ node, mpptMetrics, onClose }) => {
  const { refDesig, mpptColor, mpptId } = node.data;
  const metrics = mpptMetrics[mpptId];
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color: mpptColor }}>
          {refDesig}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Fusível de proteção CC — protege o condutor contra sobrecorrentes oriundas da string fotovoltaica.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: mpptColor }}>{refDesig}</span>
        </div>
        {metrics?.unitIsc > 0 && (
          <>
            <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Isc string (unitário)</span>
              <span className="text-[10px] font-mono font-bold text-sky-400">{metrics.unitIsc.toFixed(2)} A</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5 flex items-center justify-between">
              <span className="text-[9px] text-amber-400">Mín. NBR 16690 (×1,56)</span>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {(Math.ceil(1.56 * metrics.unitIsc * 10) / 10).toFixed(1)} A
              </span>
            </div>
          </>
        )}
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 60269 / NBR 13600</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 5.3</span>
        </div>
      </div>
    </div>
  );
};

// ── Bus Bar Detail Card ───────────────────────────────────────────────────────
const BusBarDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  const { mpptId, mpptColor } = node.data;
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color: mpptColor }}>
          Barramento CC — MPPT {mpptId}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Barramento de junção CC — agrega as strings do MPPT {mpptId} após os fusíveis individuais.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Canal MPPT</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: mpptColor }}>{mpptId}</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 5.2</span>
        </div>
      </div>
    </div>
  );
};

// ── DPS Detail Card ───────────────────────────────────────────────────────────
const DPSDetailCard: React.FC<{ node: SchematicNode; mpptMetrics: Record<number, any>; onClose: () => void }> = ({ node, mpptMetrics, onClose }) => {
  const { refDesig, mpptId } = node.data;
  const metrics = mpptMetrics[mpptId];
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#fbbf24', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-amber-400 pl-1">{refDesig}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Dispositivo de Proteção contra Surtos (DPS/SPD) — limita sobretensões transitórias de origem atmosférica ou de manobra no barramento CC.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold text-amber-400">{refDesig}</span>
        </div>
        {metrics?.vocFrio > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">Voc MPPT (ref. classe DPS)</span>
            <span className="text-[10px] font-mono font-bold text-sky-400">{metrics.vocFrio.toFixed(0)} V</span>
          </div>
        )}
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 61643 / NBR 61643</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Tipo (IEC 61643-31)</span>
          <span className="text-[10px] font-mono text-slate-300">
            {metrics?.vocFrio > 600 ? 'Classe I+II (DC)' : 'Classe II (DC)'}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 6.1</span>
        </div>
      </div>
    </div>
  );
};

// ── AC Breaker Detail Card ────────────────────────────────────────────────────
const ACBreakerDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  const { refDesig } = node.data;
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#94a3b8', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 pl-1">{refDesig}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Disjuntor de interligação CA — proteção e seccionamento da saída AC do inversor. Permite desconexão segura para manutenção.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">{refDesig}</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 60947-2 / NBR IEC 60947</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 6.3</span>
        </div>
      </div>
    </div>
  );
};

// ── Grid Detail Card ──────────────────────────────────────────────────────────
const GridDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  const phase = node.data.phase as 'mono' | 'tri';
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#94a3b8', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 pl-1">Rede Elétrica</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Ponto de Conexão</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Barramento CA de interligação com a concessionária. Ponto de entrega da energia fotovoltaica gerada.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Sistema</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">{phase === 'tri' ? 'Trifásico 3φ' : 'Monofásico 1φ'}</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">ABNT NBR 16690 / ANEEL 482</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 7</span>
        </div>
      </div>
    </div>
  );
};

// ── ValidationErrorPanel ──────────────────────────────────────────────────────
const ValidationErrorPanel: React.FC<{
  marker: SchematicMarker;
  onClose: () => void;
}> = ({ marker, onClose }) => {
  const isError = marker.severity === 'error';
  const color = isError ? '#ef4444' : '#f59e0b';
  const label = isError ? 'Erro de Validação' : 'Aviso de Validação';

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color }}>
          {label}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {marker.messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-900/50 border rounded-md p-3"
               style={{ borderColor: `${color}30` }}>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
            <p className="text-[10px] font-mono leading-relaxed" style={{ color }}>{msg}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 — Validação elétrica
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 7. ZOOM CONTROLS
// =============================================================================

const ZoomControls: React.FC<{
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExport?: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  panelOpen?: boolean;
}> = ({ zoom, onZoomIn, onZoomOut, onFit, onExport, showLabels, onToggleLabels, panelOpen }) => (
  <div className={`absolute bottom-14 z-20 flex flex-col gap-1 items-center transition-all duration-300 ${panelOpen ? 'right-[272px]' : 'right-4'}`}>
    {onExport && (
      <button onClick={onExport}
        className="w-7 h-7 bg-slate-900/90 border border-slate-700 rounded flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-all"
        title="Exportar SVG">
        <Download size={11} />
      </button>
    )}
    {onToggleLabels && (
      <button onClick={onToggleLabels}
        className={`w-7 h-7 bg-slate-900/90 border rounded flex items-center justify-center transition-all ${showLabels ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-indigo-500/50 text-indigo-400'}`}
        title={showLabels ? 'Ocultar labels' : 'Mostrar labels'}>
        <Tag size={10} />
      </button>
    )}
    <button onClick={onZoomIn}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 rounded flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
      title="Zoom in (+)">
      <ZoomIn size={12} />
    </button>
    <button onClick={onFit}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 rounded flex items-center justify-center text-slate-500 hover:text-white transition-all"
      title="Fit to screen">
      <Maximize2 size={11} />
    </button>
    <button onClick={onZoomOut}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 rounded flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
      title="Zoom out (-)">
      <ZoomOut size={12} />
    </button>
    <span className="text-[7px] text-slate-700 font-mono tabular-nums mt-0.5">
      {Math.round(zoom * 100)}%
    </span>
  </div>
);

// =============================================================================
// 8. MAIN COMPONENT
// =============================================================================

interface UnifilarSchematicCanvasProps {
  inverter: InverterState;
  catalogItem: InverterCatalogItem | undefined;
  mpptMetrics: Record<number, any>;
  validationErrors?: Record<number, MpptValidationError>;
}

export const UnifilarSchematicCanvas: React.FC<UnifilarSchematicCanvasProps> = ({
  inverter, catalogItem, mpptMetrics, validationErrors,
}) => {
  // ── Interaction state ──────────────────────────────────────────────────────
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightMpptIdx, setHighlightMpptIdx] = useState<number | null>(null);

  // ── Pan / Zoom state ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // ── Label visibility & legend collapse ────────────────────────────────────
  const [showLabels, setShowLabels] = useState(true);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const svgRef   = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPt    = useRef({ x: 0, y: 0 });
  const hasAutoFit = useRef(false);
  // Keep refs in sync for non-reactive wheel handler
  const zoomRef = useRef(zoom);
  const panRef  = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const layout = useMemo(
    () => computeUnifilarLayout(inverter, catalogItem, mpptMetrics, validationErrors),
    [inverter, catalogItem, mpptMetrics, validationErrors],
  );

  // ── Wire highlight via hover ───────────────────────────────────────────────
  const activeWireIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    return new Set(layout.wires.filter(w => w.nodeIds.includes(hoveredNodeId)).map(w => w.id));
  }, [hoveredNodeId, layout.wires]);

  // ── MPPT filter: filtered wire/node IDs ──────────────────────────────────
  const filteredWireIds = useMemo(() => {
    if (highlightMpptIdx === null) return null; // null = show all
    return new Set(layout.wires.filter(w => w.mpptIdx === highlightMpptIdx).map(w => w.id));
  }, [highlightMpptIdx, layout.wires]);

  const filteredNodeIds = useMemo(() => {
    if (highlightMpptIdx === null) return null;
    // Collect node IDs from matching wires
    const ids = new Set<string>();
    layout.wires.forEach(w => {
      if (w.mpptIdx === highlightMpptIdx) w.nodeIds.forEach(id => ids.add(id));
    });
    // Also include string nodes for this mpptIdx
    layout.nodes.forEach(n => {
      if (n.data?.mpptIdx === highlightMpptIdx) ids.add(n.id);
    });
    return ids;
  }, [highlightMpptIdx, layout.wires, layout.nodes]);

  const handleNodeHover  = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleNodeSelect = useCallback((id: string) => {
    setSelectedNodeId(prev => prev === id ? null : id);
  }, []);

  const selectedNode = useMemo(
    () => layout.nodes.find(n => n.id === selectedNodeId) ?? null,
    [layout.nodes, selectedNodeId],
  );

  // ── Wheel zoom (non-passive, attached via useEffect) ──────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cz = zoomRef.current;
      const cp = panRef.current;
      const { w, h } = layout.viewBox;

      const factor  = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.min(5, Math.max(0.15, cz * factor));

      const rect  = svg.getBoundingClientRect();
      const vbWc  = w / cz;
      const vbHc  = h / cz;
      // Cursor in SVG coordinate space
      const curX  = cp.x + (e.clientX - rect.left)  / rect.width  * vbWc;
      const curY  = cp.y + (e.clientY - rect.top)   / rect.height * vbHc;
      const vbWn  = w / newZoom;
      const vbHn  = h / newZoom;

      setZoom(newZoom);
      setPan({
        x: curX - (e.clientX - rect.left)  / rect.width  * vbWn,
        y: curY - (e.clientY - rect.top)   / rect.height * vbHn,
      });
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [layout.viewBox]);

  // ── Drag pan ───────────────────────────────────────────────────────────────
  const handleBgPointerDown = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    isPanning.current = true;
    setIsDragging(true);
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleBgPointerMove = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    if (!isPanning.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cz   = zoomRef.current;
    const { w, h } = layout.viewBox;
    const scaleX = (w / cz) / rect.width;
    const scaleY = (h / cz) / rect.height;
    const dx = (e.clientX - lastPt.current.x) * scaleX;
    const dy = (e.clientY - lastPt.current.y) * scaleY;
    lastPt.current = { x: e.clientX, y: e.clientY };
    setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
  }, [layout.viewBox]);

  const handleBgPointerUp = useCallback(() => {
    isPanning.current = false;
    setIsDragging(false);
  }, []);

  // ── Zoom control helpers (G6: handleFit computes fit zoom) ────────────────
  const handleZoomIn  = useCallback(() => setZoom(z => Math.min(5, z * 1.25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.15, z / 1.25)), []);
  const handleFit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const rect = svg.getBoundingClientRect();
    const { w, h } = layout.viewBox;
    const fitZoom = Math.min(rect.width / w, rect.height / h) * 0.92;
    // Viewbox dimensions at fitZoom
    const vbW = w / fitZoom;
    const vbH = h / fitZoom;
    // Center: pan by negative half of the "extra" space beyond content
    const panX = -((vbW - w) / 2);
    const panY = -((vbH - h) / 2);
    setZoom(fitZoom);
    setPan({ x: panX, y: panY });
  }, [layout.viewBox]);

  const handleExport = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { w, h } = layout.viewBox;
    // Clone the SVG and set a fixed viewBox for export
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    // Add dark background rect as first child
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
    bg.setAttribute('fill', '#020617');
    clone.insertBefore(bg, clone.firstChild);
    // Serialize and download
    const svgStr = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const modelName = (catalogItem?.model || inverter.snapshot?.model || 'inversor')
      .replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    a.download = `unifilar-${modelName}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [layout.viewBox, catalogItem, inverter.snapshot]);

  // ── Auto-fit on mount & inverter change ───────────────────────────────────
  useEffect(() => {
    hasAutoFit.current = false;
    const timer = setTimeout(() => {
      handleFit();
      hasAutoFit.current = true;
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inverter.id]);

  // ── Keyboard shortcuts: Escape, zoom, fit ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null);
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z => Math.min(5, z * 1.25)); }
      if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.15, z / 1.25)); }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); handleFit(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFit]);

  // ── Empty state ────────────────────────────────────────────────────────────
  const totalStrings = inverter.mpptConfigs.reduce((s, m) => s + (m.strings?.length || 0), 0);
  if (totalStrings === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#020617] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="text-slate-800 text-4xl font-mono">∅</div>
        <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">
          Configure strings nos MPPTs para gerar o esquema unifilar
        </p>
      </div>
    );
  }

  // ── Computed viewBox ───────────────────────────────────────────────────────
  const vbW = layout.viewBox.w / zoom;
  const vbH = layout.viewBox.h / zoom;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* MPPT Filter Strip */}
      {inverter.mpptConfigs.length > 1 && (
        <>
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
            <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest mr-1">Filtro:</span>
          {inverter.mpptConfigs.map((mppt, idx) => {
            const color = getMpptColor(idx);
            const isActive = highlightMpptIdx === idx;
            return (
              <button
                key={mppt.mpptId}
                onClick={() => setHighlightMpptIdx(prev => prev === idx ? null : idx)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-widest transition-all duration-150"
                style={{
                  borderColor: isActive ? color : '#334155',
                  backgroundColor: isActive ? `${color}20` : 'transparent',
                  color: isActive ? color : '#475569',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                M{mppt.mpptId}
              </button>
            );
          })}
            {highlightMpptIdx !== null && (
              <button
                onClick={() => setHighlightMpptIdx(null)}
                className="px-1.5 py-0.5 rounded border border-slate-800 text-[7px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
              >
                limpar
              </button>
            )}
          </div>

          {/* Filter status badge */}
          {highlightMpptIdx !== null && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getMpptColor(highlightMpptIdx) }} />
              <span className="text-[7px] font-mono font-bold uppercase tracking-widest" style={{ color: getMpptColor(highlightMpptIdx) }}>
                Filtrando MPPT {inverter.mpptConfigs[highlightMpptIdx]?.mpptId}
              </span>
            </div>
          )}
        </>
      )}

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        width="100%" height="100%"
        viewBox={`${pan.x} ${pan.y} ${vbW} ${vbH}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
      >
        <defs>
          {/* Arrowhead marker for AC flow direction */}
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <polygon points="0,0 0,6 6,3" fill="#94a3b8" />
          </marker>
          {/* Glow filter for inverter */}
          <filter id="inverter-glow-svg">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background capture rect for pan */}
        <rect
          x={-50000} y={-50000} width={100000} height={100000}
          fill="transparent"
          onPointerDown={handleBgPointerDown}
          onPointerMove={handleBgPointerMove}
          onPointerUp={handleBgPointerUp}
          onPointerCancel={handleBgPointerUp}
        />

        {/* Layer 1: Wires */}
        {layout.wires.map(wire => (
          <SchematicWireRenderer
            key={wire.id} wire={wire}
            isActive={activeWireIds.has(wire.id)}
            dimmed={filteredWireIds !== null && !filteredWireIds.has(wire.id) && wire.mpptIdx !== -1}
          />
        ))}

        {/* Layer 2: Nodes */}
        {layout.nodes.map(node => {
          const isHov = hoveredNodeId === node.id;
          const isSel = selectedNodeId === node.id;
          const isDimmed = filteredNodeIds !== null
            && !filteredNodeIds.has(node.id)
            && !node.id.startsWith('earth-')
            && !ALWAYS_VISIBLE_NODE_IDS.has(node.id);

          const el = (() => {
            if (node.type === 'pv-string') return (
              <PVStringSymbol key={node.id} node={node}
                isHovered={isHov} isSelected={isSel}
                onHover={handleNodeHover} onSelect={handleNodeSelect} />
            );
            if (node.type === 'fuse')       return <FuseSymbol             key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'bus-bar')    return <BusBarSymbol           key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'dps-tap')    return <DPSSymbol              key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'dc-switch')  return <DCSwitchSymbol         key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'inverter')   return <InverterSchematicBlock key={node.id} node={node} isHovered={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'ac-breaker') return <ACBreakerSymbol        key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'meter')      return <BidirectionalMeterSymbol key={node.id} node={node} isActive={isHov} onSelect={handleNodeSelect} />;
            if (node.type === 'grid')       return <GridSymbol             key={node.id} node={node} onSelect={handleNodeSelect} />;
            if (node.type === 'earth-symbol') return <EarthSymbol          key={node.id} node={node} />;
            return null;
          })();

          if (!el) return null;
          return isDimmed
            ? <g key={node.id} opacity={0.08} style={{ transition: 'opacity 0.15s' }}>{el}</g>
            : el;
        })}

        {/* Layer 2.5: Junction dots (on top of wires, below nodes) */}
        {layout.junctions.map(junction => (
          <circle
            key={junction.id}
            cx={junction.x}
            cy={junction.y}
            r={2}
            fill={junction.color}
            opacity={0.9}
          />
        ))}

        {/* Layer 3: Labels */}
        <LabelLayer labels={layout.labels} showElectrical={showLabels} />

        {/* Layer 4: Validation markers */}
        {layout.markers.map(marker => (
          <ValidationMarker key={marker.id} marker={marker} onSelect={handleNodeSelect} />
        ))}

        {/* Layer 5: MPPT group labels (left margin) */}
        {(() => {
          const items: React.ReactElement[] = [];
          let accumY = PAD_Y;
          inverter.mpptConfigs.forEach((mppt, idx) => {
            const strings = mppt.strings || [];
            if (strings.length === 0) { accumY += PV_H + MPPT_GAP; return; }
            const cy = accumY + ((strings.length - 1) * (PV_H + STR_GAP)) / 2 + PV_H / 2;
            items.push(
              <text key={mppt.mpptId}
                x={PAD_X - 12} y={cy}
                textAnchor="end" dominantBaseline="middle"
                fill={getMpptColor(idx)} fontSize={7.5}
                fontFamily="monospace" fontWeight="bold"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                M{mppt.mpptId}
              </text>
            );
            accumY += strings.length * (PV_H + STR_GAP) - STR_GAP + MPPT_GAP;
          });
          return items;
        })()}
      </svg>

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onExport={handleExport}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(v => !v)}
        panelOpen={selectedNode !== null}
      />

      {/* Legend bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-slate-800/60 bg-slate-950/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setLegendCollapsed(v => !v)}
            className="px-2 py-2 text-slate-700 hover:text-slate-400 transition-colors border-r border-slate-800"
            title={legendCollapsed ? 'Expandir legenda' : 'Recolher legenda'}
          >
            <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${legendCollapsed ? '' : 'rotate-180'}`} />
          </button>
          {!legendCollapsed && (
            <div className="flex-1 px-4 py-2 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-5 h-[2px] bg-sky-500" />
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Condutor CC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-[2px] bg-slate-400" />
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Condutor CA</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Terra (PE)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-amber-500/60 rounded-full" />
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">DPS ±PE</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Seccionador CC icon */}
                <svg width="18" height="10"><circle cx="1" cy="5" r="1.5" fill="#64748b" /><line x1="1" y1="5" x2="6" y2="5" stroke="#64748b" strokeWidth="1" /><line x1="6" y1="5" x2="13" y2="2" stroke="#64748b" strokeWidth="1" /><circle cx="17" cy="5" r="1.5" fill="#64748b" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Secc. CC</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Medidor bidirecional icon */}
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#64748b" strokeWidth="1" /><text x="7" y="8" textAnchor="middle" fill="#64748b" fontSize="4" fontFamily="monospace" fontWeight="bold">kWh</text></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Medidor</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-2 h-2 rounded-full bg-red-500/70" />
                <span className="text-[7.5px] text-red-600 uppercase font-bold tracking-widest">Erro</span>
                <div className="w-2 h-2 rounded-full bg-amber-500/70 ml-2" />
                <span className="text-[7.5px] text-amber-600 uppercase font-bold tracking-widest">Aviso</span>
              </div>
              {inverter.mpptConfigs.length > 1 && inverter.mpptConfigs.map((mppt, idx) => {
                const color = getMpptColor(idx);
                return (
                  <div key={mppt.mpptId} className="flex items-center gap-2">
                    <div className="w-5 h-[2px]" style={{ backgroundColor: color }} />
                    <span className="text-[7.5px] uppercase font-bold tracking-widest" style={{ color }}>M{mppt.mpptId}</span>
                  </div>
                );
              })}
              <div className="ml-auto">
                <span className="text-[6.5px] text-slate-800 font-mono uppercase tracking-[0.2em]">
                  IEC 60617 · NBR 16690:2019
                </span>
              </div>
            </div>
          )}
          {legendCollapsed && (
            <span className="px-3 py-2 text-[7px] text-slate-700 font-mono uppercase tracking-widest">Legenda recolhida</span>
          )}
        </div>
      </div>

      {/* String detail panel */}
      {selectedNode?.type === 'pv-string' && (
        <StringDetailCard
          node={selectedNode}
          mpptMetrics={mpptMetrics}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {/* Inverter detail panel (G5) */}
      {selectedNode?.type === 'inverter' && (
        <InverterDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {/* Fuse, BusBar, DPS, ACBreaker, Grid detail cards */}
      {selectedNode?.type === 'fuse'       && <FuseDetailCard    node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />}
      {selectedNode?.type === 'bus-bar'    && <BusBarDetailCard  node={selectedNode} onClose={() => setSelectedNodeId(null)} />}
      {selectedNode?.type === 'dps-tap'    && <DPSDetailCard     node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />}
      {selectedNode?.type === 'ac-breaker' && <ACBreakerDetailCard node={selectedNode} onClose={() => setSelectedNodeId(null)} />}
      {selectedNode?.type === 'grid'       && <GridDetailCard    node={selectedNode} onClose={() => setSelectedNodeId(null)} />}

      {/* Validation Error Panel */}
      {(() => {
        const marker = selectedNodeId
          ? layout.markers.find(m => m.id === selectedNodeId)
          : null;
        return marker ? (
          <ValidationErrorPanel marker={marker} onClose={() => setSelectedNodeId(null)} />
        ) : null;
      })()}
    </div>
  );
};
