/**
 * SymbolEditorCanvas — Editor Manual do Catálogo de Símbolos IEC
 *
 * Painel de edição geométrica dos <symbol> SVG usados no UnifilarSchematicCanvas.
 * Permite arrastar pontos de controle, editar atributos numéricos via inspector,
 * pré-visualizar com diferentes temas de CSS vars e copiar o JSX gerado.
 *
 * Acesso: CenterCanvas promoted panel ('symbol-editor')
 *
 * Módulos extraídos (H2):
 *   symbolEditorTypes.ts   — tipos puros
 *   symbolEditorLibrary.ts — useRemoteLibrary hook
 *   symbolEditorCatalog.ts — TOOLS, CATALOG, THEMES, THEME_LABELS
 *   symbolEditorUtils.ts   — funções utilitárias + gerador JSX
 *   symbolEditorParts.tsx  — RenderElem + ElementInspector
 */

import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
import {
  Copy, Check, Grid3X3, RotateCcw, Shapes,
  BookMarked, Undo2, Redo2, ZoomIn, ChevronsUp, ChevronsDown, Trash2,
} from 'lucide-react';
import { toSVGCoords } from '../../../../utils/svgCoords';

import type { SymElem, ThemeKey, DragState, DrawPhase, NewElemProps, ElemTag, PathAnchor } from './symbolEditorTypes';
import { useRemoteLibrary } from './symbolEditorLibrary';
import { TOOLS, CATALOG, THEMES, THEME_LABELS } from './symbolEditorCatalog';
import {
  deepClone, serializePts, getSymbolDefaults, removeElem, bringToFront, sendToBack,
  snap, computeInitVB, buildPathD, getHandles, updateElemInTree, findElem, updateAttr,
  generateJSX,
} from './symbolEditorUtils';
import { RenderElem, ElementInspector } from './symbolEditorParts';

