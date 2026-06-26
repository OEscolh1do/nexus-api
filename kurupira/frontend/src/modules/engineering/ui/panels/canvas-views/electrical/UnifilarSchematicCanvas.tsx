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
 *
 * Module structure (H1 split):
 *   unifilarTypes.ts       — Types, layout constants, colour helpers
 *   unifilarLayout.ts      — computeUnifilarLayout() engine
 *   unifilarSymbols.tsx    — IEC symbol sub-components + rendering layers
 *   unifilarDetailCards.tsx — Node inspection panels
 */

import React, {
  useMemo, useState, useCallback, useRef, useEffect,
} from 'react';
import type { InverterState } from '../../../../store/useTechStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { ZoomIn, ZoomOut, Maximize2, Download, Tag, ChevronRight, Table2, FileText } from 'lucide-react';

import {
  type MpptValidationError,
  PAD_X, PAD_Y, PV_H, STR_GAP, MPPT_GAP,
  getMpptColor, ALWAYS_VISIBLE_NODE_IDS,
} from './unifilarTypes';
import { computeUnifilarLayout } from './unifilarLayout';
import {
  SymbolCatalogDefs,
  PVStringSymbol, FuseSymbol, BusBarSymbol, DPSSymbol, DCSwitchSymbol,
  InverterSchematicBlock, ACBreakerSymbol, BidirectionalMeterSymbol, GridSymbol, EarthSymbol,
  SchematicWireRenderer, LabelLayer, ValidationMarker,
} from './unifilarSymbols';
import {
  StringDetailCard, FuseDetailCard, InverterDetailPanel, BusBarDetailCard,
  DPSDetailCard, ACBreakerDetailCard, GridDetailCard, ValidationErrorPanel,
} from './unifilarDetailCards';

// Re-export for consumers that import MpptValidationError from this file
export type { MpptValidationError };

// =============================================================================
// ZOOM CONTROLS
// =============================================================================

// L3-P2: React.memo no ZoomControls
const ZoomControls = React.memo<{
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExport?: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  panelOpen?: boolean;
}>(({ zoom, onZoomIn, onZoomOut, onFit, onExport, showLabels, onToggleLabels, panelOpen }) => (
  <div className={`absolute bottom-14 z-20 flex flex-col gap-1 items-center transition-all duration-300 ${panelOpen ? 'right-[272px]' : 'right-4'}`}>
    {onExport && (
      <button onClick={onExport}
        className="w-7 h-7 bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500 transition-all"
        title="Exportar SVG">
        <Download size={11} />
      </button>
    )}
    {onToggleLabels && (
      <button onClick={onToggleLabels}
        className={`w-7 h-7 bg-slate-900/90 border flex items-center justify-center transition-all ${showLabels ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-indigo-500/50 text-indigo-400'}`}
        title={showLabels ? 'Ocultar labels' : 'Mostrar labels'}>
        <Tag size={10} />
      </button>
    )}
    <button onClick={onZoomIn}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
      title="Zoom in (+)">
      <ZoomIn size={12} />
    </button>
    <button onClick={onZoomOut}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
      title="Zoom out (-)">
      <ZoomOut size={12} />
    </button>
    <button onClick={onFit}
      className="w-7 h-7 bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
      title="Fit (F)">
      <Maximize2 size={11} />
    </button>
    <span className="text-[8px] text-slate-700 font-mono tabular-nums mt-0.5">
      {Math.round(zoom * 100)}%
    </span>
  </div>
));

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface UnifilarSchematicCanvasProps {
  inverter: InverterState;
  catalogItem: InverterCatalogItem | undefined;
  mpptMetrics: Record<number, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  validationErrors?: Record<number, MpptValidationError>;
}

