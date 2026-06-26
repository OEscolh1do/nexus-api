/**
 * unifilarLayout — Layout engine for UnifilarSchematicCanvas
 *
 * Extracted from UnifilarSchematicCanvas.tsx (H1).
 * Pure function: takes inverter config + catalog data, returns schematic layout.
 */

import type { InverterState, StringDef } from '../../../../store/useTechStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import {
  type SchematicNode, type SchematicWire, type SchematicLabel,
  type SchematicMarker, type JunctionDot, type UnifilarLayout,
  type MpptValidationError,
  PAD_X, PAD_Y, PV_W, PV_H, STR_GAP, MPPT_GAP,
  FUSE_X_OFFSET, FUSE_W, FUSE_H, BUS_X,
  DPS_TAP_X, DC_SWITCH_W, DC_SWITCH_H, DC_SWITCH_X,
  INV_X, INV_W, INV_H_BASE, MPPT_PORT_SPACING,
  AC_OUT_X, BREAKER_X, BREAKER_W, BREAKER_H,
  METER_W, METER_H, METER_X, GRID_X, GRID_W, GRID_H,
  DPS_W, DPS_H, getMpptColor,
} from './unifilarTypes';

// Re-export so consumers that already import from this module still work
export type { MpptValidationError } from './unifilarTypes';