export const SymbolEditorCanvas: React.FC = () => {
  // ── Symbol state ──────────────────────────────────────────────────────────
  const [selectedSymId, setSelectedSymId]   = useState('sym-pv');
  const [elements, setElements]             = useState<SymElem[]>([]);
  const [origElements, setOrigElements]     = useState<SymElem[]>([]);
  const [selectedElemId, setSelectedElemId] = useState<string | null>(null);

  // ── Canvas / tools ────────────────────────────────────────────────────────
  const [theme, setTheme]               = useState<ThemeKey>('default');
  const [showGrid, setShowGrid]         = useState(true);
  const [dragState, setDragState]       = useState<DragState | null>(null);
  const [activeTool, setActiveTool]     = useState(TOOLS[0].mode);
  const [drawPhase, setDrawPhase]       = useState<DrawPhase | null>(null);
  const [newElemProps, setNewElemProps] = useState<NewElemProps>({ sw: 1 });
  const [textVal, setTextVal]           = useState('');

  // ── Code panel ────────────────────────────────────────────────────────────
  const [codeMode, setCodeMode] = useState<'jsx' | 'svg'>('jsx');
  const [copied, setCopied]     = useState(false);
  const [isDirty, setIsDirty]   = useState(false);

  // ── Biblioteca ────────────────────────────────────────────────────────────
  const library                         = useRemoteLibrary();
  const [sidebarTab, setSidebarTab]     = useState<'catalog' | 'library'>('catalog');
  const [saveDialog, setSaveDialog]     = useState(false);
  const [saveName, setSaveName]         = useState('');

  // ── Zoom / Pan ────────────────────────────────────────────────────────────
  const [vbState, setVbState]   = useState(() => computeInitVB(CATALOG[0]));
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const svgRef          = useRef<SVGSVGElement>(null);
  const idCounterRef    = useRef(0);
  const lastClickRef    = useRef(0);
  // ── Undo / Redo ──────────────────────────────────────────────────────────
  const undoStackRef    = useRef<SymElem[][]>([]);
  const redoStackRef    = useRef<SymElem[][]>([]);
  const dragSnapshotRef = useRef<SymElem[] | null>(null);
  const elementsRef     = useRef<SymElem[]>([]);
  const [historySize, setHistorySize] = useState({ undo: 0, redo: 0 });
  // ── Pan / Zoom refs ───────────────────────────────────────────────────────
  const vbStateRef       = useRef(computeInitVB(CATALOG[0]));
  const spaceDownRef     = useRef(false);
  const panRef           = useRef<{ startClient: {x:number;y:number}; startVB: {x:number;y:number;w:number;h:number}; moved: boolean } | null>(null);
  const panMovedRef      = useRef(false);
  // ── PATH tool refs ────────────────────────────────────────────────────────
  const pathDragRef      = useRef<{ startClient: {x:number;y:number}; startSVG: {x:number;y:number} } | null>(null);
  const pathDragMovedRef = useRef(false);

  const nextId = (tag: ElemTag) => `${tag}-${++idCounterRef.current}`;

  const sym         = useMemo(() => CATALOG.find(s => s.id === selectedSymId)!, [selectedSymId]);
  const symDefaults = useMemo(() => getSymbolDefaults(sym), [sym]);
  const themeVars   = useMemo(() => ({ ...symDefaults, ...THEMES[theme] }), [symDefaults, theme]);
  const symDefaultsMap = useMemo(
    () => Object.fromEntries(CATALOG.map(s => [s.id, getSymbolDefaults(s)])) as Record<string, Record<string, string>>,
    [],
  );

  const PAD    = Math.max(sym.vbW, sym.vbH) * 0.25;
  const editVB = `${vbState.x} ${vbState.y} ${vbState.w} ${vbState.h}`;

  // ── Load elements on symbol change ────────────────────────────────────────
  useEffect(() => {
    const fresh = deepClone(sym.elements);
    setElements(fresh);
    setOrigElements(deepClone(fresh));
    setSelectedElemId(null);
    setIsDirty(false);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistorySize({ undo: 0, redo: 0 });
    const initVB = computeInitVB(sym);
    setVbState(initVB);
    vbStateRef.current = initVB;
  }, [sym]);

  useEffect(() => { vbStateRef.current = vbState; }, [vbState]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  const resetVB = useCallback(() => setVbState(computeInitVB(sym)), [sym]);

  // ── Space key: ativa cursor de pan ────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        spaceDownRef.current = true;
        setSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') { spaceDownRef.current = false; setSpaceDown(false); }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Sync newElemProps defaults when symbol changes ────────────────────────
  useEffect(() => {
    const strokeVar = sym.cssVars.find(v => v.name === '--s');
    const swVar     = sym.cssVars.find(v => v.name === '--sw');
    setNewElemProps({
      varStroke: strokeVar ? `var(${strokeVar.name},${strokeVar.default})` : undefined,
      sw: swVar ? parseFloat(swVar.default) : 1,
    });
  }, [sym]);

  // ── Reset draw state on tool change ──────────────────────────────────────
  useEffect(() => {
    setDrawPhase(null);
    setTextVal('');
    lastClickRef.current = 0;
  }, [activeTool]);

  // ── Handles (SELECT mode only) ────────────────────────────────────────────
  const handles = useMemo(() => {
    if (activeTool !== 'SELECT' || !selectedElemId) return [];
    const el = findElem(elements, selectedElemId);
    return el ? getHandles(el) : [];
  }, [activeTool, selectedElemId, elements]);

  const selectedElem = useMemo(
    () => selectedElemId ? findElem(elements, selectedElemId) : null,
    [selectedElemId, elements],
  );

  // ── Histórico (Undo / Redo) ───────────────────────────────────────────────
  const pushHistory = useCallback((snapshot: SymElem[]) => {
    undoStackRef.current = [...undoStackRef.current, deepClone(snapshot)].slice(-50);
    redoStackRef.current = [];
    setHistorySize({ undo: undoStackRef.current.length, redo: 0 });
  }, []);

  const undo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    redoStackRef.current = [...redoStackRef.current, deepClone(elementsRef.current)];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setElements(deepClone(prev));
    setSelectedElemId(null);
    setIsDirty(true);
    setHistorySize({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }, []);

  const redo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    undoStackRef.current = [...undoStackRef.current, deepClone(elementsRef.current)];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setElements(deepClone(next));
    setSelectedElemId(null);
    setIsDirty(true);
    setHistorySize({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }, []);

  // ── Keyboard shortcuts: Delete, Ctrl+Z, Ctrl+Y, Ctrl+0, Escape ──────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); redo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault(); resetVB(); return;
      }
      if (e.key === 'Escape') {
        setDrawPhase(null); setTextVal(''); return;
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!selectedElemId) return;
      pushHistory(elementsRef.current);
      setElements(prev => removeElem(prev, selectedElemId));
      setSelectedElemId(null);
      setIsDirty(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedElemId, undo, redo, pushHistory, resetVB]);

  // ── Commit new element ────────────────────────────────────────────────────
  const commitElem = useCallback((el: SymElem) => {
    pushHistory(elementsRef.current);
    setElements(prev => [...prev, el]);
    setSelectedElemId(el.id);
    setDrawPhase(null);
    setTextVal('');
    setIsDirty(true);
  }, [pushHistory]);

  const makeBase = useCallback((): Partial<SymElem> => ({
    sw:  newElemProps.sw,
    scap: 'round',
    ...(newElemProps.varStroke ? { varStroke: newElemProps.varStroke } : {}),
    ...(newElemProps.varFill   ? { varFill:   newElemProps.varFill   } : {}),
  }), [newElemProps]);

  // ── Handle drag (SELECT mode) ─────────────────────────────────────────────
  const onHandleDown = useCallback((e: React.PointerEvent, handle: import('./symbolEditorTypes').Handle) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    dragSnapshotRef.current = deepClone(elementsRef.current);
    setDragState({ handle, startSVG: toSVGCoords(e, svg) });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, []);

  // ── Wheel zoom: listener nativo (não-passivo) para permitir preventDefault ─
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const mouse  = toSVGCoords(e, svg);
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setVbState(prev => ({
        x: mouse.x - (mouse.x - prev.x) * factor,
        y: mouse.y - (mouse.y - prev.y) * factor,
        w: prev.w * factor,
        h: prev.h * factor,
      }));
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, []);

  // ── SVG pointer-down: inicia pan (botão-do-meio ou Space+left) ou PATH drag
  const onSVGPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
      if (e.button === 1) e.preventDefault();
      panRef.current = {
        startClient: { x: e.clientX, y: e.clientY },
        startVB:     { ...vbStateRef.current },
        moved:       false,
      };
      svg.setPointerCapture(e.pointerId);
      setIsPanning(true);
      return;
    }

    if (activeTool === 'PATH' && e.button === 0) {
      const svgPos = toSVGCoords(e, svg);
      pathDragRef.current = {
        startClient: { x: e.clientX, y: e.clientY },
        startSVG:    { x: snap(svgPos.x), y: snap(svgPos.y) },
      };
    }
  }, [activeTool]);

  // ── Pointer move: handle drag + rubber-band cursor ────────────────────────
  const onSVGMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    if (panRef.current) {
      const pan      = panRef.current;
      const dxClient = e.clientX - pan.startClient.x;
      const dyClient = e.clientY - pan.startClient.y;
      if (Math.abs(dxClient) > 2 || Math.abs(dyClient) > 2) pan.moved = true;
      if (pan.moved) {
        const rect = svg.getBoundingClientRect();
        const dx   = (dxClient / rect.width)  * pan.startVB.w;
        const dy   = (dyClient / rect.height) * pan.startVB.h;
        setVbState({ ...pan.startVB, x: pan.startVB.x - dx, y: pan.startVB.y - dy });
      }
      return;
    }

    const pos = toSVGCoords(e, svg);

    if (dragState) {
      const dx = pos.x - dragState.startSVG.x;
      const dy = pos.y - dragState.startSVG.y;
      setElements(prev => updateElemInTree(prev, dragState.handle, dx, dy));
      setIsDirty(true);
    }

    if (activeTool === 'PATH' && pathDragRef.current) {
      const drag    = pathDragRef.current;
      const dClient = Math.hypot(e.clientX - drag.startClient.x, e.clientY - drag.startClient.y);
      if (dClient > 5) {
        const snapped = { x: snap(pos.x), y: snap(pos.y) };
        setDrawPhase(prev => prev
          ? { ...prev, pathDragHandle: snapped, cursor: snapped }
          : { tool: 'PATH', pathDragHandle: snapped, cursor: snapped },
        );
      }
      return;
    }

    if (activeTool !== 'SELECT') {
      setDrawPhase(prev => prev ? { ...prev, cursor: { x: snap(pos.x), y: snap(pos.y) } } : null);
    }
  }, [activeTool, dragState]);

  const onSVGUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current) {
      panMovedRef.current = panRef.current.moved;
      panRef.current = null;
      setIsPanning(false);
      return;
    }

    if (activeTool === 'PATH' && pathDragRef.current) {
      const drag    = pathDragRef.current;
      const svg     = svgRef.current;
      const dClient = Math.hypot(e.clientX - drag.startClient.x, e.clientY - drag.startClient.y);
      if (dClient > 5 && svg) {
        const curPos  = toSVGCoords(e, svg);
        const anchor: PathAnchor = {
          x:     drag.startSVG.x,
          y:     drag.startSVG.y,
          cpOut: [snap(curPos.x), snap(curPos.y)],
        };
        setDrawPhase(prev => ({
          tool:            'PATH',
          pathAnchors:     [...(prev?.pathAnchors ?? []), anchor],
          cursor:          drag.startSVG,
          pathDragHandle:  undefined,
        }));
        pathDragMovedRef.current = true;
      }
      pathDragRef.current = null;
      return;
    }

    if (dragState && dragSnapshotRef.current) {
      pushHistory(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
    setDragState(null);
  }, [activeTool, dragState, pushHistory]);

  // ── Canvas click → drawing logic ──────────────────────────────────────────
  const onSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (panMovedRef.current) { panMovedRef.current = false; return; }
    if (pathDragMovedRef.current) { pathDragMovedRef.current = false; return; }

    const svg = svgRef.current;
    if (!svg) return;
    if (activeTool === 'SELECT') {
      if (e.target === svg) setSelectedElemId(null);
      return;
    }
    const raw   = toSVGCoords(e, svg);
    const p     = { x: snap(raw.x), y: snap(raw.y) };
    const now   = Date.now();
    const isDbl = now - lastClickRef.current < 280;
    lastClickRef.current = now;

    switch (activeTool) {
      case 'LINE':
        if (!drawPhase?.p1) { setDrawPhase({ tool: 'LINE', p1: p, cursor: p }); }
        else {
          commitElem({ id: nextId('line'), tag: 'line',
            x1: drawPhase.p1.x, y1: drawPhase.p1.y, x2: p.x, y2: p.y, ...makeBase() });
        }
        break;

      case 'RECT':
        if (!drawPhase?.p1) { setDrawPhase({ tool: 'RECT', p1: p, cursor: p }); }
        else {
          const rX = snap(Math.min(drawPhase.p1.x, p.x)), rY = snap(Math.min(drawPhase.p1.y, p.y));
          const rW = snap(Math.abs(p.x - drawPhase.p1.x)), rH = snap(Math.abs(p.y - drawPhase.p1.y));
          if (rW > 0.5 && rH > 0.5)
            commitElem({ id: nextId('rect'), tag: 'rect', x: rX, y: rY, w: rW, h: rH, rx: 0, ...makeBase() });
          else setDrawPhase(null);
        }
        break;

      case 'CIRCLE':
        if (!drawPhase?.p1) { setDrawPhase({ tool: 'CIRCLE', p1: p, cursor: p }); }
        else {
          const dx = p.x - drawPhase.p1.x, dy = p.y - drawPhase.p1.y;
          const r  = snap(Math.sqrt(dx * dx + dy * dy));
          if (r > 0.5)
            commitElem({ id: nextId('circle'), tag: 'circle', cx: drawPhase.p1.x, cy: drawPhase.p1.y, r, ...makeBase() });
          else setDrawPhase(null);
        }
        break;

      case 'POLYLINE':
      case 'POLYGON':
        if (isDbl) {
          const trimmed = (drawPhase?.pts ?? []).slice(0, -1);
          if (trimmed.length >= 2) {
            const tag = activeTool === 'POLYGON' ? 'polygon' : 'polyline';
            commitElem({ id: nextId(tag as ElemTag), tag: tag as ElemTag, pts: trimmed, fill: 'none', ...makeBase() });
          } else { setDrawPhase(null); }
        } else {
          setDrawPhase(prev => ({
            tool: activeTool,
            p1:   prev?.p1 ?? p,
            pts:  [...(prev?.pts ?? []), [p.x, p.y] as [number, number]],
            cursor: p,
          }));
        }
        break;

      case 'TEXT':
        setDrawPhase({ tool: 'TEXT', p1: p, cursor: p });
        break;

      case 'PATH':
        if (isDbl) {
          const anchors = (drawPhase?.pathAnchors ?? []).slice(0, -1);
          if (anchors.length >= 2) {
            const dStr = buildPathD(anchors, undefined, false);
            commitElem({ id: nextId('path'), tag: 'path', d: dStr, fill: 'none', ...makeBase() });
          } else {
            setDrawPhase(null);
          }
        } else {
          setDrawPhase(prev => ({
            tool:        'PATH',
            pathAnchors: [...(prev?.pathAnchors ?? []), { x: p.x, y: p.y }],
            cursor:      p,
          }));
        }
        break;
    }
  }, [activeTool, drawPhase, commitElem, makeBase]);

  // ── Commit text element ───────────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!drawPhase?.p1 || !textVal.trim()) { setDrawPhase(null); setTextVal(''); return; }
    const strokeVar = sym.cssVars.find(v => v.name === '--s');
    const varFill   = strokeVar
      ? `var(${strokeVar.name},${strokeVar.default})`
      : undefined;
    commitElem({ id: nextId('text'), tag: 'text',
      x: drawPhase.p1.x, y: drawPhase.p1.y,
      text: textVal.trim(), fontSize: 6, fontWeight: 'normal',
      ...(varFill ? { varFill } : { fill: '#94a3b8' }),
    });
  }, [drawPhase, textVal, commitElem, sym]);

  // ── Inspector update ──────────────────────────────────────────────────────
  const onInspectorUpdate = useCallback((key: string, value: number) => {
    if (!selectedElemId) return;
    pushHistory(elementsRef.current);
    setElements(prev => updateAttr(prev, selectedElemId, key, value));
    setIsDirty(true);
  }, [selectedElemId, pushHistory]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const onReset = useCallback(() => {
    pushHistory(elementsRef.current);
    setElements(() => deepClone(origElements));
    setIsDirty(false);
  }, [origElements, pushHistory]);

  // ── Clipboard ─────────────────────────────────────────────────────────────
  const generatedCode = useMemo(() => generateJSX(sym, elements), [sym, elements]);
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  }, [generatedCode]);

  // ── Biblioteca: salvar / carregar ─────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    setSaveDialog(false);
    setSaveName('');
    library.save({
      name: saveName.trim(),
      symId: sym.id,
      vbW: sym.vbW,
      vbH: sym.vbH,
      elements: deepClone(elements),
    }).then(origin => {
      setSidebarTab('library');
      if (origin === 'local') {
        console.info('[SymbolEditor] Salvo localmente (sem sincronização remota).');
      }
    });
  }, [saveName, sym, elements, library]);

  const loadEntry = useCallback((entry: import('./symbolEditorTypes').LibraryEntry) => {
    if (!window.confirm(`Substituir elementos atuais por "${entry.name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setElements(deepClone(entry.elements));
    setSelectedElemId(null);
    setIsDirty(true);
    setSidebarTab('catalog');
  }, []);

  // ── Grid paths ────────────────────────────────────────────────────────────
  const gridPaths = useMemo(() => {
    const { vbW, vbH } = sym;
    const paths: string[] = [];
    for (let x = 0; x <= vbW; x++) paths.push(`M ${x} 0 V ${vbH}`);
    for (let y = 0; y <= vbH; y++) paths.push(`M 0 ${y} H ${vbW}`);
    return paths.join(' ');
  }, [sym]);

  const gridMajorPaths = useMemo(() => {
    const { vbW, vbH } = sym;
    const paths: string[] = [];
    for (let x = 0; x <= vbW; x += 5) paths.push(`M ${x} 0 V ${vbH}`);
    for (let y = 0; y <= vbH; y += 5) paths.push(`M 0 ${y} H ${vbW}`);
    return paths.join(' ');
  }, [sym]);

  // ── Rubber-band preview ───────────────────────────────────────────────────
  const rubberBand = useMemo(() => {
    const dp = drawPhase;
    if (!dp?.cursor) return null;
    const { p1, cursor, pts, tool } = dp;
    const rb = { stroke: '#6366f1', strokeDasharray: '1.5 0.5', fill: 'none' as const, opacity: 0.75 };

    if (tool === 'LINE' && p1) return (
      <line x1={p1.x} y1={p1.y} x2={cursor.x} y2={cursor.y}
        stroke={rb.stroke} strokeDasharray={rb.strokeDasharray}
        fill="none" opacity={rb.opacity} strokeWidth={newElemProps.sw} />
    );
    if (tool === 'RECT' && p1) {
      const x = Math.min(p1.x, cursor.x), y = Math.min(p1.y, cursor.y);
      return <rect x={x} y={y}
        width={Math.abs(cursor.x - p1.x)} height={Math.abs(cursor.y - p1.y)}
        stroke={rb.stroke} strokeDasharray={rb.strokeDasharray}
        fill="none" opacity={rb.opacity} strokeWidth={0.5} />;
    }
    if (tool === 'CIRCLE' && p1) {
      const dx = cursor.x - p1.x, dy = cursor.y - p1.y;
      return <>
        <circle cx={p1.x} cy={p1.y} r={Math.sqrt(dx * dx + dy * dy)}
          stroke={rb.stroke} strokeDasharray={rb.strokeDasharray}
          fill="none" opacity={rb.opacity} strokeWidth={0.5} />
        <circle cx={p1.x} cy={p1.y} r={PAD * 0.12} fill="#6366f1" opacity={0.8} />
      </>;
    }
    if ((tool === 'POLYLINE' || tool === 'POLYGON') && pts?.length) {
      const all  = [...pts, [cursor.x, cursor.y] as [number, number]];
      const pStr = serializePts(all);
      return tool === 'POLYLINE'
        ? <polyline points={pStr} stroke={rb.stroke} strokeDasharray={rb.strokeDasharray} fill="none" opacity={rb.opacity} strokeWidth={newElemProps.sw} />
        : <polygon  points={pStr} stroke={rb.stroke} strokeDasharray={rb.strokeDasharray} fill="none" opacity={rb.opacity} strokeWidth={0.5} />;
    }
    if (tool === 'TEXT' && p1) return (
      <circle cx={p1.x} cy={p1.y} r={PAD * 0.15} fill="#6366f1" opacity={0.8} />
    );
    if (tool === 'PATH') {
      const anchors = dp.pathAnchors ?? [];
      if (!anchors.length) {
        return cursor
          ? <circle cx={cursor.x} cy={cursor.y} r={PAD * 0.15} fill="#6366f1" opacity={0.6} />
          : null;
      }
      const d          = buildPathD(anchors, cursor ?? undefined);
      const dragHandle = dp.pathDragHandle;
      const last       = anchors[anchors.length - 1];
      return (
        <>
          <path d={d} stroke={rb.stroke} strokeDasharray={rb.strokeDasharray}
            fill="none" opacity={rb.opacity} strokeWidth={newElemProps.sw} />
          {anchors.map((a, i) => (
            <circle key={i} cx={a.x} cy={a.y} r={PAD * 0.1} fill="#6366f1" opacity={0.9} />
          ))}
          {dragHandle && <>
            <line x1={last.x} y1={last.y} x2={dragHandle.x} y2={dragHandle.y}
              stroke="#f59e0b" strokeDasharray="0.5 0.5" strokeWidth={0.5} opacity={0.8} />
            <circle cx={dragHandle.x} cy={dragHandle.y} r={PAD * 0.12} fill="#f59e0b" opacity={0.9} />
            <circle cx={2 * last.x - dragHandle.x} cy={2 * last.y - dragHandle.y}
              r={PAD * 0.1} fill="#f59e0b" opacity={0.55} />
          </>}
        </>
      );
    }
    return null;
  }, [drawPhase, newElemProps.sw, sym]);

  // ── Cursor style ──────────────────────────────────────────────────────────
  const canvasCursor = isPanning        ? 'grabbing'
    : spaceDown       ? 'grab'
    : dragState       ? 'grabbing'
    : activeTool === 'TEXT' ? 'text'
    : activeTool !== 'SELECT' ? 'crosshair'
    : 'default';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 select-none" style={{ fontFamily: 'monospace' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-9 border-b border-slate-800 shrink-0">
        <Shapes size={13} className="text-indigo-400" />
        <span className="text-[11px] font-bold text-slate-300 tracking-wide">Editor de Símbolos IEC</span>
        <span className="text-[9px] text-slate-600 ml-1">Catálogo do Unifilar</span>
        {isDirty && (
          <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-900/50 text-amber-400 border border-amber-800">
            MODIFICADO
          </span>
        )}
        {saveDialog ? (
          <div className="ml-auto flex items-center gap-1.5">
            <input
              autoFocus type="text" value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveDialog(false); }}
              placeholder="Nome do modelo…"
              className="w-40 bg-slate-900 border border-indigo-700 rounded px-2 py-0.5 text-[8px] text-slate-200 focus:outline-none"
            />
            <button onClick={handleSave}
              className="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-[8px] text-white transition-colors">
              Salvar
            </button>
            <button onClick={() => setSaveDialog(false)}
              className="p-0.5 text-slate-600 hover:text-slate-400 transition-colors text-[10px]">✕</button>
          </div>
        ) : (
          <button
            onClick={() => {
              setSaveName(`${sym.label} — ${new Date().toLocaleDateString('pt-BR')}`);
              setSaveDialog(true);
            }}
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500 text-[8px] text-slate-500 hover:text-indigo-400 transition-colors"
            title="Salvar versão atual na biblioteca">
            <BookMarked size={10} /><span>Salvar</span>
          </button>
        )}

        {/* Theme picker */}
        <div className="flex items-center gap-1">
          {(Object.keys(THEMES) as ThemeKey[]).map(tk => (
            <button key={tk}
              onClick={() => setTheme(tk)}
              className={`px-2 py-0.5 rounded text-[8px] font-mono border transition-colors ${
                theme === tk
                  ? 'bg-slate-700 border-slate-500 text-slate-200'
                  : 'border-transparent text-slate-600 hover:text-slate-400'
              }`}>
              {THEME_LABELS[tk]}
            </button>
          ))}
        </div>
        {/* Tool buttons */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setShowGrid(g => !g)}
            className={`p-1 rounded transition-colors ${showGrid ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Mostrar grade">
            <Grid3X3 size={13} />
          </button>
          <button onClick={resetVB}
            className="p-1 rounded text-slate-600 hover:text-sky-400 transition-colors"
            title="Reset zoom (Ctrl+0)">
            <ZoomIn size={13} />
          </button>
          <button onClick={onReset}
            disabled={!isDirty}
            className="p-1 rounded text-slate-600 hover:text-amber-400 disabled:opacity-30 transition-colors"
            title="Reverter alterações">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-36 shrink-0 border-r border-slate-800 flex flex-col">

          {/* Tab switcher */}
          <div className="flex border-b border-slate-800 shrink-0">
            <button onClick={() => setSidebarTab('catalog')}
              className={`flex-1 py-1.5 text-[7px] uppercase tracking-widest font-mono transition-colors border-b-2 ${
                sidebarTab === 'catalog'
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-slate-600 hover:text-slate-400 border-transparent'
              }`}>
              Catálogo
            </button>
            <button onClick={() => setSidebarTab('library')}
              className={`flex-1 py-1.5 text-[7px] uppercase tracking-widest font-mono transition-colors border-b-2 ${
                sidebarTab === 'library'
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-slate-600 hover:text-slate-400 border-transparent'
              }`}>
              Lib
              {library.entries.length > 0 && (
                <span className="ml-1 px-1 rounded bg-slate-700 text-slate-400 text-[6px]">
                  {library.entries.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Catálogo IEC ─────────────────────────────────────────────── */}
          {sidebarTab === 'catalog' && (
            <div className="flex-1 overflow-y-auto">
              {CATALOG.map(s => (
                <button key={s.id}
                  onClick={() => setSelectedSymId(s.id)}
                  className={`w-full flex flex-col items-center gap-1 p-2 border-b border-slate-900 transition-colors ${
                    s.id === selectedSymId
                      ? 'bg-slate-800 border-l-2 border-l-indigo-500'
                      : 'hover:bg-slate-900 border-l-2 border-l-transparent'
                  }`}>
                  <svg viewBox={`-2 -2 ${s.vbW + 4} ${s.vbH + 4}`}
                    width={80} height={Math.round(80 * (s.vbH + 4) / (s.vbW + 4))}
                    style={{ background: '#0f172a', borderRadius: 3 }}>
                    {s.elements.map(el => (
                      <RenderElem key={el.id} el={el}
                        themeVars={s.id === selectedSymId ? themeVars : symDefaultsMap[s.id]}
                        symDefaults={symDefaultsMap[s.id]}
                        selectedId={null} onSelect={() => {}} />
                    ))}
                  </svg>
                  <span className="text-[8px] text-center leading-tight"
                    style={{ color: s.id === selectedSymId ? '#a5b4fc' : '#64748b' }}>
                    {s.label}
                  </span>
                  <span className="text-[7px] text-slate-700">{s.id}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Biblioteca do usuário ────────────────────────────────────── */}
          {sidebarTab === 'library' && (
            <div className="flex-1 overflow-y-auto">
              {library.loading && (
                <div className="flex items-center justify-center gap-1.5 py-3">
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                  <span className="text-[8px] text-slate-600">Carregando…</span>
                </div>
              )}
              {library.error && !library.loading && (
                <div className="mx-2 mb-1 px-2 py-1 rounded bg-amber-950/40 border border-amber-900/50">
                  <span className="text-[7px] text-amber-600">Modo offline — exibindo cache local</span>
                </div>
              )}
              {!library.loading && library.entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center mt-4">
                  <BookMarked size={20} className="text-slate-700" />
                  <span className="text-[9px] text-slate-600">Nenhum modelo salvo</span>
                  <span className="text-[8px] text-slate-700 leading-relaxed">
                    Edite um símbolo e clique<br/>"Salvar" no cabeçalho
                  </span>
                </div>
              ) : (
                library.entries.map(entry => {
                  const defVars = symDefaultsMap[entry.symId] ?? {};
                  return (
                    <div key={entry.id}
                      className="flex flex-col items-center gap-1 p-2 border-b border-slate-900 group hover:bg-slate-900/50 transition-colors">
                      <svg viewBox={`-2 -2 ${entry.vbW + 4} ${entry.vbH + 4}`}
                        width={80} height={Math.round(80 * (entry.vbH + 4) / (entry.vbW + 4))}
                        style={{ background: '#0f172a', borderRadius: 3 }}>
                        {entry.elements.map(el => (
                          <RenderElem key={el.id} el={el}
                            themeVars={defVars} symDefaults={defVars}
                            selectedId={null} onSelect={() => {}} />
                        ))}
                      </svg>
                      <span className="text-[8px] text-slate-300 text-center leading-tight truncate w-full px-1">
                        {entry.name}
                      </span>
                      <span className="text-[7px] text-slate-700">
                        {entry.symId} · {new Date(entry.savedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <button onClick={() => loadEntry(entry)}
                          className="px-2 py-0.5 rounded text-[7px] bg-indigo-800 hover:bg-indigo-700 text-white transition-colors">
                          Carregar
                        </button>
                        <button onClick={() => library.remove(entry.id)}
                          className="px-1.5 py-0.5 rounded text-[7px] text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Remover da biblioteca">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Canvas principal ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Info bar */}
          <div className="flex items-center gap-3 px-3 h-7 border-b border-slate-800 shrink-0 text-[9px] text-slate-600">
            <span className="text-slate-400 font-bold">{sym.id}</span>
            <span>viewBox 0 0 {sym.vbW} {sym.vbH}</span>
            <span className="text-slate-700">|</span>
            <span>{sym.norm}</span>
            {selectedElemId && (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-indigo-400">✦ {selectedElemId}</span>
                <button onClick={() => setSelectedElemId(null)}
                  className="ml-1 text-slate-600 hover:text-slate-400">✕</button>
              </>
            )}
          </div>

          {/* SVG editing canvas */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-950">
            <svg
              ref={svgRef}
              viewBox={editVB}
              width="100%" height="100%"
              style={{ display: 'block', cursor: canvasCursor }}
              onPointerDown={onSVGPointerDown}
              onPointerMove={onSVGMove}
              onPointerUp={onSVGUp}
              onClick={onSVGClick}>

              {showGrid && (
                <>
                  <path d={gridPaths} stroke="#1e293b" strokeWidth={0.15} fill="none" />
                  <path d={gridMajorPaths} stroke="#334155" strokeWidth={0.2} fill="none" />
                </>
              )}

              <rect x={0} y={0} width={sym.vbW} height={sym.vbH}
                fill="none" stroke="#1e40af" strokeWidth={0.25} strokeDasharray="1 1" />

              <text x={sym.vbW / 2} y={-PAD * 0.4} textAnchor="middle" fill="#1e40af" fontSize={PAD * 0.35}
                fontFamily="monospace">{sym.vbW}</text>
              <text x={-PAD * 0.4} y={sym.vbH / 2} textAnchor="middle" fill="#1e40af" fontSize={PAD * 0.35}
                fontFamily="monospace" transform={`rotate(-90, ${-PAD * 0.4}, ${sym.vbH / 2})`}>{sym.vbH}</text>

              <g style={{ pointerEvents: activeTool === 'SELECT' ? 'auto' : 'none' }}>
                {elements.map(el => (
                  <RenderElem key={el.id} el={el}
                    themeVars={themeVars} symDefaults={symDefaults}
                    selectedId={selectedElemId} onSelect={setSelectedElemId} />
                ))}
              </g>

              {rubberBand}

              {handles.map(h => (
                <circle key={h.id}
                  cx={h.cx} cy={h.cy} r={PAD * 0.18}
                  fill="#6366f1" stroke="#a5b4fc" strokeWidth={0.3}
                  style={{ cursor: 'grab' }}
                  onPointerDown={e => onHandleDown(e, h)} />
              ))}

              {dragState && (
                <text x={dragState.handle.cx + PAD * 0.25} y={dragState.handle.cy - PAD * 0.2}
                  fill="#a5b4fc" fontSize={PAD * 0.32} fontFamily="monospace">
                  ({dragState.handle.cx.toFixed(1)}, {dragState.handle.cy.toFixed(1)})
                </text>
              )}
            </svg>
          </div>

          {/* ── Barra de ferramentas de desenho ──────────────────────────── */}
          <div className="border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-0.5 px-2 h-8 border-b border-slate-900">
              <span className="text-[7px] text-slate-700 uppercase tracking-widest mr-1.5 shrink-0">Ferr.</span>
              {TOOLS.map(t => (
                <button key={t.mode} onClick={() => setActiveTool(t.mode)} title={t.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono transition-colors border ${
                    activeTool === t.mode
                      ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border-transparent'
                  }`}>
                  <t.Icon size={10} /><span>{t.label}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-0.5">
                <button onClick={undo} disabled={historySize.undo === 0}
                  title="Desfazer (Ctrl+Z)"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono text-slate-600 hover:text-slate-300 hover:bg-slate-800 border border-transparent disabled:opacity-20 transition-colors">
                  <Undo2 size={10} />
                  {historySize.undo > 0 && <span className="text-[7px] text-slate-700">{historySize.undo}</span>}
                </button>
                <button onClick={redo} disabled={historySize.redo === 0}
                  title="Refazer (Ctrl+Y)"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono text-slate-600 hover:text-slate-300 hover:bg-slate-800 border border-transparent disabled:opacity-20 transition-colors">
                  <Redo2 size={10} />
                  {historySize.redo > 0 && <span className="text-[7px] text-slate-700">{historySize.redo}</span>}
                </button>
                <button
                  onClick={() => {
                    if (!selectedElemId) return;
                    pushHistory(elementsRef.current);
                    setElements(prev => bringToFront(prev, selectedElemId));
                    setIsDirty(true);
                  }}
                  disabled={!selectedElemId}
                  title="Trazer para frente (z-order)"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono text-slate-600 hover:text-sky-400 hover:bg-sky-950/30 border border-transparent disabled:opacity-20 transition-colors">
                  <ChevronsUp size={10} />
                </button>
                <button
                  onClick={() => {
                    if (!selectedElemId) return;
                    pushHistory(elementsRef.current);
                    setElements(prev => sendToBack(prev, selectedElemId));
                    setIsDirty(true);
                  }}
                  disabled={!selectedElemId}
                  title="Enviar para trás (z-order)"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono text-slate-600 hover:text-sky-400 hover:bg-sky-950/30 border border-transparent disabled:opacity-20 transition-colors">
                  <ChevronsDown size={10} />
                </button>
                <button onClick={() => {
                  if (!selectedElemId) return;
                  pushHistory(elementsRef.current);
                  setElements(prev => removeElem(prev, selectedElemId));
                  setSelectedElemId(null);
                  setIsDirty(true);
                }}
                  disabled={!selectedElemId}
                  title="Remover elemento (Del)"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono text-slate-600 hover:text-red-400 hover:bg-red-950/30 border border-transparent disabled:opacity-20 transition-colors">
                  <Trash2 size={10} /><span>Del</span>
                </button>
              </div>
            </div>

            {/* Context props strip */}
            <div className="flex items-center gap-2 px-2 h-7 text-[8px] font-mono text-slate-500 overflow-x-auto">
              {activeTool === 'SELECT' ? (
                <span className="text-slate-700 truncate">
                  {selectedElemId
                    ? `✦ ${selectedElemId} — arraste handles · inspector · Del para remover`
                    : 'Clique num elemento para selecionar'}
                </span>
              ) : (
                <>
                  <span className="text-slate-700 shrink-0">stroke</span>
                  <select value={newElemProps.varStroke ?? 'none'}
                    onChange={e => setNewElemProps(p => ({ ...p, varStroke: e.target.value === 'none' ? undefined : e.target.value }))}
                    className="bg-slate-900 border border-slate-700 rounded px-1 text-[8px] text-slate-300 focus:outline-none focus:border-indigo-500 shrink-0">
                    <option value="none">—</option>
                    {sym.cssVars.map(v => <option key={v.name} value={`var(${v.name},${v.default})`}>{v.name}</option>)}
                  </select>

                  <span className="text-slate-700 shrink-0">sw</span>
                  <input type="number" step="0.1" min="0.1" max="8" value={newElemProps.sw}
                    onChange={e => setNewElemProps(p => ({ ...p, sw: parseFloat(e.target.value) || 1 }))}
                    className="w-10 bg-slate-900 border border-slate-700 rounded px-1 text-[8px] text-slate-300 focus:outline-none focus:border-indigo-500 shrink-0" />

                  {(activeTool === 'RECT' || activeTool === 'CIRCLE') && <>
                    <span className="text-slate-700 shrink-0">fill</span>
                    <select value={newElemProps.varFill ?? 'none'}
                      onChange={e => setNewElemProps(p => ({ ...p, varFill: e.target.value === 'none' ? undefined : e.target.value }))}
                      className="bg-slate-900 border border-slate-700 rounded px-1 text-[8px] text-slate-300 focus:outline-none focus:border-indigo-500 shrink-0">
                      <option value="none">none</option>
                      {sym.cssVars.map(v => <option key={v.name} value={`var(${v.name},${v.default})`}>{v.name}</option>)}
                    </select>
                  </>}

                  {activeTool === 'TEXT' && drawPhase?.p1 && (
                    <>
                      <span className="text-slate-700 shrink-0 ml-1">texto</span>
                      <input autoFocus type="text" value={textVal}
                        onChange={e => setTextVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitText();
                          if (e.key === 'Escape') { setDrawPhase(null); setTextVal(''); }
                        }}
                        placeholder="Digite · Enter confirma · Esc cancela"
                        className="flex-1 min-w-0 bg-slate-900 border border-indigo-700 rounded px-2 text-[8px] text-slate-200 focus:outline-none" />
                      <button onClick={commitText}
                        className="px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-[8px] text-white shrink-0 transition-colors">
                        Add
                      </button>
                    </>
                  )}

                  {activeTool !== 'TEXT' && activeTool !== 'PATH' && (
                    <span className="ml-auto text-slate-700 shrink-0 text-right">
                      {(activeTool === 'POLYLINE' || activeTool === 'POLYGON') && drawPhase?.pts?.length
                        ? `${drawPhase.pts.length} pts — clique duplo para fechar`
                        : drawPhase?.p1
                        ? 'Clique para confirmar'
                        : 'Clique para ponto inicial'}
                    </span>
                  )}
                  {activeTool === 'PATH' && (
                    <span className="ml-auto text-slate-700 shrink-0 text-right">
                      {(drawPhase?.pathAnchors?.length ?? 0) >= 1
                        ? `${drawPhase!.pathAnchors!.length} âncoras — 2× clique para concluir · arrasto = Bézier`
                        : 'Clique = canto · Arrasto = Bézier · 2× para concluir'}
                    </span>
                  )}
                  {activeTool === 'TEXT' && !drawPhase?.p1 && (
                    <span className="ml-auto text-slate-700 shrink-0">Clique no canvas para posicionar</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Painel de código ─────────────────────────────────────────── */}
          <div className="border-t border-slate-800 shrink-0" style={{ height: 140 }}>
            <div className="flex items-center gap-2 px-3 h-7 border-b border-slate-800">
              <button onClick={() => setCodeMode('jsx')}
                className={`text-[8px] font-mono px-2 py-0.5 rounded transition-colors ${
                  codeMode === 'jsx' ? 'bg-slate-700 text-slate-200' : 'text-slate-600 hover:text-slate-400'
                }`}>JSX</button>
              <button onClick={() => setCodeMode('svg')}
                className={`text-[8px] font-mono px-2 py-0.5 rounded transition-colors ${
                  codeMode === 'svg' ? 'bg-slate-700 text-slate-200' : 'text-slate-600 hover:text-slate-400'
                }`}>SVG</button>
              <span className="text-[8px] text-slate-600 ml-1">
                {codeMode === 'jsx' ? 'Cole em SymbolCatalogDefs' : 'Cole no arquivo .svg do catálogo'}
              </span>
              <button onClick={onCopy}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500 text-[8px] text-slate-400 hover:text-indigo-400 transition-colors">
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className="h-[calc(140px-28px)] overflow-auto px-3 py-2 text-[9px] leading-relaxed text-slate-400"
              style={{ fontFamily: 'monospace', background: '#020617' }}>
              {generatedCode}
            </pre>
          </div>
        </div>

        {/* ── Inspector ──────────────────────────────────────────────────── */}
        <div className="w-44 shrink-0 border-l border-slate-800 overflow-hidden flex flex-col">
          <ElementInspector elem={selectedElem} onUpdate={onInspectorUpdate} />

          {/* CSS vars preview */}
          <div className="border-t border-slate-800 p-2 shrink-0">
            <span className="text-[8px] text-slate-600 uppercase tracking-widest">Vars ativas</span>
            <div className="mt-1 flex flex-col gap-0.5">
              {sym.cssVars.map(v => {
                const val = themeVars[v.name] ?? v.default;
                const isColor = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('rgba');
                return (
                  <div key={v.name} className="flex items-center gap-1.5">
                    {isColor && (
                      <div className="w-2 h-2 rounded-sm shrink-0 border border-slate-700"
                        style={{ background: val }} />
                    )}
                    <span className="text-[8px] font-mono text-amber-400 truncate flex-1">{v.name}</span>
                    <span className="text-[7px] font-mono text-slate-500 shrink-0 truncate" style={{ maxWidth: 60 }}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