export const UnifilarSchematicCanvas: React.FC<UnifilarSchematicCanvasProps> = ({
  inverter, catalogItem, mpptMetrics, validationErrors,
}) => {
  // ── Interaction state ──────────────────────────────────────────────────────
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // L3-H2: filtro MPPT persiste por inversor usando ref de mapa
  const highlightMpptMapRef = useRef<Record<string, number | null>>({});
  const [highlightMpptIdx, setHighlightMpptIdx] = useState<number | null>(() =>
    highlightMpptMapRef.current[inverter.id] ?? null
  );

  // ── Pan / Zoom state ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // ── Label visibility, print mode & legend collapse ────────────────────────
  const [showLabels, setShowLabels] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  // D: Irradiance simulation (W/m² — 0–1000, default STC)
  const [irradiance, setIrradiance] = useState(1000);
  // B: Ruler drag-to-measure
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ x: number; y: number } | null>(null);
  // B: Free text annotations (Alt+click)
  const [annotations, setAnnotations] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  // BUG #1 fix: SVG text escape helper
  const escapeSvgText = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  // C: Type-ahead node search
  const [nodeSearch, setNodeSearch] = useState('');
  // C: Collapsed MPPT groups
  const [collapsedMpptIds, setCollapsedMpptIds] = useState<Set<number>>(new Set());
  // D: Validation checklist panel
  const [showChecklist, setShowChecklist] = useState(false);
  // A: Full electrical path highlight
  const [selectedPathHighlight, setSelectedPathHighlight] = useState(true);
  // B: Inline editing — double-click string label
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  // BUG #2 fix: Store original value to compare on Escape
  const editingOriginalValue = useRef<string>('');
  // BUG #2 fix: Local state to persist custom string labels
  const [stringLabelOverrides, setStringLabelOverrides] = useState<Record<string, string>>({});
  // C: Shading simulation (per-string factor 0–100%)
  const [shadingFactor, setShadingFactor] = useState(100); // %
  const [showPowerBars, setShowPowerBars] = useState(false);
  // D: Conductor table panel
  const [showConductorTable, setShowConductorTable] = useState(false);
  // A: Node comparison — pin a pv-string to compare with the currently selected one
  const [compareNodeId, setCompareNodeId] = useState<string | null>(null);
  // D: Export metadata (project name, author, revision) embedded in IEC stamp
  const [exportMeta, setExportMeta] = useState({ projectName: '', author: '', revision: 'R0' });
  const [showExportMetaModal, setShowExportMetaModal] = useState(false);
  // L3-P3: legendCollapsed persiste em localStorage
  const [legendCollapsed, setLegendCollapsed] = useState(() =>
    localStorage.getItem('unifilar-legend-collapsed') === 'true'
  );
  const svgRef   = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPt    = useRef({ x: 0, y: 0 });
  const hasAutoFit = useRef(false);
  const handleFitRef = useRef<(() => void) | null>(null);
  // Keep refs in sync for non-reactive wheel handler and keyboard handler
  const zoomRef = useRef(zoom);
  const panRef  = useRef(pan);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layoutRef          = useRef<any>(null); // set via sync effect after layout useMemo
  const selectedNodeIdRef  = useRef<string | null>(null);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  // L3-H2: sincroniza highlightMpptIdx com o mapa quando muda
  useEffect(() => {
    highlightMpptMapRef.current[inverter.id] = highlightMpptIdx;
  }, [highlightMpptIdx, inverter.id]);

  // L3-H2: restaura filtro ao trocar inversor
  // BUG #6 fix: validate restored filter index is within bounds
  useEffect(() => {
    const restored = highlightMpptMapRef.current[inverter.id] ?? null;
    if (restored !== null && restored >= inverter.mpptConfigs.length) {
      setHighlightMpptIdx(null); // clear invalid filter
    } else {
      setHighlightMpptIdx(restored);
    }
  }, [inverter.id, inverter.mpptConfigs.length]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  // PERF-04 fix: hash estável por campos escalares (evita JSON.stringify)
  const mpptMetricsKey = useMemo(() => {
    const entries = Object.entries(mpptMetrics);
    return entries.map(([k, m]) =>
      `${k}|${m?.totalPower ?? 0}|${m?.vocFrio ?? 0}|${m?.vmpCalor ?? 0}|${m?.iscTotal ?? 0}`
    ).join(',');
  }, [mpptMetrics]);
  const layout = useMemo(
    () => computeUnifilarLayout(inverter, catalogItem, mpptMetrics, validationErrors),
    [inverter, catalogItem, mpptMetricsKey, validationErrors],
  );

  // ── Wire highlight via hover — A1: circuit-path aware ────────────────────
  // Hovering a DC node illuminates its entire MPPT chain + AC side.
  // Hovering inverter illuminates every wire. Hovering AC nodes: AC chain only.
  const activeWireIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const hoveredNode = layout.nodes.find(n => n.id === hoveredNodeId);
    if (!hoveredNode) return new Set<string>();

    // Inverter: full schematic illumination
    if (hoveredNode.type === 'inverter') {
      return new Set(layout.wires.map(w => w.id));
    }
    // AC side: only the AC chain (breaker → meter → grid)
    if (hoveredNode.type === 'ac-breaker' || hoveredNode.type === 'meter' || hoveredNode.type === 'grid') {
      return new Set(layout.wires.filter(w => w.polarity === 'ac').map(w => w.id));
    }
    // DC node with mpptIdx: highlight full MPPT path + AC chain
    const mpptIdx = (hoveredNode.data as any)?.mpptIdx; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (mpptIdx !== undefined) {
      return new Set(layout.wires.filter(w => w.mpptIdx === mpptIdx || w.polarity === 'ac').map(w => w.id));
    }
    // Fallback: adjacent wires only
    return new Set(layout.wires.filter(w => w.nodeIds.includes(hoveredNodeId)).map(w => w.id));
  }, [hoveredNodeId, layout.nodes, layout.wires]);

  // ── MPPT filter: filtered wire/node IDs ──────────────────────────────────
  const filteredWireIds = useMemo(() => {
    if (highlightMpptIdx === null) return null; // null = show all
    return new Set(layout.wires.filter(w => w.mpptIdx === highlightMpptIdx).map(w => w.id));
  }, [highlightMpptIdx, layout.wires]);

  // PERF-06 fix: pré-índice por mpptIdx para evitar O(n²)
  const nodesByMpptIdx = useMemo(() => {
    const map = new Map<number, Set<string>>();
    layout.nodes.forEach(n => {
      const data = n.data as any;
      const idx = data?.mpptIdx;
      if (idx !== undefined) {
        if (!map.has(idx)) map.set(idx, new Set());
        map.get(idx)!.add(n.id);
      }
    });
    return map;
  }, [layout.nodes]);

  const filteredNodeIds = useMemo(() => {
    if (highlightMpptIdx === null) return null;
    const base = nodesByMpptIdx.get(highlightMpptIdx) ?? new Set<string>();
    const result = new Set(base);
    // Adiciona sempre-visíveis (inverter, grid, etc.)
    layout.nodes.forEach(n => {
      if (ALWAYS_VISIBLE_NODE_IDS.has(n.id)) {
        result.add(n.id);
      }
      // BUG-02 fix: earth-dps-* nodes should only be visible if their parent MPPT is active
      if (n.id.startsWith('earth-')) {
        const data = n.data as any;
        const earthMpptIdx = data?.mpptIdx;
        // Only show earth symbols for the active MPPT (or global earth symbols without mpptIdx)
        if (earthMpptIdx === undefined || earthMpptIdx === highlightMpptIdx) {
          result.add(n.id);
        }
      }
    });
    return result;
  }, [highlightMpptIdx, nodesByMpptIdx, layout.nodes]);

  // A6 fix: filtered marker IDs based on filteredNodeIds
  const filteredMarkerIds = useMemo(() => {
    if (filteredNodeIds === null) return null;
    // Markers ligados a MPPTs específicos — filtrar pelos nodeIds visíveis
    return new Set(
      layout.markers
        .filter(m => {
          // Extrair mpptId do id do marker (formato: marker-mppt-{mpptId})
          const match = m.id.match(/marker-mppt-(\d+)/);
          if (!match) return true; // marcadores não-MPPT sempre visíveis
          const mpptId = parseInt(match[1]);
          // Buscar bus-bar node deste MPPT para verificar se está nos filteredNodeIds
          const busNodeId = `bus-${mpptId}`;
          return filteredNodeIds.has(busNodeId);
        })
        .map(m => m.id)
    );
  }, [filteredNodeIds, layout.markers]);

  // Sync refs used by keyboard handler (avoids stale closures in the stable [] effect)
  useEffect(() => { layoutRef.current = layout; }, [layout]);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);

  // BUG-07 fix: clear compareNodeId when the pinned node disappears from layout
  useEffect(() => {
    if (compareNodeId && !layout.nodes.find(n => n.id === compareNodeId)) {
      setCompareNodeId(null);
    }
  }, [compareNodeId, layout.nodes]);

  // BUG #10 fix: clear selectedNodeId when the selected node disappears from layout
  useEffect(() => {
    if (selectedNodeId && !layout.nodes.find(n => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, layout.nodes]);

  // SWEEP5-BUG1 fix: clear stale MPPT IDs from collapsedMpptIds when inverter config changes
  useEffect(() => {
    const currentMpptIds = new Set(inverter.mpptConfigs.map(m => m.mpptId));
    setCollapsedMpptIds(prev => {
      const cleaned = new Set<number>();
      prev.forEach(id => {
        if (currentMpptIds.has(id)) cleaned.add(id);
      });
      return cleaned.size !== prev.size ? cleaned : prev;
    });
  }, [inverter.mpptConfigs]);

  // B5: System-level summary (total kWp, string count, MPPT count)
  const systemSummary = useMemo(() => {
    let totalKwp = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(mpptMetrics as Record<string, any>).forEach(m => {
      // BUG #14 fix: explicit NaN guard for powerKwp
      const kwp = m?.powerKwp;
      if (kwp != null && !isNaN(kwp) && kwp > 0) totalKwp += kwp;
    });
    const totalStrings = inverter.mpptConfigs.reduce((s, m) => s + (m.strings?.length || 0), 0);
    // SWEEP11-AREA7 fix: apply irradiance correction to power calculation
    // Formula: P_current = P_stc × (G / 1000) where G is current irradiance (W/m²)
    const currentPowerKwp = totalKwp * (irradiance / 1000);
    return {
      totalKwp,
      currentPowerKwp, // power at current irradiance
      totalStrings,
      mpptCount: inverter.mpptConfigs.length
    };
  }, [mpptMetrics, inverter.mpptConfigs, irradiance]);

  // A: Nodes with validation errors → pulsing halo
  const errorNodeIds = useMemo(() => {
    if (!validationErrors) return new Set<string>();
    const ids = new Set<string>();
    Object.entries(validationErrors).forEach(([mpptIdStr]) => {
      const mpptId = Number(mpptIdStr);
      layout.nodes.forEach(n => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = n.data as any;
        if (d?.mpptId === mpptId || d?.mpptIdx === mpptId) ids.add(n.id);
      });
    });
    return ids;
  }, [validationErrors, layout.nodes]);

  // D: Compliance score 0–100%
  const complianceScore = useMemo(() => {
    if (!validationErrors) return 100;
    const errorCount = Object.values(validationErrors).filter(e => (e as any).errors?.length > 0).length;
    const warnCount  = Object.values(validationErrors).filter(e => (e as any).warnings?.length > 0).length;
    return Math.max(0, Math.round(100 - errorCount * 20 - warnCount * 5));
  }, [validationErrors]);

  // C: Search-filtered node IDs
  const searchFilteredNodeIds = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase();
    if (!q) return null;
    const matches = new Set<string>();
    layout.nodes.forEach(n => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = n.data as any;
      const label = (d?.string?.name ?? d?.refDesig ?? (d?.catalogItem as any)?.model ?? n.type ?? '').toLowerCase();
      if (label.includes(q)) matches.add(n.id);
    });
    return matches;
  }, [nodeSearch, layout.nodes]);

  // C: Collapsed MPPT — extends filteredNodeIds logic
  const collapsedNodeIds = useMemo(() => {
    if (collapsedMpptIds.size === 0) return new Set<string>();
    const ids = new Set<string>();
    layout.nodes.forEach(n => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = n.data as any;
      const mpptId = d?.mpptId ?? d?.mpptIdx;
      if (mpptId !== undefined && collapsedMpptIds.has(mpptId) && n.type === 'pv-string') {
        ids.add(n.id);
      }
    });
    return ids;
  }, [collapsedMpptIds, layout.nodes]);

  // B: SVG coordinate helper (for ruler + annotations)
  const toSvgPt = useCallback((e: React.PointerEvent | PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = pt.matrixTransform(ctm.inverse());
    return { x: inv.x, y: inv.y };
  }, []);

  // A: Electrical path highlight for selected node (extends activeWireIds when pathHighlight is on)
  const selectedPathWireIds = useMemo(() => {
    if (!selectedNodeId || !selectedPathHighlight) return new Set<string>();
    const node = layout.nodes.find(n => n.id === selectedNodeId);
    if (!node) return new Set<string>();
    // BUG #4 fix: earth-symbol nodes have no wire highlight
    if (node.type === 'earth-symbol') return new Set<string>();
    if (node.type === 'inverter') return new Set(layout.wires.map(w => w.id));
    if (node.type === 'ac-breaker' || node.type === 'meter' || node.type === 'grid') {
      return new Set(layout.wires.filter(w => w.polarity === 'ac').map(w => w.id));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mpptIdx = (node.data as any)?.mpptIdx;
    if (mpptIdx !== undefined) {
      return new Set(layout.wires.filter(w => w.mpptIdx === mpptIdx || w.polarity === 'ac').map(w => w.id));
    }
    return new Set(layout.wires.filter(w => w.nodeIds.includes(selectedNodeId)).map(w => w.id));
  }, [selectedNodeId, selectedPathHighlight, layout]);

  // A: Breadcrumb trail for selected node
  const breadcrumb = useMemo(() => {
    if (!selectedNodeId) return [];
    const node = layout.nodes.find(n => n.id === selectedNodeId);
    if (!node) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = node.data as any;
    const chain: string[] = [];
    if (node.type === 'pv-string') chain.push(`${d.string?.name ?? 'STR'} → Fusível F${d.mpptId} → Bus M${d.mpptId} → Secc. → Inversor → DJ → Rede`);
    else if (node.type === 'fuse') chain.push(`Fusível ${d.refDesig} → Bus M${d.mpptId} → Secc. → Inversor`);
    else if (node.type === 'bus-bar') chain.push(`Bus M${d.mpptId} → Secc. → Inversor → DJ → Rede`);
    else if (node.type === 'dps-tap') chain.push(`DPS ${d.refDesig} ↔ Bus M${d.mpptId} → PE`);
    else if (node.type === 'dc-switch') chain.push(`Secc. ${d.refDesig} → Inversor`);
    else if (node.type === 'inverter') chain.push('Inversor → Disjuntor DJ1 → Medidor → Rede');
    else if (node.type === 'ac-breaker') chain.push(`Disjuntor ${d.refDesig} → Medidor → Rede`);
    else if (node.type === 'meter') chain.push(`Medidor ${d.refDesig} → Rede`);
    else if (node.type === 'grid') chain.push('Rede elétrica');
    return chain;
  }, [selectedNodeId, layout.nodes]);

  // C: Conductor table data
  const conductorTable = useMemo(() => {
    return inverter.mpptConfigs.flatMap((mppt, idx) =>
      (mppt.strings || []).map((str, si) => {
        const m = mpptMetrics[mppt.mpptId];
        // SWEEP11-AREA8 fix: use Imp (operating current) instead of Isc for voltage drop calculation
        // NBR 16690:2019 §522.8.3 requires evaluation at Vmp quente with Imp operating current
        const imp = m?.impTotal ?? 0;
        // BUG #11 fix: safe defaults for cableLength and cableSection
        const cableLength = str.cableLength ?? 0;
        const cableSection = str.cableSection ?? 0;
        // BUG #13 fix: extend standard sections to include larger sizes per guide spec
        const sectionStd = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
        const rho = 0.02267;
        // SWEEP9-AREA5 fix: Use Vmp hot (operating voltage) as system voltage for NBR 16690 compliance
        const vsys = m?.vmpCalor > 0 ? m.vmpCalor : 400; // Vmp at hot temp (operating point)
        const maxVDrop = vsys * 0.01; // 1% of system voltage
        // SWEEP8-AREA2 fix: guard against zero Imp to avoid false "OK" ΔV=0
        const sMin = imp > 0 && cableLength > 0 && maxVDrop > 0
          ? rho * 2 * cableLength * imp / maxVDrop
          : 0;
        const suggestedSection = sectionStd.find(s => s >= sMin) ?? cableSection;
        // SWEEP8-AREA2 fix: only calculate vDrop if imp > 0 (otherwise show undefined)
        const vDrop = cableSection > 0 && cableLength > 0 && imp > 0
          ? rho * 2 * cableLength * imp / cableSection
          : undefined;
        // SWEEP11-AREA8 fix: calculate voltage drop percentage for NBR 16690 compliance
        const vDropPercent = vDrop !== undefined && vsys > 0 ? (vDrop / vsys) * 100 : undefined;
        return {
          id: str.id, name: str.name, mpptId: mppt.mpptId, mpptIdx: idx,
          section: cableSection, length: cableLength,
          imp: imp > 0 ? imp.toFixed(2) : '—', // Changed from isc to imp
          vDrop: vDrop !== undefined ? vDrop.toFixed(2) : undefined,
          vDropPercent, // percentage for color coding
          suggestedSection,
          color: getMpptColor(idx),
          isUnderSized: suggestedSection > cableSection,
          modules: str.modulesCount, si,
        };
      })
    );
  }, [inverter.mpptConfigs, mpptMetrics]);

  const handleNodeHover  = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleNodeSelect = useCallback((id: string) => {
    // BUG #9 fix: prevent selecting earth-symbol, collapsed, or filtered nodes
    const node = layout.nodes.find(n => n.id === id);
    if (!node || node.type === 'earth-symbol') return;
    // Prevent selecting collapsed nodes
    if (collapsedNodeIds.has(id)) return;
    // Prevent selecting filtered-out nodes (dimmed by MPPT filter or search)
    if (filteredNodeIds !== null && !filteredNodeIds.has(id) && !ALWAYS_VISIBLE_NODE_IDS.has(id)) return;
    if (searchFilteredNodeIds !== null && !searchFilteredNodeIds.has(id)) return;
    setSelectedNodeId(prev => prev === id ? null : id);
  }, [layout.nodes, collapsedNodeIds, filteredNodeIds, searchFilteredNodeIds]);

  // SWEEP10-AREA7 fix: Specialized handler for marker clicks — un-collapses and selects bus node
  const handleMarkerSelect = useCallback((markerId: string) => {
    const match = markerId.match(/marker-mppt-(\d+)/);
    if (match) {
      const mpptId = parseInt(match[1]);
      const busNodeId = `bus-${mpptId}`;
      // Un-collapse the MPPT group if it's collapsed
      setCollapsedMpptIds(prev => {
        if (prev.has(mpptId)) {
          const next = new Set(prev);
          next.delete(mpptId);
          return next;
        }
        return prev;
      });
      // Select the bus node
      setSelectedNodeId(busNodeId);
    } else {
      // Fallback: use normal select handler
      handleNodeSelect(markerId);
    }
  }, [handleNodeSelect]);

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
    // B: Ruler mode — start measuring
    if (rulerMode) {
      const pt = toSvgPt(e);
      setRulerStart(pt);
      setRulerEnd(pt);
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    // B: Alt+click — create text annotation
    if (e.altKey) {
      // BUG #12 fix: ensure isPanning is false before blocking prompt
      isPanning.current = false;
      const pt = toSvgPt(e);
      const text = window.prompt('Anotação:');
      if (text?.trim()) {
        setAnnotations(prev => [...prev, { id: `ann-${Date.now()}`, x: pt.x, y: pt.y, text: text.trim() }]);
      }
      return;
    }
    // BUG #8 fix: clear selection when clicking background
    setSelectedNodeId(null);
    isPanning.current = true;
    setIsDragging(true);
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [rulerMode, toSvgPt]);

  const handleBgPointerMove = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    // B: Update ruler end (mutually exclusive with pan)
    if (rulerMode && rulerStart) {
      setRulerEnd(toSvgPt(e));
      return;
    }
    // BUG #1 guard: ruler and pan are mutually exclusive — ruler returns above
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
  }, [rulerMode, rulerStart, toSvgPt, layout.viewBox]);

  const handleBgPointerUp = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    if (rulerMode) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      return; // keep ruler displayed until mode exits
    }
    isPanning.current = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, [rulerMode]);

  // ── Zoom control helpers ───────────────────────────────────────────────────
  // UX: handlers estáveis para ZoomControls memo
  const handleZoomIn  = useCallback(() => setZoom(z => Math.min(5, z * 1.25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.15, z / 1.25)), []);

  // BUG-05: Extract stable primitive deps from layout.viewBox before handleFit
  const layoutViewBoxW = layout.viewBox.w;
  const layoutViewBoxH = layout.viewBox.h;

  const handleFit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const rect = svg.getBoundingClientRect();
    // BUG-03 fix: discount panel width (280px) when detail panel is open
    const panelOpen = selectedNodeId !== null;
    const availW = rect.width - (panelOpen ? 280 : 0);
    const w = layoutViewBoxW;
    const h = layoutViewBoxH;
    const fitZoom = Math.min(availW / w, rect.height / h) * 0.92;
    const ZOOM_MIN = 0.15;
    const ZOOM_MAX = 5.0;
    const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fitZoom));
    const vbW = w / clampedZoom;
    const vbH = h / clampedZoom;
    const panX = -((vbW - w) / 2);
    const panY = -((vbH - h) / 2);
    setZoom(clampedZoom);
    setPan({ x: panX, y: panY });
  }, [layoutViewBoxW, layoutViewBoxH, selectedNodeId]);

  // BUG-03: Keep handleFitRef in sync
  useEffect(() => {
    handleFitRef.current = handleFit;
  }, [handleFit]);

  const handleExport = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // SWEEP7-AREA6 fix: Clear transient state before cloning to get clean export
    const prevSelected = selectedNodeId;
    const prevHovered = hoveredNodeId;
    const prevEditing = editingNodeId;
    const prevCompare = compareNodeId;
    // SWEEP9-AREA3 fix: Clear ruler lines before export (UI tool, not diagram content)
    const prevRulerStart = rulerStart;
    const prevRulerEnd = rulerEnd;
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setEditingNodeId(null);
    setCompareNodeId(null);
    setRulerStart(null);
    setRulerEnd(null);

    // Wait for state to flush to DOM before cloning
    setTimeout(() => {
      // SWEEP9-AREA10 fix: Wrap export logic in try/finally to guarantee state restore
      try {
        const { w, h } = layout.viewBox;
        const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
      clone.setAttribute('width', String(w));
      clone.setAttribute('height', String(h));
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
      bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
      bg.setAttribute('fill', '#020617');
      clone.insertBefore(bg, clone.firstChild);
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
      } finally {
        // Restore state even if export throws
        setSelectedNodeId(prevSelected);
        setHoveredNodeId(prevHovered);
        setEditingNodeId(prevEditing);
        setCompareNodeId(prevCompare);
        setRulerStart(prevRulerStart);
        setRulerEnd(prevRulerEnd);
      }
    }, 50);
  }, [layout.viewBox, catalogItem, inverter.snapshot, selectedNodeId, hoveredNodeId, editingNodeId, compareNodeId, rulerStart, rulerEnd]);

  // ── PNG export (full-res canvas render) ───────────────────────────────────
  const handleExportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // SWEEP7-AREA6 fix: Clear transient state before cloning
    const prevSelected = selectedNodeId;
    const prevHovered = hoveredNodeId;
    const prevEditing = editingNodeId;
    const prevCompare = compareNodeId;
    // SWEEP9-AREA3 fix: Clear ruler lines before export
    const prevRulerStart = rulerStart;
    const prevRulerEnd = rulerEnd;
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setEditingNodeId(null);
    setCompareNodeId(null);
    setRulerStart(null);
    setRulerEnd(null);

    setTimeout(() => {
      // SWEEP9-AREA10 fix: Wrap export logic in try/finally to guarantee state restore
      try {
        const { w, h } = layout.viewBox;
        const scale = 2;
        const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
      clone.setAttribute('width', String(w * scale));
      clone.setAttribute('height', String(h * scale));
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
      bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
      bg.setAttribute('fill', printMode ? '#ffffff' : '#020617');
      clone.insertBefore(bg, clone.firstChild);
      const svgStr = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w * scale; canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const modelName = (catalogItem?.model || inverter.snapshot?.model || 'inversor')
              .replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
            a.download = `unifilar-${modelName}-${Date.now()}.png`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
          }, 'image/png');
        };
        img.onerror = () => {
          console.error('[UnifilarSchematic] PNG export failed — image load error');
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      } finally {
        // Restore state even if export throws
        setSelectedNodeId(prevSelected);
        setHoveredNodeId(prevHovered);
        setEditingNodeId(prevEditing);
        setCompareNodeId(prevCompare);
        setRulerStart(prevRulerStart);
        setRulerEnd(prevRulerEnd);
      }
    }, 50);
  }, [layout.viewBox, catalogItem, inverter.snapshot, printMode, selectedNodeId, hoveredNodeId, editingNodeId, compareNodeId, rulerStart, rulerEnd]);

  // ── Auto-fit on mount & inverter change ───────────────────────────────────
  useEffect(() => {
    hasAutoFit.current = false;
    const timer = setTimeout(() => {
      handleFitRef.current?.(); // read through ref — avoids stale closure on layoutViewBoxW/H and selectedNodeId
      hasAutoFit.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, [inverter.id]);

  // ── Keyboard shortcuts: Escape, zoom, fit ─────────────────────────────────
  // SWEEP8-AREA6 fix: add rulerMode to deps so Escape handler sees current value
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // A2: Tab / Shift+Tab — cycle through selectable nodes
      if (e.key === 'Tab') {
        e.preventDefault();
        const nodes = (layoutRef.current?.nodes ?? []).filter((n: { type: string }) => n.type !== 'earth-symbol');
        if (nodes.length === 0) return;
        const ids = nodes.map((n: { id: string }) => n.id);
        const cur = selectedNodeIdRef.current;
        const curIdx = cur ? ids.indexOf(cur) : -1;
        const delta = e.shiftKey ? -1 : 1;
        const nextIdx = ((curIdx + delta) + ids.length) % ids.length;
        setSelectedNodeId(ids[nextIdx]);
        return;
      }

      // A3: J / j — jump to next validation error marker (pan + zoom)
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const markers = layoutRef.current?.markers ?? [];
        if (markers.length === 0) return;
        const cur = selectedNodeIdRef.current;
        const curIdx = cur ? markers.findIndex((m: { id: string }) => m.id === cur) : -1;
        const next = markers[(curIdx + 1) % markers.length];
        setSelectedNodeId(next.id);
        const { w, h } = layoutRef.current.viewBox;
        const targetZoom = 2.0;
        setZoom(targetZoom);
        setPan({ x: next.x - (w / targetZoom) / 2, y: next.y - (h / targetZoom) / 2 });
        return;
      }

      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        // BUG #5 fix: only clear ruler state if ruler mode is active
        if (rulerMode) {
          setRulerMode(false);
          setRulerStart(null);
          setRulerEnd(null);
        }
      }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z => Math.min(5, z * 1.25)); }
      if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.15, z / 1.25)); }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); handleFitRef.current?.(); }
      // B: M — toggle ruler mode
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setRulerMode(r => !r);
        setRulerStart(null); setRulerEnd(null);
      }
      // B: N — clear annotations
      if (e.key === 'n' || e.key === 'N') { setAnnotations([]); }
      // D: C — toggle compliance checklist
      if (e.key === 'c' || e.key === 'C') { e.preventDefault(); setShowChecklist(v => !v); }
      // D: T — toggle conductor table
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); setShowConductorTable(v => !v); }
      // C: P — toggle power bars
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setShowPowerBars(v => !v); }
      // A: H — toggle path highlight
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setSelectedPathHighlight(v => !v); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rulerMode]); // SWEEP8-AREA6 fix: now captures rulerMode changes

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
    <div className={`w-full h-full relative overflow-hidden unifilar-print-mode transition-colors duration-300 ${printMode ? 'bg-white' : 'bg-[#020617]'}`}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* C: Node search input — bottom of filter strip */}
      <div className={`absolute z-20 flex items-center gap-1.5 transition-all duration-300 ${inverter.mpptConfigs.length > 1 ? 'top-11' : 'top-3'} left-3`}>
        <input
          type="text" value={nodeSearch}
          onChange={e => setNodeSearch(e.target.value)}
          placeholder="Buscar nó…"
          className="h-6 w-32 px-2 bg-slate-900/90 border border-slate-800 text-[8px] font-mono text-slate-300 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-colors"
        />
        {nodeSearch && (
          <button onClick={() => setNodeSearch('')}
            className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors">✕</button>
        )}
        {/* B: Ruler mode toggle */}
        <button
          onClick={() => { setRulerMode(r => !r); setRulerStart(null); setRulerEnd(null); }}
          title="Régua de medição (M)"
          className={`h-6 px-2 border text-[7px] font-mono uppercase tracking-wider transition-colors ${
            rulerMode ? 'border-amber-500/60 text-amber-400 bg-amber-950/30' : 'border-slate-800 text-slate-700 hover:text-slate-400'
          }`}
        >
          ↔
        </button>
      </div>

      {/* AREA4 fix: Hint when all strings are collapsed */}
      {(() => {
        const totalStrings = inverter.mpptConfigs.reduce((s, m) => s + (m.strings?.length || 0), 0);
        const totalCollapsed = Array.from(collapsedNodeIds).filter(id =>
          layout.nodes.find(n => n.id === id && n.type === 'pv-string')
        ).length;
        if (totalStrings > 0 && totalCollapsed === totalStrings) {
          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-4 py-3 bg-slate-900/90 border border-indigo-500/40 backdrop-blur-sm flex items-center gap-2">
              <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest">
                Todos os MPPTs recolhidos — clique ▶ nos botões superiores para expandir
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* MPPT Filter Strip */}
      {inverter.mpptConfigs.length > 1 && (
        <>
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 max-w-[80%]">
            <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest mr-1">Filtro:</span>
          {inverter.mpptConfigs.map((mppt, idx) => {
            const color = getMpptColor(idx);
            const isActive = highlightMpptIdx === idx;
            // B15 fix: contagem de strings por MPPT
            const stringCount = (mppt.strings || []).length;
            const m = mpptMetrics[mppt.mpptId];
            const vocInfo = m?.vocFrio > 0 ? ` · Voc: ${m.vocFrio.toFixed(0)}V` : '';
            const iscInfo = m?.iscTotal > 0 ? ` · Isc: ${m.iscTotal.toFixed(1)}A` : '';
            const powerInfo = m?.powerKwp > 0 ? ` · ${m.powerKwp.toFixed(2)} kWp` : '';
            return (
              <button
                key={mppt.mpptId}
                onClick={() => setHighlightMpptIdx(prev => prev === idx ? null : idx)}
                title={`MPPT ${idx + 1} — ${stringCount} string${stringCount !== 1 ? 's' : ''}${vocInfo}${iscInfo}${powerInfo}`}
                className="flex items-center gap-1 px-2 py-0.5 border text-[8px] font-mono font-bold uppercase tracking-widest transition-all duration-150"
                style={{
                  borderColor: isActive ? color : '#334155',
                  backgroundColor: isActive ? `${color}20` : 'transparent',
                  color: isActive ? color : '#475569',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                M{mppt.mpptId}
                {m?.powerKwp > 0 && (
                  <span className="opacity-75 tabular-nums"> · {m.powerKwp.toFixed(1)}kWp</span>
                )}
                <span className="text-[8px] opacity-50"> ({stringCount})</span>
              </button>
            );
          })}
          {/* C: Collapse/expand per-MPPT group */}
          {inverter.mpptConfigs.map((mppt, idx) => {
            const color = getMpptColor(idx);
            const isCollapsed = collapsedMpptIds.has(mppt.mpptId);
            const stringCount = (mppt.strings || []).length;
            return (
              <button key={`col-${mppt.mpptId}`}
                onClick={() => setCollapsedMpptIds(prev => {
                  const next = new Set(prev);
                  if (next.has(mppt.mpptId)) next.delete(mppt.mpptId); else next.add(mppt.mpptId);
                  return next;
                })}
                title={`${isCollapsed ? 'Expandir' : 'Colapsar'} strings MPPT ${mppt.mpptId}`}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? 'Expandir' : 'Colapsar'} ${stringCount} string${stringCount !== 1 ? 's' : ''} do MPPT ${mppt.mpptId}`}
                className="flex items-center gap-0.5 px-1.5 py-0.5 border text-[6px] font-mono transition-all"
                style={{
                  borderColor: isCollapsed ? color : '#1e293b',
                  color: isCollapsed ? color : '#334155',
                  backgroundColor: isCollapsed ? `${color}15` : 'transparent',
                }}>
                {isCollapsed ? '▶' : '▼'} M{mppt.mpptId}
              </button>
            );
          })}
            {highlightMpptIdx !== null && (
              <button
                onClick={() => setHighlightMpptIdx(null)}
                title="Mostrar todos os MPPTs"
                className="px-1.5 py-0.5 border border-slate-800 text-[7px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
              >
                limpar
              </button>
            )}
          </div>

          {/* Filter status badge */}
          {highlightMpptIdx !== null && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 border border-slate-700">
              <div className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: getMpptColor(highlightMpptIdx) }} />
              <span className="text-[7px] font-mono font-bold uppercase tracking-widest" style={{ color: getMpptColor(highlightMpptIdx) }}>
                Filtrando MPPT {inverter.mpptConfigs[highlightMpptIdx]?.mpptId}
              </span>
            </div>
          )}
        </>
      )}

      {/* A: Electrical path breadcrumb — below MPPT filter strip */}
      {breadcrumb.length > 0 && (
        <div className={`absolute z-20 left-3 right-4 flex items-center gap-1 transition-all duration-300 ${inverter.mpptConfigs.length > 1 ? 'top-20' : 'top-11'}`}>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 border border-slate-800 backdrop-blur-sm max-w-full overflow-hidden">
            <span className="text-[6.5px] text-slate-700 font-mono uppercase tracking-widest shrink-0">▶</span>
            <span className="text-[6.5px] text-slate-500 font-mono truncate">{breadcrumb[0]}</span>
          </div>
        </div>
      )}

      {/* B5: System summary chip — always visible at top-right */}
      <div className={`absolute top-3 z-20 flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 transition-all duration-300 ${selectedNode ? 'right-[276px]' : 'right-4'}`}>
        {systemSummary.totalKwp > 0 && (
          <span className="text-[8px] font-mono font-black text-emerald-400 tabular-nums">
            {/* SWEEP14-AREA1 fix: show currentPowerKwp when irradiance differs from STC (1000), hide at very low irradiance (< 50) */}
            {irradiance >= 50 && irradiance !== 1000
              ? `${systemSummary.currentPowerKwp.toFixed(2)} kWp ☀`
              : irradiance >= 50
              ? `${systemSummary.totalKwp.toFixed(2)} kWp`
              : '0.00 kWp (noturno)'}
          </span>
        )}
        <span className="text-[7px] text-slate-600 font-mono uppercase tracking-wide">
          {systemSummary.totalStrings} str · {systemSummary.mpptCount} MPPT{systemSummary.mpptCount !== 1 ? 's' : ''}
        </span>
        {/* D: Compliance score */}
        <button
          onClick={() => setShowChecklist(v => !v)}
          title="Painel de conformidade ABNT/IEC (C)"
          className={`text-[7px] font-mono font-bold tabular-nums px-1 py-0.5 border transition-colors ${
            complianceScore === 100
              ? 'border-emerald-800/40 text-emerald-500 bg-emerald-950/30'
              : complianceScore >= 80
              ? 'border-amber-800/40 text-amber-500 bg-amber-950/20'
              : 'border-red-800/40 text-red-500 bg-red-950/20'
          }`}
        >
          {complianceScore}%
        </button>
        {layout.markers.length > 0 && (
          <span className="text-[7px] font-mono font-bold"
            style={{ color: layout.markers.some(m => m.severity === 'error') ? '#ef4444' : '#f59e0b' }}>
            {layout.markers.some(m => m.severity === 'error') ? '✕' : '⚠'} {layout.markers.length}
          </span>
        )}
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        width="100%" height="100%"
        viewBox={`${pan.x} ${pan.y} ${vbW} ${vbH}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
      >
        <defs>
          <SymbolCatalogDefs />
          {/* Arrowhead marker — context-stroke inherits wire color */}
          <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 0,7 7,3.5" fill="context-stroke" />
          </marker>
          {/* Glow filter for inverter */}
          <filter id="inverter-glow-svg">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {/* Flow animation for active wires */}
          <style>{`
            @keyframes schematic-flow { to { stroke-dashoffset: -15; } }
            @media print {
              .unifilar-print-mode { background: #fff !important; }
              .unifilar-print-mode path, .unifilar-print-mode line, .unifilar-print-mode polyline { stroke: #000 !important; }
              .unifilar-print-mode text { fill: #000 !important; }
              .unifilar-print-mode rect[fill="#020617"] { fill: #fff !important; }
            }
          `}</style>
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

        {/* C: Voltage gradient defs — one linear gradient per MPPT */}
        {inverter.mpptConfigs.map((mppt, idx) => {
          const m = mpptMetrics[mppt.mpptId];
          if (!m?.vocFrio || m.vocFrio <= 0) return null;
          const vMax = m.vocFrio;
          // Green (ok) → amber (mid) → red (near max)
          const t = Math.min(1, vMax / 1000); // rough 0–1
          return (
            <defs key={`grad-${mppt.mpptId}`}>
              <linearGradient id={`volt-grad-${mppt.mpptId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={getMpptColor(idx)} stopOpacity={0.9} />
                <stop offset={`${Math.round(t * 60)}%`} stopColor="#f59e0b" stopOpacity={0.85} />
                <stop offset="100%" stopColor={t > 0.85 ? '#ef4444' : getMpptColor(idx)} stopOpacity={0.8} />
              </linearGradient>
            </defs>
          );
        })}

        {/* Layer 1: Wires */}
        {layout.wires.map(wire => {
          // SWEEP10-AREA5 fix: hide wires connected to collapsed nodes
          const isConnectedToCollapsedNode = wire.nodeIds.some(nid => collapsedNodeIds.has(nid));
          if (isConnectedToCollapsedNode) return null;
          return (
            <SchematicWireRenderer
              key={wire.id} wire={wire}
              isActive={activeWireIds.has(wire.id) || selectedPathWireIds.has(wire.id)}
              dimmed={filteredWireIds !== null && !filteredWireIds.has(wire.id) && wire.mpptIdx !== -1}
            />
          );
        })}

        {/* Layer 2: Nodes */}
        {layout.nodes.map(node => {
          const isHov = hoveredNodeId === node.id;
          const isSel = selectedNodeId === node.id;
          // C: collapse hides pv-string nodes for collapsed MPPTs
          if (collapsedNodeIds.has(node.id)) return null;
          const isDimmedByFilter = filteredNodeIds !== null
            && !filteredNodeIds.has(node.id)
            && node.id !== 'earth-symbol'
            && !ALWAYS_VISIBLE_NODE_IDS.has(node.id);
          // C: search dims non-matching nodes
          const isDimmedBySearch = searchFilteredNodeIds !== null && !searchFilteredNodeIds.has(node.id);
          const isDimmed = isDimmedByFilter || isDimmedBySearch;

          const el = (() => {
            if (node.type === 'pv-string') {
              // BUG #2 fix: apply stringLabelOverrides to node.data.string.name
              const d = node.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
              const overrideName = stringLabelOverrides[node.id];
              const displayNode = overrideName
                ? { ...node, data: { ...node.data, string: { ...d.string, name: overrideName } } }
                : node;
              return (
                <g key={node.id}
                  onDoubleClick={() => {
                    // B: Double-click → open inline editor
                    const origValue = overrideName || d.string?.name || '';
                    setEditingNodeId(node.id);
                    setEditingValue(origValue);
                    editingOriginalValue.current = origValue;
                  }}>
                  <PVStringSymbol node={displayNode}
                    isHovered={isHov} isSelected={isSel}
                    onHover={handleNodeHover} onSelect={handleNodeSelect} />
                </g>
              );
            }
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
          const hasError = errorNodeIds.has(node.id);
          // A: Inverter — overlay string count badge
          const stringBadge = node.type === 'inverter' ? (
            <g key={`${node.id}-badge`} style={{ pointerEvents: 'none' }}>
              <rect x={node.x + node.w - 26} y={node.y - 12} width={24} height={11} rx={1}
                fill="#0f172a" stroke="#4f46e5" strokeWidth={0.7} />
              <text x={node.x + node.w - 14} y={node.y - 6}
                textAnchor="middle" dominantBaseline="middle"
                fill="#818cf8" fontSize={6.5} fontFamily="monospace" fontWeight="bold">
                {systemSummary.totalStrings} str
              </text>
            </g>
          ) : null;
          const content = (
            <g key={node.id}>
              {/* A: Pulsing error halo */}
              {hasError && (
                <rect x={node.x - 4} y={node.y - 4} width={node.w + 8} height={node.h + 8}
                  fill="none" stroke="#ef4444" strokeWidth={1.5}
                  opacity={0.6} className="animate-pulse" style={{ pointerEvents: 'none' }} />
              )}
              {el}
              {stringBadge}
            </g>
          );
          return isDimmed
            ? <g key={node.id} opacity={0.08} style={{ transition: 'opacity 0.15s' }}>{content}</g>
            : content;
        })}

        {/* Layer 2.5: Junction dots */}
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
        <LabelLayer labels={layout.labels} showElectrical={showLabels} zoom={zoom} />

        {/* Layer 4: Validation markers */}
        {layout.markers.map(marker => {
          const isDimmed = filteredMarkerIds !== null && !filteredMarkerIds.has(marker.id);
          return isDimmed ? null : (
            <ValidationMarker key={marker.id} marker={marker} onSelect={handleMarkerSelect} />
          );
        })}

        {/* C: DC cable section labels — shown when showLabels is true and cable data is available */}
        {showLabels && conductorTable.map(row => {
          if (!row.section || row.section <= 0) return null;
          // BUG-03 fix: Match pv-string node by string.id from node data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pvNode = layout.nodes.find(n => {
            if (n.type !== 'pv-string') return false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodeData = n.data as any;
            return nodeData.string?.id === row.id;
          });
          if (!pvNode || collapsedNodeIds.has(pvNode.id)) return null;
          const isDimmed = (filteredNodeIds !== null && !filteredNodeIds.has(pvNode.id))
            || (searchFilteredNodeIds !== null && !searchFilteredNodeIds.has(pvNode.id));
          return (
            <g key={`cbl-${row.id}`} style={{ pointerEvents: 'none' }} opacity={isDimmed ? 0.08 : 1}>
              <rect x={pvNode.x + pvNode.w + 2} y={pvNode.y + pvNode.h / 2 - 6} width={row.isUnderSized ? 28 : 22} height={10} rx={1}
                fill="#0f172a" stroke={row.isUnderSized ? '#f59e0b' : '#1e293b'} strokeWidth={0.5} />
              <text x={pvNode.x + pvNode.w + 4} y={pvNode.y + pvNode.h / 2}
                dominantBaseline="middle" fill={row.isUnderSized ? '#fbbf24' : row.color}
                fontSize={5.5} fontFamily="monospace">
                {row.section}mm²{row.isUnderSized ? '⚠' : ''}
              </text>
            </g>
          );
        })}

        {/* B: Ruler overlay */}
        {rulerMode && rulerStart && rulerEnd && (() => {
          const dx = rulerEnd.x - rulerStart.x;
          const dy = rulerEnd.y - rulerStart.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const midX = (rulerStart.x + rulerEnd.x) / 2;
          const midY = (rulerStart.y + rulerEnd.y) / 2;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={rulerStart.x} y1={rulerStart.y} x2={rulerEnd.x} y2={rulerEnd.y}
                stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.9} />
              <circle cx={rulerStart.x} cy={rulerStart.y} r={3} fill="#f59e0b" />
              <circle cx={rulerEnd.x} cy={rulerEnd.y} r={3} fill="#f59e0b" />
              <rect x={midX - 22} y={midY - 9} width={44} height={13} fill="#020617" stroke="#f59e0b" strokeWidth={0.7} />
              <text x={midX} y={midY - 2} textAnchor="middle" dominantBaseline="middle"
                fill="#fbbf24" fontSize={7} fontFamily="monospace" fontWeight="bold">
                {dist.toFixed(0)} u
              </text>
            </g>
          );
        })()}

        {/* B: Ruler mode hint */}
        {rulerMode && !rulerStart && (
          <text x={pan.x + layout.viewBox.w / zoom / 2} y={pan.y + 20}
            textAnchor="middle" fill="#f59e0b" fontSize={9} fontFamily="monospace"
            style={{ pointerEvents: 'none' }}>
            Modo régua — clique e arraste para medir · Esc para sair
          </text>
        )}

        {/* B: Text annotations */}
        {annotations.map(ann => (
          <g key={ann.id} style={{ cursor: 'pointer' }}
            onClick={() => setAnnotations(prev => prev.filter(a => a.id !== ann.id))}>
            <rect x={ann.x - 2} y={ann.y - 9} width={ann.text.length * 5 + 8} height={13}
              fill="#0f172a" stroke="#64748b" strokeWidth={0.6} opacity={0.9} />
            <text x={ann.x + 2} y={ann.y - 2} dominantBaseline="middle"
              fill="#cbd5e1" fontSize={7} fontFamily="monospace">{escapeSvgText(ann.text)}</text>
          </g>
        ))}

        {/* C6: Node hover tooltip — SVG overlay with key contextual info */}
        {hoveredNodeId && hoveredNodeId !== selectedNodeId && (() => {
          const node = layout.nodes.find(n => n.id === hoveredNodeId);
          if (!node || node.type === 'earth-symbol') return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = node.data as any;
          const irrFactor = irradiance / 1000; // D: scale factor for simulation
          const lines: Array<{ text: string; sub: boolean }> = [];
          if (node.type === 'pv-string') {
            const m = mpptMetrics[d.mpptId];
            lines.push({ text: d.string?.name ?? 'STR', sub: false });
            if (d.string?.modulesCount > 0) lines.push({ text: `${d.string.modulesCount} mód. · ${d.fuseRef}`, sub: true });
            if (m?.vocFrio > 0) {
              // SWEEP7-AREA5 fix: only show Voc in tooltip if irradiance >= 200 (sparkline range)
              if (irradiance >= 200) {
                const voc = m.vocFrio * (irrFactor < 1 ? (1 + 0.04 * Math.log(irrFactor)) : 1); // simplified Voc(G)
                lines.push({ text: `Voc: ${voc.toFixed(0)} V ☀`, sub: true });
              }
            }
            if (m?.iscTotal > 0) {
              const isc = m.iscTotal * irrFactor;
              lines.push({ text: `Isc: ${isc.toFixed(2)} A${irrFactor < 1 ? ' ☀' : ''}`, sub: true });
            }
            if (m?.powerKwp > 0) lines.push({ text: `${(m.powerKwp * irrFactor).toFixed(2)} kWp${irrFactor < 1 ? ' ☀' : ''}`, sub: true });
          } else if (node.type === 'fuse') {
            lines.push({ text: d.refDesig ?? 'Fusível', sub: false });
            lines.push({ text: `gPV · MPPT ${d.mpptId}`, sub: true });
          } else if (node.type === 'bus-bar') {
            const m = mpptMetrics[d.mpptId];
            lines.push({ text: `Barramento CC — M${d.mpptId}`, sub: false });
            if (m?.vocFrio > 0) lines.push({ text: `Voc: ${m.vocFrio.toFixed(0)}V · Isc: ${m.iscTotal?.toFixed(1)}A`, sub: true });
          } else if (node.type === 'dps-tap') {
            lines.push({ text: `${d.refDesig} — DPS Tipo II`, sub: false });
            lines.push({ text: 'IEC 61643 · Clique para spec.', sub: true });
          } else if (node.type === 'dc-switch') {
            lines.push({ text: `${d.refDesig} — Secc. CC`, sub: false });
            lines.push({ text: 'NBR 16690 §5.4', sub: true });
          } else if (node.type === 'inverter') {
            const ci = d.catalogItem as InverterCatalogItem | undefined;
            lines.push({ text: ci?.model ?? d.inverter?.snapshot?.model ?? 'Inversor', sub: false });
            if (ci?.nominalPowerW) lines.push({ text: `${(ci.nominalPowerW / 1000).toFixed(1)} kW · ${d.mpptCount} MPPT`, sub: true });
          } else if (node.type === 'ac-breaker') {
            lines.push({ text: `${d.refDesig} — Disjuntor CA`, sub: false });
          } else if (node.type === 'meter') {
            lines.push({ text: `${d.refDesig} — Medidor kWh`, sub: false });
            lines.push({ text: 'Bidirecional · NT.020.EQTL', sub: true });
          } else if (node.type === 'grid') {
            lines.push({ text: `Rede ${d.phase === 'tri' ? 'Trifásica' : 'Monofásica'}`, sub: false });
          }
          if (lines.length === 0) return null;
          const TW = 136, LINE_H = 11, PAD = 5;
          const th = lines.length * LINE_H + PAD * 2;
          const accentColor: string = d.mpptColor ?? '#475569';
          // Position to the right of the node; y-centered on node
          const tx = node.x + node.w + 8;
          const ty = node.y + node.h / 2 - th / 2;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={TW} height={th}
                fill="#020617" stroke="#1e293b" strokeWidth={0.8} opacity={0.97} />
              {/* Color accent bar */}
              <line x1={tx} y1={ty} x2={tx} y2={ty + th} stroke={accentColor} strokeWidth={1.5} />
              {lines.map((line, i) => (
                <text key={i} x={tx + 7} y={ty + PAD + i * LINE_H + LINE_H / 2 - 1}
                  dominantBaseline="middle" fontFamily="monospace"
                  fill={line.sub ? '#64748b' : '#cbd5e1'}
                  fontSize={line.sub ? 6 : 7.5}
                  fontWeight={line.sub ? 'normal' : 'bold'}
                >{line.text}</text>
              ))}
            </g>
          );
        })()}

        {/* D: IEC technical stamp — bottom-right corner of diagram */}
        {(() => {
          const sw = 180, sh = 56;
          // BUG #7 fix: ensure viewBox is large enough before rendering stamp
          if (layout.viewBox.w < sw + 20 || layout.viewBox.h < sh + 20) return null;
          const sx = layout.viewBox.w - sw - 10;
          const sy = layout.viewBox.h - sh - 10;
          const modelName = (catalogItem?.model || inverter.snapshot?.model || '—');
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={sx} y={sy} width={sw} height={sh} fill="#020617" stroke="#1e293b" strokeWidth={0.8} />
              <line x1={sx} y1={sy + 15} x2={sx + sw} y2={sy + 15} stroke="#1e293b" strokeWidth={0.5} />
              <line x1={sx} y1={sy + 40} x2={sx + sw} y2={sy + 40} stroke="#1e293b" strokeWidth={0.4} />
              <text x={sx + 4} y={sy + 9} fill="#334155" fontSize={6} fontFamily="monospace">
                {exportMeta.projectName || 'Diagrama Unifilar FV'} — IEC 60617 / NBR 16690
              </text>
              <text x={sx + 4} y={sy + 23} fill="#64748b" fontSize={6.5} fontFamily="monospace" fontWeight="bold">{modelName}</text>
              <text x={sx + 4} y={sy + 32} fill="#475569" fontSize={5.5} fontFamily="monospace">
                {systemSummary.totalKwp.toFixed(2)} kWp · {systemSummary.totalStrings} strings · {systemSummary.mpptCount} MPPTs
              </text>
              <text x={sx + 4} y={sy + 47} fill="#334155" fontSize={5} fontFamily="monospace">
                {exportMeta.author ? `Autor: ${exportMeta.author}` : new Date().toLocaleDateString('pt-BR')}
                {' · '}{exportMeta.revision} — Kurupira v2
              </text>
            </g>
          );
        })()}

        {/* B: Double-click to inline-edit pv-string label */}
        {editingNodeId && (() => {
          const node = layout.nodes.find(n => n.id === editingNodeId);
          if (!node) return null;
          return (
            <foreignObject x={node.x - 2} y={node.y + node.h / 2 - 10} width={node.w + 4} height={20}
              style={{ overflow: 'visible' }}>
              <input
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                autoFocus
                type="text" value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                onKeyDown={e => {
                  // BUG #2 fix: persist edited value on Enter, cancel on Escape
                  if (e.key === 'Enter') {
                    if (editingValue.trim() && editingValue !== editingOriginalValue.current) {
                      setStringLabelOverrides(prev => ({ ...prev, [editingNodeId]: editingValue.trim() }));
                    }
                    setEditingNodeId(null);
                  }
                  if (e.key === 'Escape') {
                    // Cancel without saving — do not persist
                    setEditingNodeId(null);
                  }
                }}
                onBlur={() => {
                  // BUG #2 fix: persist edited value on blur only if changed
                  if (editingValue.trim() && editingValue !== editingOriginalValue.current) {
                    setStringLabelOverrides(prev => ({ ...prev, [editingNodeId]: editingValue.trim() }));
                  }
                  setEditingNodeId(null);
                }}
                style={{
                  width: '100%', height: '20px', background: '#0f172a',
                  border: '1px solid #6366f1', color: '#e2e8f0',
                  fontSize: '8px', fontFamily: 'monospace', padding: '1px 3px',
                  outline: 'none',
                }}
              />
            </foreignObject>
          );
        })()}

        {/* A: Comparison pin button — appears above selected pv-string node */}
        {selectedNodeId && (() => {
          const node = layout.nodes.find(n => n.id === selectedNodeId);
          if (!node || node.type !== 'pv-string') return null;
          const isPinned = compareNodeId === selectedNodeId;
          return (
            <g style={{ cursor: 'pointer' }}
              onClick={() => setCompareNodeId(prev => prev === selectedNodeId ? null : selectedNodeId)}
            >
              <title>{isPinned ? 'Desafixar comparação' : 'Comparar com outra string'}</title>
              <rect x={node.x + node.w + 5} y={node.y} width={17} height={13} rx={1}
                fill={isPinned ? '#312e81' : '#0f172a'}
                stroke={isPinned ? '#6366f1' : '#334155'} strokeWidth={0.7} />
              <text x={node.x + node.w + 13} y={node.y + 7} textAnchor="middle" dominantBaseline="middle"
                fill={isPinned ? '#818cf8' : '#475569'} fontSize={7} fontFamily="monospace">⟺</text>
            </g>
          );
        })()}

        {/* A: Node comparison overlay — shown when a pinned node and a selected node are both pv-strings */}
        {compareNodeId && selectedNodeId && compareNodeId !== selectedNodeId && (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nodeA = layout.nodes.find(n => n.id === compareNodeId);
          const nodeB = layout.nodes.find(n => n.id === selectedNodeId);
          if (!nodeA || !nodeB || nodeA.type !== 'pv-string' || nodeB.type !== 'pv-string') return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dA = nodeA.data as any; const dB = nodeB.data as any;
          const mA = mpptMetrics[dA.mpptId]; const mB = mpptMetrics[dB.mpptId];
          const irrF = irradiance / 1000;
          const rows: Array<{ label: string; a: string; b: string; highlight?: boolean }> = [
            { label: 'Nome', a: dA.string?.name ?? '—', b: dB.string?.name ?? '—' },
            { label: 'Módulos', a: String(dA.string?.modulesCount ?? '—'), b: String(dB.string?.modulesCount ?? '—'), highlight: dA.string?.modulesCount !== dB.string?.modulesCount },
            { label: 'Voc frio', a: mA?.vocFrio > 0 ? `${mA.vocFrio.toFixed(0)}V` : '—', b: mB?.vocFrio > 0 ? `${mB.vocFrio.toFixed(0)}V` : '—', highlight: mA?.vocFrio !== mB?.vocFrio },
            { label: 'Isc', a: mA?.iscTotal > 0 ? `${(mA.iscTotal * irrF).toFixed(2)}A` : '—', b: mB?.iscTotal > 0 ? `${(mB.iscTotal * irrF).toFixed(2)}A` : '—' },
            { label: 'Potência', a: mA?.powerKwp > 0 ? `${(mA.powerKwp * irrF).toFixed(2)} kWp` : '—', b: mB?.powerKwp > 0 ? `${(mB.powerKwp * irrF).toFixed(2)} kWp` : '—' },
            { label: 'Seção', a: dA.string?.cableSection > 0 ? `${dA.string.cableSection}mm²` : '—', b: dB.string?.cableSection > 0 ? `${dB.string.cableSection}mm²` : '—', highlight: dA.string?.cableSection !== dB.string?.cableSection },
            { label: 'Compr.', a: dA.string?.cableLength > 0 ? `${dA.string.cableLength}m` : '—', b: dB.string?.cableLength > 0 ? `${dB.string.cableLength}m` : '—' },
          ];
          const cw = 210, ch = rows.length * 13 + 28;
          // SWEEP6-FIX: use pan state (not panRef) for render-time positioning to avoid stale value during pan
          const cx = layout.viewBox.w / 2 - cw / 2;
          const cy = pan.y + 12;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={cx} y={cy} width={cw} height={ch} fill="#020617" stroke="#6366f1" strokeWidth={0.7} opacity={0.97} />
              <text x={cx + cw / 2} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
                fill="#818cf8" fontSize={6.5} fontFamily="monospace" fontWeight="bold">Comparação de Strings</text>
              <line x1={cx} y1={cy + 16} x2={cx + cw} y2={cy + 16} stroke="#1e293b" strokeWidth={0.5} />
              {/* Column headers */}
              <text x={cx + 48} y={cy + 23} textAnchor="middle" dominantBaseline="middle"
                fill={dA.mpptColor ?? '#475569'} fontSize={6} fontFamily="monospace" fontWeight="bold">
                {dA.string?.name ?? 'A'}
              </text>
              <text x={cx + 128} y={cy + 23} textAnchor="middle" dominantBaseline="middle"
                fill={dB.mpptColor ?? '#475569'} fontSize={6} fontFamily="monospace" fontWeight="bold">
                {dB.string?.name ?? 'B'}
              </text>
              {rows.map((row, i) => {
                const ry = cy + 30 + i * 13;
                const diff = row.highlight;
                return (
                  <g key={row.label}>
                    {diff && <rect x={cx + 1} y={ry - 5} width={cw - 2} height={11} fill="#7c3aed10" />}
                    <text x={cx + 6} y={ry} dominantBaseline="middle" fill="#475569" fontSize={5.5} fontFamily="monospace">{row.label}</text>
                    <text x={cx + 48} y={ry} textAnchor="middle" dominantBaseline="middle"
                      fill={diff ? '#f59e0b' : '#94a3b8'} fontSize={6} fontFamily="monospace">{row.a}</text>
                    <line x1={cx + 80} y1={ry} x2={cx + 98} y2={ry} stroke="#1e293b" strokeWidth={0.5} />
                    <text x={cx + 128} y={ry} textAnchor="middle" dominantBaseline="middle"
                      fill={diff ? '#f59e0b' : '#94a3b8'} fontSize={6} fontFamily="monospace">{row.b}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

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
        onExport={() => setShowExportMetaModal(true)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(v => !v)}
        panelOpen={selectedNode !== null && selectedNode.type !== 'earth-symbol'}
      />

      {/* D: Irradiance simulation slider — bottom-left */}
      <div className={`absolute bottom-14 left-3 z-20 flex flex-col gap-1 transition-all duration-300`}>
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/85 border border-slate-800 backdrop-blur-sm">
          <span className="text-[7px] font-mono text-slate-600 uppercase tracking-wider w-16 shrink-0">
            ☀ {irradiance} W/m²
          </span>
          <input
            type="range" min="0" max="1000" step="50" value={irradiance}
            onChange={e => setIrradiance(Number(e.target.value))}
            className="w-24 h-0.5 accent-amber-400"
            title="Simular irradiância solar"
          />
        </div>
        {irradiance < 1000 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/40 border border-amber-800/30">
            <span className="text-[6.5px] font-mono text-amber-600 uppercase tracking-wider">
              Sim. {Math.round(irradiance / 10)}% · Isc×{(irradiance / 1000).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* C: Print mode toggle + PNG export + new tools — in header area */}
      <div className={`absolute top-3 z-20 flex items-center gap-1 transition-all duration-300 ${selectedNode ? 'right-[316px]' : 'right-44'}`}>
        {/* A: Path highlight toggle */}
        <button onClick={() => setSelectedPathHighlight(v => !v)}
          title={`${selectedPathHighlight ? 'Desativar' : 'Ativar'} destaque de caminho elétrico (H)`}
          className={`w-7 h-7 border flex items-center justify-center transition-all text-[8px] font-mono ${
            selectedPathHighlight ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:text-white'
          }`}>↗</button>
        {/* C: Power bars toggle */}
        <button onClick={() => setShowPowerBars(v => !v)}
          title="Barras de potência por MPPT (P)"
          className={`w-7 h-7 border flex items-center justify-center transition-all ${
            showPowerBars ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:text-white'
          }`}>
          <FileText size={10} />
        </button>
        {/* D: Conductor table toggle */}
        <button onClick={() => setShowConductorTable(v => !v)}
          title="Tabela de condutores (T)"
          className={`w-7 h-7 border flex items-center justify-center transition-all ${
            showConductorTable ? 'bg-amber-950/40 border-amber-500/50 text-amber-400' : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:text-white'
          }`}>
          <Table2 size={10} />
        </button>
        <button
          onClick={handleExportPNG}
          title="Exportar PNG (alta resolução)"
          className="w-7 h-7 bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 transition-all text-[9px] font-mono"
        >
          PNG
        </button>
        <button
          onClick={() => setPrintMode(v => !v)}
          title={printMode ? 'Sair do modo impressão' : 'Modo impressão (fundo branco)'}
          className={`w-7 h-7 border flex items-center justify-center transition-all text-[9px] font-mono ${
            printMode
              ? 'bg-white border-slate-300 text-slate-800'
              : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
          }`}
        >
          ⎙
        </button>
      </div>

      {/* C: Shading simulation slider + per-MPPT power bars */}
      {showPowerBars && (
        <div className={`absolute bottom-14 z-20 flex flex-col gap-1 transition-all duration-300 ${selectedNode ? 'left-44' : 'left-3'}`}>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
            <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider shrink-0">☁ Sombra</span>
            <input type="range" min="0" max="100" step="5" value={shadingFactor}
              onChange={e => setShadingFactor(Number(e.target.value))}
              className="w-20 h-0.5 accent-sky-400" />
            <span className="text-[7px] font-mono text-sky-400 tabular-nums w-8">{shadingFactor}%</span>
          </div>
          {/* B: Irradiance sparkline — system power from 200 to 1000 W/m² */}
          {(() => {
            const G_LEVELS = [200, 400, 600, 800, 1000];
            // BUG #10 fix: account for MPPT filter — only sum active MPPT if filter is set
            const totalBaseKwp = inverter.mpptConfigs
              .filter((_, idx) => highlightMpptIdx === null || idx === highlightMpptIdx)
              .reduce((s, mppt) => s + (mpptMetrics[mppt.mpptId]?.powerKwp ?? 0), 0);
            if (totalBaseKwp <= 0) return null;
            const W = 120, H = 28;
            const powers = G_LEVELS.map(g => totalBaseKwp * (g / 1000));
            const maxP = Math.max(...powers, 0.01);
            const pts = powers.map((p, i) => {
              const x = (i / (powers.length - 1)) * W;
              const y = H - (p / maxP) * H * 0.85 - 2;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            // BUG-02 fix: dot should only show if irradiance is >= 200 (within sparkline range)
            const showDot = irradiance >= 200;
            const clampG = Math.max(200, Math.min(1000, irradiance));
            const dotX = ((clampG - 200) / 800) * W;
            const dotP = totalBaseKwp * (clampG / 1000);
            const dotY = H - (dotP / maxP) * H * 0.85 - 2;
            return (
              <div className="px-2 py-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[6.5px] font-mono text-slate-600 uppercase tracking-wider">P(G) — total sistema</span>
                  <span className="text-[6.5px] font-mono text-sky-400 tabular-nums">{(totalBaseKwp * (irradiance / 1000)).toFixed(2)} kWp</span>
                </div>
                <svg width={W} height={H} style={{ display: 'block' }}>
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map(t => (
                    <line key={t} x1={0} y1={H - t * H * 0.85 - 2} x2={W} y2={H - t * H * 0.85 - 2}
                      stroke="#1e293b" strokeWidth={0.5} />
                  ))}
                  <polyline points={pts} fill="none" stroke="#0ea5e9" strokeWidth={1.5} strokeLinejoin="round" />
                  {/* BUG-09 fix: Area fill with correct polygon format */}
                  <polygon points={`0,${H} ${pts} ${W},${H}`} fill="#0ea5e915" stroke="none" />
                  {/* Dot for current irradiance — only show if >= 200 */}
                  {showDot && <circle cx={dotX} cy={dotY} r={2.5} fill="#f59e0b" />}
                  {/* Axis labels */}
                  <text x={0} y={H - 1} fill="#334155" fontSize={4.5} fontFamily="monospace">0.2</text>
                  <text x={W - 8} y={H - 1} fill="#334155" fontSize={4.5} fontFamily="monospace">1.0</text>
                </svg>
              </div>
            );
          })()}

          <div className="px-2 py-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-1.5">
            <div className="text-[7px] text-slate-600 font-mono uppercase tracking-widest mb-1">Potência por MPPT</div>
            {inverter.mpptConfigs.map((mppt, idx) => {
              const m = mpptMetrics[mppt.mpptId];
              if (!m?.powerKwp) return null;
              const color = getMpptColor(idx);
              const shadedKwp = m.powerKwp * (shadingFactor / 100);
              const maxKwp = Math.max(...inverter.mpptConfigs.map(mp => mpptMetrics[mp.mpptId]?.powerKwp ?? 0));
              return (
                <div key={mppt.mpptId} className="flex items-center gap-2">
                  <span className="text-[7px] font-mono w-8 shrink-0 tabular-nums" style={{ color }}>M{mppt.mpptId}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all" style={{
                      width: `${maxKwp > 0 ? (shadedKwp / maxKwp) * 100 : 0}%`,
                      backgroundColor: color, opacity: 0.8,
                    }} />
                  </div>
                  <span className="text-[7px] font-mono text-slate-400 tabular-nums w-14 text-right">
                    {shadedKwp.toFixed(2)} kWp
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D: Conductor table panel */}
      {showConductorTable && (
        <div className={`absolute bottom-12 z-30 bg-slate-950 border border-slate-700 shadow-2xl max-h-56 overflow-y-auto transition-all duration-300 ${selectedNode ? 'left-44' : 'left-3'} right-4`}>
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest">Tabela de Condutores CC</span>
            <button onClick={() => setShowConductorTable(false)} className="text-slate-500 hover:text-white text-[9px] leading-none">✕</button>
          </div>
          <table className="w-full text-[7px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-2 py-1 text-slate-500 font-normal">String</th>
                <th className="text-right px-2 py-1 text-slate-500 font-normal">Seção (mm²)</th>
                <th className="text-right px-2 py-1 text-slate-500 font-normal">Compr. (m)</th>
                <th className="text-right px-2 py-1 text-slate-500 font-normal">Imp (A)</th>
                <th className="text-right px-2 py-1 text-slate-500 font-normal">ΔV (V)</th>
                <th className="text-right px-2 py-1 text-slate-500 font-normal">Seção min.</th>
                <th className="text-left px-2 py-1 text-slate-500 font-normal">Mód.</th>
              </tr>
            </thead>
            <tbody>
              {conductorTable.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-3 text-center text-slate-600">Nenhum condutor com dados de cabo configurados.</td>
                </tr>
              ) : conductorTable.map(row => (
                <tr key={row.id}
                  className={`border-b border-slate-900 hover:bg-slate-900/60 transition-colors ${row.isUnderSized ? 'bg-amber-950/20' : ''}`}>
                  <td className="px-2 py-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span className={row.isUnderSized ? 'text-amber-400' : 'text-slate-300'}>{row.name || `M${row.mpptId}-S${row.si + 1}`}</span>
                  </td>
                  <td className={`px-2 py-0.5 text-right tabular-nums ${row.isUnderSized ? 'text-amber-400' : 'text-slate-400'}`}>{row.section > 0 ? row.section : '—'}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums text-slate-400">{row.length > 0 ? row.length : '—'}</td>
                  <td className="px-2 py-0.5 text-right tabular-nums text-slate-400">{row.imp}</td>
                  <td className={`px-2 py-0.5 text-right tabular-nums ${
                    // SWEEP13-AREA2 fix: show "—" when vDrop is undefined (cableLength = 0 or imp = 0), not green
                    row.vDrop === undefined ? 'text-slate-600' :
                    row.vDropPercent !== undefined && row.vDropPercent > 2.0 ? 'text-red-400' :
                    row.vDropPercent !== undefined && row.vDropPercent > 1.0 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {row.vDrop ?? '—'}
                  </td>
                  <td className={`px-2 py-0.5 text-right tabular-nums ${row.isUnderSized ? 'text-amber-300 font-semibold' : 'text-slate-600'}`}>
                    {row.isUnderSized ? `${row.suggestedSection} ⚠` : '✓'}
                  </td>
                  <td className="px-2 py-0.5 text-slate-500">{row.modules}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {conductorTable.some(r => r.isUnderSized) && (
            <div className="px-3 py-1.5 border-t border-amber-900/40 bg-amber-950/20 text-[6.5px] font-mono text-amber-500">
              ⚠ {conductorTable.filter(r => r.isUnderSized).length} condutor(es) com seção abaixo do mínimo recomendado (NBR 16690 / critério ΔV ≤ 1%)
            </div>
          )}
        </div>
      )}

      {/* D: Export metadata modal */}
      {showExportMetaModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onClick={() => setShowExportMetaModal(false)}>
          <div className="bg-slate-950 border border-slate-700 p-4 w-72 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Exportar Diagrama</span>
              <button onClick={() => setShowExportMetaModal(false)} className="text-slate-600 hover:text-white text-xs">✕</button>
            </div>
            {[
              { label: 'Nome do Projeto', key: 'projectName' as const, placeholder: 'Ex: Usina Solar SP-01' },
              { label: 'Autor', key: 'author' as const, placeholder: 'Nome do responsável técnico' },
              { label: 'Revisão', key: 'revision' as const, placeholder: 'R0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="mb-2.5">
                <label className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">{label}</label>
                <input type="text"
                  value={exportMeta[key]}
                  onChange={e => setExportMeta(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full mt-0.5 px-2 py-1.5 bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-200 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-colors" />
              </div>
            ))}
            <div className="text-[7px] text-slate-600 font-mono mb-3">
              Estes dados serão incluídos no carimbo IEC do arquivo exportado.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowExportMetaModal(false); setTimeout(handleExportPNG, 100); }}
                className="flex-1 py-1.5 bg-indigo-900/40 border border-indigo-700/60 text-[8px] font-mono text-indigo-300 hover:bg-indigo-900/60 transition-colors">
                Exportar PNG
              </button>
              <button
                onClick={() => { setShowExportMetaModal(false); setTimeout(handleExport, 100); }}
                className="flex-1 py-1.5 bg-slate-900 border border-slate-700 text-[8px] font-mono text-slate-300 hover:bg-slate-800 transition-colors">
                Exportar SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-slate-800/60 bg-slate-950/90 backdrop-blur-sm shrink-0">
        {/* C7: Error tray — click any item to pan+zoom to that marker */}
        {layout.markers.length > 0 && (
          <div className="border-b border-slate-800/60 px-3 py-1 flex items-center gap-4 flex-wrap">
            <span className="text-[7px] text-slate-600 font-mono uppercase tracking-wider shrink-0">
              {layout.markers.some(m => m.severity === 'error')
                ? `${layout.markers.filter(m => m.severity === 'error').length} erro${layout.markers.filter(m => m.severity === 'error').length !== 1 ? 's' : ''}`
                : `${layout.markers.length} aviso${layout.markers.length !== 1 ? 's' : ''}`}
            </span>
            {layout.markers.map(marker => (
              <button
                key={marker.id}
                onClick={() => {
                  // SWEEP10-AREA7 fix: Extract MPPT ID from marker, find bus node, un-collapse if needed
                  const match = marker.id.match(/marker-mppt-(\d+)/);
                  if (match) {
                    const mpptId = parseInt(match[1]);
                    const busNodeId = `bus-${mpptId}`;
                    // Un-collapse the MPPT group if it's collapsed
                    setCollapsedMpptIds(prev => {
                      if (prev.has(mpptId)) {
                        const next = new Set(prev);
                        next.delete(mpptId);
                        return next;
                      }
                      return prev;
                    });
                    // Select the bus node (associated with this MPPT)
                    setSelectedNodeId(busNodeId);
                  } else {
                    // Fallback: select marker itself (for non-MPPT markers)
                    setSelectedNodeId(marker.id);
                  }
                  const targetZoom = 2.0;
                  const { w, h } = layout.viewBox;
                  setZoom(targetZoom);
                  setPan({ x: marker.x - (w / targetZoom) / 2, y: marker.y - (h / targetZoom) / 2 });
                }}
                className="flex items-center gap-1 text-[7px] font-mono transition-opacity hover:opacity-60"
                style={{ color: marker.severity === 'error' ? '#ef4444' : '#f59e0b' }}
                title={`Navegar para: ${marker.messages.join(' | ')}`}
              >
                <span>{marker.severity === 'error' ? '✕' : '⚠'}</span>
                <span className="max-w-[220px] truncate">{marker.messages[0]}</span>
              </button>
            ))}
            <span className="text-[6px] text-slate-800 font-mono ml-auto">J para próximo</span>
          </div>
        )}
        <div className="flex items-center">
          <button
            onClick={() => setLegendCollapsed(v => {
              const next = !v;
              localStorage.setItem('unifilar-legend-collapsed', String(next));
              return next;
            })}
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
                <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Condutor CA</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Terra (PE)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-amber-500/60" />
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">DPS ±PE</span>
              </div>
              {/* L3-I4: fusível gPV na legenda */}
              <div className="flex items-center gap-2">
                <svg width="16" height="9"><rect x="0" y="0" width="16" height="9" rx="1.5" fill="none" stroke="#64748b" strokeWidth="0.7" /><line x1="2" y1="4.5" x2="14" y2="4.5" stroke="#64748b" strokeWidth="0.7" strokeDasharray="2 1" /><circle cx="0" cy="4.5" r="1" fill="#64748b" /><circle cx="16" cy="4.5" r="1" fill="#64748b" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Fusível gPV</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="10"><circle cx="1" cy="5" r="1.5" fill="#64748b" /><line x1="1" y1="5" x2="6" y2="5" stroke="#64748b" strokeWidth="1" /><line x1="6" y1="5" x2="13" y2="2" stroke="#64748b" strokeWidth="1" /><circle cx="17" cy="5" r="1.5" fill="#64748b" /></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Secc. CC</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#64748b" strokeWidth="1" /><text x="7" y="8" textAnchor="middle" fill="#64748b" fontSize="4" fontFamily="monospace" fontWeight="bold">kWh</text></svg>
                <span className="text-[7.5px] text-slate-600 uppercase font-bold tracking-widest">Medidor</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-2 h-2 bg-red-500/70" />
                <span className="text-[7.5px] text-red-600 uppercase font-bold tracking-widest">Erro</span>
                <div className="w-2 h-2 bg-amber-500/70 ml-2" />
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
              <div className="ml-auto flex items-center gap-3">
                {irradiance < 1000 && (
                  <span className="text-[6.5px] font-mono uppercase tracking-wider text-amber-700 animate-pulse">
                    ☀ Simulação {irradiance} W/m²
                  </span>
                )}
                <span className="text-[6.5px] text-slate-800 font-mono uppercase tracking-[0.2em]">
                  IEC 60617 · IEC 61643 · NBR 16690:2019 · NT.020.EQTL
                </span>
              </div>
            </div>
          )}
          {legendCollapsed && (
            <span className="px-3 py-2 text-[7px] text-slate-700 font-mono uppercase tracking-widest">Legenda recolhida</span>
          )}
        </div>
      </div>

      {/* Node detail panels */}
      {/* SWEEP8-AREA5 fix: only show ONE detail panel at a time — prioritize validation marker over node */}
      {(() => {
        const marker = selectedNodeId ? layout.markers.find(m => m.id === selectedNodeId) : null;
        if (marker) {
          return <ValidationErrorPanel marker={marker} onClose={() => setSelectedNodeId(null)} />;
        }
        if (!selectedNode) return null;
        if (selectedNode.type === 'pv-string') return <StringDetailCard node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'inverter') return <InverterDetailPanel node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'fuse') return <FuseDetailCard node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'bus-bar') return <BusBarDetailCard node={selectedNode} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'dps-tap') return <DPSDetailCard node={selectedNode} mpptMetrics={mpptMetrics} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'ac-breaker') return <ACBreakerDetailCard node={selectedNode} onClose={() => setSelectedNodeId(null)} />;
        if (selectedNode.type === 'grid') return <GridDetailCard node={selectedNode} onClose={() => setSelectedNodeId(null)} />;
        return null;
      })()}

      {/* D: Compliance checklist panel */}
      {showChecklist && (
        <div className="absolute bottom-12 right-4 z-30 w-72 bg-slate-950 border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Conformidade ABNT / IEC</span>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold tabular-nums ${
                complianceScore === 100 ? 'text-emerald-400' : complianceScore >= 80 ? 'text-amber-400' : 'text-red-400'
              }`}>{complianceScore}%</span>
              <button onClick={() => setShowChecklist(false)} className="text-slate-600 hover:text-white text-xs">✕</button>
            </div>
          </div>
          <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
            {[
              { label: 'Voc strings ≤ Vmax inversor', ref: 'NBR 16690 §5.2', pass: !Object.values(validationErrors ?? {}).some(e => (e as any).errors?.some((err: string) => err.toLowerCase().includes('voc'))) },
              { label: 'Isc total ≤ Impp max MPPT', ref: 'IEC 62109 §7', pass: !Object.values(validationErrors ?? {}).some(e => (e as any).errors?.some((err: string) => err.toLowerCase().includes('isc'))) },
              { label: 'Nº strings dentro dos limites', ref: 'NBR 16690 §5.3', pass: !Object.values(validationErrors ?? {}).some(e => (e as any).errors?.length > 0) },
              { label: 'Fusível gPV por string CC', ref: 'NBR 16690 §5.6', pass: true },
              { label: 'DPS Tipo II em barramento CC', ref: 'IEC 61643-11', pass: true },
              { label: 'Seccionador CC por MPPT', ref: 'NBR 16690 §5.4', pass: true },
              { label: 'Disjuntor CA na saída', ref: 'NBR 5410', pass: true },
              { label: 'Medidor bidirecional', ref: 'NT.020.EQTL', pass: true },
              { label: 'Aterramento em todos os MPPT', ref: 'NBR 5419', pass: true },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <span className={`shrink-0 text-[9px] font-bold ${item.pass ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.pass ? '✓' : '✕'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-[8px] font-mono ${item.pass ? 'text-slate-400' : 'text-red-400'}`}>{item.label}</span>
                  <span className="text-[7px] text-slate-700 font-mono ml-2">{item.ref}</span>
                </div>
              </div>
            ))}
            {/* Inline correction suggestions */}
            {layout.markers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[7px] text-slate-600 font-mono uppercase tracking-widest">Sugestões de correção</span>
                {layout.markers.map(m => (
                  <div key={m.id} className="flex items-start gap-1.5 py-0.5">
                    <span className="text-[7px]" style={{ color: m.severity === 'error' ? '#ef4444' : '#f59e0b' }}>
                      {m.severity === 'error' ? '✕' : '⚠'}
                    </span>
                    <div>
                      <span className="text-[7px] font-mono text-slate-500">{m.messages[0]}</span>
                      <span className="block text-[6.5px] text-slate-700 font-mono mt-0.5">
                        → {m.severity === 'error' ? 'Rever configuração de strings no MPPT' : 'Verificar limites do inversor no datasheet'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