export function computeUnifilarLayout(
  inverter: InverterState,
  catalogItem: InverterCatalogItem | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mpptMetrics: Record<number, any>,
  validationErrors?: Record<number, MpptValidationError>,
): UnifilarLayout {
  const nodes: SchematicNode[] = [];
  const wires: SchematicWire[] = [];
  const labels: SchematicLabel[] = [];
  const markers: SchematicMarker[] = [];
  const junctions: JunctionDot[] = [];

  // BUG-03 fix: Accumulate extra cable voltage errors in local map instead of mutating input
  const extraErrors: Record<number, MpptValidationError> = {};

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
    // SWEEP8-AREA3 fix: track used node IDs to detect duplicates
    const usedNodeIds = new Set<string>();
    strings.forEach((str, strIdx) => {
      // Skip string if it has no modules
      const unitIsc = metrics?.unitIsc ?? 0;
      if (str.modulesCount === 0) return;

      const cy = currentY + PV_H / 2;
      stringCenterYs.push(cy);
      stringCenterMap.set(str.id, cy);
      const fuseRef = `F${fuseCounter++}`;

      // SWEEP8-AREA3 fix: ensure unique node ID even if str.id is duplicated across MPPTs
      const baseNodeId = `pv-${mppt.mpptId}-${str.id}`;
      const nodeId = usedNodeIds.has(baseNodeId) ? `${baseNodeId}-${strIdx}` : baseNodeId;
      usedNodeIds.add(nodeId);

      nodes.push({
        id: nodeId,
        type: 'pv-string',
        x: PAD_X, y: currentY, w: PV_W, h: PV_H,
        data: {
          type: 'pv-string',
          string: str,
          mpptId: mppt.mpptId,
          mpptIdx,
          mpptColor,
          fuseRef,
          unitPmax: metrics?.unitPmax ?? 0,
          moduleModel: metrics?.moduleModel ?? '',
        },
      });

      const fuseNodeId = usedNodeIds.has(`fuse-${mppt.mpptId}-${str.id}`)
        ? `fuse-${mppt.mpptId}-${str.id}-${strIdx}`
        : `fuse-${mppt.mpptId}-${str.id}`;
      usedNodeIds.add(fuseNodeId);

      nodes.push({
        id: fuseNodeId,
        type: 'fuse',
        x: fuseLeftX, y: cy - FUSE_H / 2, w: FUSE_W, h: FUSE_H,
        data: { type: 'fuse', stringId: str.id, mpptId: mppt.mpptId, mpptIdx, mpptColor, refDesig: fuseRef },
      });

      // Wire: PV → fuse (use matching node IDs)
      wires.push({
        id: `w-pv-fuse-${mppt.mpptId}-${str.id}-${strIdx}`,
        mpptIdx, polarity: 'dc',
        path: `M ${PAD_X + PV_W} ${cy} H ${fuseLeftX}`,
        nodeIds: [nodeId, fuseNodeId],
      });

      // Wire: fuse → bus bar
      wires.push({
        id: `w-fuse-bus-${mppt.mpptId}-${str.id}-${strIdx}`,
        mpptIdx, polarity: 'dc',
        path: `M ${fuseLeftX + FUSE_W} ${cy} H ${BUS_X}`,
        nodeIds: [fuseNodeId, `bus-${mppt.mpptId}`],
      });

      // Junction dot where wire meets bus bar
      junctions.push({
        id: `junction-bus-${mppt.mpptId}-${str.id}-${strIdx}`,
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
      // UX-06 fix: Dynamic cable voltage class based on vocFrio
      // NBR 16612: cabos PV devem ter isolação para 1,5 kV CC (padrão) ou 1,8 kV (se Voc > 1100V)
      if (str.cableSection > 0) {
        const vocFrioVal = metrics?.vocFrio ?? 0;
        const cableVoltageClass = vocFrioVal > 1100 ? 'PV1,8kV' : 'PV1,5kV';
        // UX-06: Validation warning if Voc exceeds cable class
        if (vocFrioVal > 1500) {
          const msg = "Tensão em circuito aberto excede a classe do cabo PV";
          const existing = extraErrors[mppt.mpptId] ?? validationErrors?.[mppt.mpptId];
          if (!existing?.messages.includes(msg)) {
            extraErrors[mppt.mpptId] = {
              severity: 'warn',
              messages: [...(existing?.messages ?? []), msg],
            };
          }
        }
        labels.push({
          id: `lbl-cable-${str.id}`,
          text: `${str.cableSection}mm² Cu · ${cableVoltageClass}`,
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

    // Guard: skip MPPT if all strings were invalid (no modules)
    // Add consistent spacing: if MPPT config exists but has no valid strings,
    // add same spacing as empty MPPT (PV_H + MPPT_GAP for visual consistency)
    if (stringCenterYs.length === 0) {
      currentY += PV_H + MPPT_GAP;
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
      data: { type: 'bus-bar', mpptId: mppt.mpptId, mpptIdx, mpptColor },
    });

    // ── DPS ──────────────────────────────────────────────────────────────
    const dpsRef = `DPS${dpsCounter++}`;
    nodes.push({
      id: `dps-${mppt.mpptId}`,
      type: 'dps-tap',
      x: DPS_TAP_X - DPS_W / 2, y: groupCenterY + 6, w: DPS_W, h: DPS_H,
      data: { type: 'dps-tap', mpptId: mppt.mpptId, mpptIdx, mpptColor, refDesig: dpsRef },
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
      data: { type: 'dc-switch', mpptIdx, mpptId: mppt.mpptId, mpptColor, refDesig: switchRef },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footprintChannel = (catalogItem as any)?.blockDiagramFootprint?.mpptChannels?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      data: { type: 'earth-symbol', mpptIdx, mpptId: mppt.mpptId },
    });

    // SWEEP8-AREA10 fix: stub wires should have [sourceId, sourceId] for semantic correctness
    wires.push({
      id: `w-dps-gnd-${mppt.mpptId}`,
      mpptIdx, polarity: 'gnd',
      path: `M ${DPS_TAP_X} ${groupCenterY} V ${dpsEarthY}`,
      nodeIds: [`dps-${mppt.mpptId}`, `earth-dps-${mppt.mpptId}`],
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
    const err = extraErrors[mppt.mpptId] ?? validationErrors?.[mppt.mpptId];
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
    // SWEEP8-AREA10 fix: PE array wire is a bus, not connected to specific nodes — use [system-pe, system-pe]
    wires.push({
      id: 'w-pe-array',
      mpptIdx: -1, polarity: 'gnd',
      path: `M ${PAD_X} ${peY} H ${INV_X + INV_W / 2}`,
      nodeIds: ['system-pe', 'system-pe'],
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
    data: { type: 'inverter', inverter, catalogItem, mpptCount, refDesig: 'INV-01' },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    data: { type: 'ac-breaker', refDesig: 'DJ1' },
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
    data: { type: 'meter', refDesig: 'MED-01' },
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
    data: { type: 'grid', phase: acPhase },
  });

  // G4: AC output label (from footprint, if present)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // SWEEP8-AREA10 fix: ground stub connects inverter to earth symbol
  wires.push({
    id: 'w-gnd-inv', mpptIdx: -1, polarity: 'gnd',
    path: `M ${INV_X + INV_W / 2} ${invY + invH} V ${invY + invH + 20}`,
    nodeIds: ['inverter', 'earth-symbol'],
  });

  // ── Earth symbol at GND stub termination ─────────────────────────────────
  nodes.push({
    id: 'earth-symbol',
    type: 'earth-symbol',
    x: INV_X + INV_W / 2 - 8,
    y: invY + invH + 20,
    w: 16,
    h: 14,
    data: { type: 'earth-symbol' },
  });

  // SWEEP5-BUG2 fix: filter out orphaned markers (for removed MPPTs)
  // Valid MPPT IDs are those that actually exist in the inverter config
  const validMpptIds = new Set(inverter.mpptConfigs.map(m => m.mpptId));
  const validatedMarkers = markers.filter(marker => {
    // Extract mpptId from marker.id (format: marker-mppt-{mpptId})
    const match = marker.id.match(/marker-mppt-(\d+)/);
    if (!match) return true; // non-MPPT markers always valid
    const mpptId = parseInt(match[1]);
    return validMpptIds.has(mpptId);
  });

  // ── ViewBox ───────────────────────────────────────────────────────────────
  const svgH = Math.max(currentY, invY + invH + 60) + PAD_Y;
  const svgW = GRID_X + GRID_W + PAD_X + 20;

  return { nodes, wires, labels, markers: validatedMarkers, junctions, viewBox: { x: 0, y: 0, w: svgW, h: svgH } };
}
