import React, { useState, useRef, useCallback, useEffect, useMemo, type FC, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { FileText, LayoutTemplate, Save, Layers, Grid3x3, Magnet, Target, PanelLeft, LayoutList, Files, RotateCcw, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, FileDown, History, FileImage, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportMediaDialog } from './proposal/engine/ImportMediaDialog';

import { ProposalDocumentPreview } from './proposal/ProposalDocumentPreview';
import { ProposalBlockedScreen } from './proposal/ProposalBlockedScreen';
import { ProposalTemplateGallery } from './proposal/ProposalTemplateGallery';
import { ElementPalette } from './proposal/engine/ElementPalette';
import { ElementPropertiesPanel } from './proposal/engine/ElementPropertiesPanel';
import { LayersPanel } from './proposal/engine/LayersPanel';
import { PagesThumbnailPanel } from './proposal/engine/PagesThumbnailPanel';
import { CanvasPage } from './proposal/engine/CanvasPage';
import { useAutosave } from './proposal/engine/useAutosave';
import { VersionHistoryPanel } from './proposal/engine/VersionHistoryPanel';
import { PageBackgroundPanel } from './proposal/engine/PageBackgroundPanel';
import { PageNavigatorBar } from './proposal/engine/PageNavigatorBar';
import { CLASSIC_TEMPLATE } from './proposal/engine/templates/classicTemplate';
import { TECHNICAL_PAGE_ELEMENTS } from './proposal/engine/templates/technicalPageDecomposed';
import type { CanvasElement, CanvasPage as CanvasPageType, GridConfig, CanvasElementType } from './proposal/engine/types';
import type { PdfPageResult } from './proposal/engine/ImportMediaDialog';
import { A4_WIDTH, A4_HEIGHT, DEFAULT_ELEMENT_PROPS, DEFAULT_GRID_CONFIG, parseBackgroundImageUrl } from './proposal/engine/types';

type CanvasPageSnapshot = CanvasPageType[];

type ViewMode = 'templates' | 'editor' | 'preview';

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0];
const MAX_HISTORY = 50;

// Static tab definitions — lives at module level to avoid reconstructing the array
// (and the three JSX icon elements inside it) on every render of ProposalCanvasView.
type TabDef = { id: ViewMode; label: string; icon: ReactNode };
const VIEW_TABS: TabDef[] = [
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={13} /> },
  { id: 'editor',    label: 'Editor',    icon: <Layers size={13} /> },
  { id: 'preview',   label: 'Prévia',    icon: <FileText size={13} /> },
];

// Shared style object for the hairline separators in the alignment toolbar.
// Extracted to module level so JSX doesn't allocate a new object on every render.
const ALIGN_SEP_STYLE: React.CSSProperties = {
  width: 1, height: 16, background: '#334155', margin: '0 2px',
};

function createImageElement(url: string, x: number, y: number, zIndex: number): CanvasElement {
  return {
    id:      `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type:    'image',
    x, y,
    width:   400,
    height:  400,
    zIndex,
    locked:  false,
    visible: true,
    props:   { url, objectFit: 'contain' },
  };
}

/**
 * Returns the target coordinate for a duplicated/pasted element on a single axis.
 *
 * Problem: when an element is flush against the canvas boundary (e.g. el.x ≈ A4_WIDTH − el.width),
 * `Math.min(el.x + offset, maxCoord)` resolves to `maxCoord = el.x` — the duplicate lands
 * exactly on top of the original, appearing invisible. Instead, wrap to the opposite edge (0).
 */
function nextPasteCoord(current: number, offset: number, dimension: number, canvasDim: number): number {
  const maxCoord = Math.max(0, canvasDim - dimension);
  const shifted  = current + offset;
  return shifted <= maxCoord ? shifted : 0;
}

function computeNextZoom(prev: number | null, fitScale: number, direction: 'in' | 'out'): number {
  const current = prev ?? fitScale;
  const idx = ZOOM_STEPS.findIndex((s) => s >= current);
  const newIdx = direction === 'in'
    ? Math.min(ZOOM_STEPS.length - 1, (idx < 0 ? ZOOM_STEPS.length - 1 : idx) + 1)
    : Math.max(0, (idx < 0 ? 0 : idx) - 1);
  return ZOOM_STEPS[newIdx] ?? current;
}

const DRAG_GHOST_META: Partial<Record<CanvasElementType, { label: string; icon: string }>> = {
  text:               { label: 'Texto',              icon: '𝐓' },
  image:              { label: 'Imagem',              icon: '🖼' },
  logo:               { label: 'Logo',               icon: '✦' },
  watermark:          { label: 'Marca d\'água',       icon: '⬡' },
  divider:            { label: 'Divisória',           icon: '—' },
  box:                { label: 'Caixa',               icon: '▭' },
  icon:               { label: 'Ícone',               icon: '★' },
  placeholder:        { label: 'Campo dinâmico',      icon: '{}' },
  'kpi-box':          { label: 'KPI',                 icon: '◈' },
  'chart-generation': { label: 'Gráfico Geração',     icon: '▦' },
  'chart-financial':  { label: 'Gráfico Financeiro',  icon: '▦' },
  'payment-table':    { label: 'Tabela Investimento', icon: '⊟' },
  'schedule-timeline':{ label: 'Cronograma',          icon: '⊞' },
  'map-static':       { label: 'Mapa',                icon: '⊙' },
};

const ELEMENT_DISPLAY_NAMES: Partial<Record<CanvasElementType, string>> = {
  text: 'Texto', image: 'Imagem', logo: 'Logotipo', watermark: 'Marca d\'água',
  divider: 'Divisória', box: 'Caixa', icon: 'Ícone', placeholder: 'Campo dinâmico',
  'kpi-box': 'KPI', 'chart-generation': 'Gráfico de Geração', 'chart-financial': 'Gráfico Financeiro',
  'payment-table': 'Tabela de Pagamento', 'schedule-timeline': 'Cronograma', 'map-static': 'Mapa',
  'page-technical': 'Página Técnica',
  'chart-gen-consumption': 'Geração vs Consumo', 'chart-roi': 'Retorno do Investimento',
  'chart-financial-balance': 'Balanço Financeiro', 'chart-daily': 'Geração Diária',
  'chart-credit-bank': 'Banco de Créditos', 'chart-loss-waterfall': 'Análise de Perdas',
  'kpi-projection': 'KPI de Projeção', 'table-analytics': 'Tabela Analítica',
  'section-header': 'Cabeçalho', 'kpi-capacity-badge': 'Badge de Capacidade',
  'guarantees-list': 'Lista de Garantias', 'equipment-panel': 'Painel de Equipamentos',
};

const PortraitIcon = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none">
    <rect x="0.5" y="0.5" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const LandscapeIcon = () => (
  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
    <rect x="0.5" y="0.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

function SaveTemplateDialog({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('Meu Template');
  const isValid = name.trim().length > 0;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      aria-describedby="save-template-desc"
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
      // Close on backdrop click — only fires when the overlay itself (not its children) is clicked.
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-80">
        <h3 id="save-template-title" className="text-sm font-semibold text-slate-100 mb-1">Salvar como template</h3>
        <p id="save-template-desc" className="text-xs text-slate-400 mb-4">Este layout ficará disponível na galeria de templates.</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) onSave(name.trim());
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Nome do template"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs transition-colors">Cancelar</button>
          <button
            type="button"
            onClick={() => { if (isValid) onSave(name.trim()); }}
            disabled={!isValid}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export const ProposalCanvasView: FC = () => {
  const projectStatus   = useSolarStore((s) => s.project.projectStatus);
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);

  const activeLayout    = useSolarStore((s) => s.proposalData.activeLayout);
  const excludedPages   = useSolarStore((s) => s.proposalData.excludedPages);

  // Action functions are created once at slice init — stable references, no subscription needed.
  const {
    addCanvasElement, batchAddCanvasElements, updateCanvasElement, updateCanvasPage,
    removeCanvasElement, batchRemoveCanvasElements, batchUpdateCanvasElements,
    addCanvasPage, batchAddCanvasPages, removeCanvasPage,
    saveCurrentAsTemplate, applyTemplate, setExportingPdf,
  } = useSolarStore.getState();

  const [viewMode, setViewMode]             = useState<ViewMode>('preview');
  const [canvasPageIdx, setCanvasPageIdx]   = useState(0);
  const [selectedIds, setSelectedIds]       = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [clipboard, setClipboard]           = useState<CanvasElement[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [gridConfig, setGridConfig]         = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [sidebarTab, setSidebarTab]         = useState<'elements' | 'layers' | 'pages'>('elements');
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showImportMedia, setShowImportMedia] = useState(false);
  // Pending-print flag: set true before switching to preview to auto-fire window.print()
  const pendingPrintRef = useRef(false);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<CanvasPageSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasPageSnapshot[]>([]);
  // Suppresses repeated history pushes during a continuous drag stroke
  const isMutatingRef = useRef(false);

  const updateGrid = useCallback((patch: Partial<GridConfig>) =>
    setGridConfig((prev) => ({ ...prev, ...patch })), []);

  const canvasAreaRef   = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const lastHistoryPushRef  = useRef<number>(0);
  const [fitScale, setFitScale]       = useState(0.6);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const canvasScale = manualScale ?? fitScale;
  // Shadow fitScale in a ref so the wheel listener always reads the latest value
  // without needing fitScale in its dependency array (avoids re-registration on every resize).
  // Direct assignment in the render body (same pattern as effectiveLayoutRef, canvasScaleRef, etc.)
  // is safe here because the wheel handler only fires after the current render has committed.
  const fitScaleRef = useRef(fitScale);
  fitScaleRef.current = fitScale;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Compute the effective layout and pages
  const effectiveLayout = activeLayout ?? CLASSIC_TEMPLATE;
  const pages           = effectiveLayout.pages;
  const safePageIdx     = Math.min(canvasPageIdx, pages.length - 1);
  const currentPage     = pages[safePageIdx] ?? null;

  // Autosave + version history
  const { saveVersion } = useAutosave(
    effectiveLayout,
    isDirty,
    (layout) => { applyTemplate(layout); setIsDirty(false); },
  );

  // Selected element object (single element).
  // Memoized: during drag this runs many times per second (every pointer-move triggers a
  // store update → re-render). Without useMemo the .find() runs on every frame.
  const selectedElement = useMemo(
    () => selectedIds.length === 1
      ? currentPage?.elements.find((el) => el.id === selectedIds[0]) ?? null
      : null,
    // Dep on currentPage.elements (not currentPage) so the memo doesn't recompute on
    // unrelated page-level changes (label, background) that replace the page object ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, currentPage?.elements],
  );

  // A group is selected only when ALL selected elements share the same groupId.
  // Memoized to avoid O(n) find() per render on drag frames.
  // Dep on currentPage.elements (not currentPage) so the memo doesn't recompute on
  // unrelated page-level changes (label, background) that replace the page object ref.
  const selectedGroupId = useMemo(() => {
    if (selectedIds.length < 2 || !currentPage) return null;
    const groupIds = selectedIds.map(
      (id) => currentPage.elements.find((e) => e.id === id)?.groupId ?? null,
    );
    const first = groupIds[0];
    return first && groupIds.every((g) => g === first) ? first : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, currentPage?.elements]);

  // Resize observer — keeps the "fit" scale in sync with the container
  useEffect(() => {
    if (!canvasAreaRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scaleW = (width - 64) / A4_WIDTH;
      const scaleH = (height - 80) / A4_HEIGHT;
      setFitScale(Math.min(scaleW, scaleH, 1));
    });
    obs.observe(canvasAreaRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Undo / Redo helpers ───────────────────────────────────────────────────

  // Shadows effectiveLayout so pushToHistory / handleUndo / handleRedo can always read the
  // current value without capturing it as a closure dep. Without this, pushToHistory would
  // get a new function reference on every drag-frame element update (because effectiveLayout
  // is a new object each time), cascading instability to every useCallback that lists it.
  const effectiveLayoutRef = useRef(effectiveLayout);
  effectiveLayoutRef.current = effectiveLayout;

  // Shadow undo/redo stacks so handleUndo/handleRedo can be stable callbacks.
  // Without these refs, both callbacks would get new refs on every push/pop, causing
  // the keydown useEffect to re-register the window listener on every undo/redo action.
  const undoStackRef = useRef(undoStack);
  undoStackRef.current = undoStack;
  const redoStackRef = useRef(redoStack);
  redoStackRef.current = redoStack;

  // Shadows selectedIds so group/ungroup handlers can read the current selection without
  // capturing selectedIds as a dep — prevents recreation on every click.
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  // Shadows currentPage so hot-path callbacks (handleUpdateElement, handleRemoveElement,
  // handleDropImage, handleDuplicateElement, handleImportConfirm) can read the current page
  // without listing it as a dep — prevents per-frame recreation during drag strokes.
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  // Shadow canvasScale + gridConfig so handleDragEnd can read them without adding
  // them to its dep array — prevents re-creation on every zoom or grid toggle.
  const canvasScaleRef = useRef(canvasScale);
  canvasScaleRef.current = canvasScale;
  const gridConfigRef = useRef(gridConfig);
  gridConfigRef.current = gridConfig;

  const pushToHistory = useCallback(() => {
    setUndoStack((prev) => {
      const next = [...prev, effectiveLayoutRef.current.pages];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []); // stable for component lifetime — reads effectiveLayout via ref

  const showToast = useCallback((message: string, duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const showDeleteToast = useCallback((count: number, lockedCount = 0) => {
    const lockedNote = lockedCount > 0
      ? ` • ${lockedCount} bloqueado${lockedCount !== 1 ? 's' : ''} mantido${lockedCount !== 1 ? 's' : ''}`
      : '';
    showToast(`${count} elemento${count !== 1 ? 's' : ''} excluído${count !== 1 ? 's' : ''} • Ctrl+Z para desfazer${lockedNote}`, 3500);
  }, [showToast]);

  // Clear pending toast timer on unmount to prevent setState on unmounted component.
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // Guard on isDirty only — not viewMode. The user can have unsaved edits while browsing
  // the Templates or Preview tabs; restricting to 'editor' would silently skip the warning.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setRedoStack((r) => [effectiveLayoutRef.current.pages, ...r.slice(0, 29)]);
    setUndoStack((s) => s.slice(0, -1));
    applyTemplate({ ...effectiveLayoutRef.current, pages: prev });
    // Undo changes the layout relative to the last saved snapshot — mark dirty so the
    // beforeunload guard and export warning remain active after undo/redo sequences.
    setIsDirty(true);
  // stable — reads undoStack via ref; applyTemplate is stable from getState().
  }, [applyTemplate]);

  const handleRedo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const next = stack[0];
    setUndoStack((s) => [...s.slice(-29), effectiveLayoutRef.current.pages]);
    setRedoStack((r) => r.slice(1));
    applyTemplate({ ...effectiveLayoutRef.current, pages: next });
    setIsDirty(true);
  // stable — reads redoStack via ref; applyTemplate is stable from getState().
  }, [applyTemplate]);

  // Keyboard shortcuts (Delete/Backspace = excluir seleção, Escape = desselecionar)
  useEffect(() => {
    if (viewMode !== 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;

      // Snapshot volatile values from refs/store at handler entry.
      // This removes currentPage, selectedIds, activeLayout, and pages.length from the
      // effect's dep array — they would otherwise cause the listener to re-register on
      // every drag frame (currentPage/activeLayout change reference on every element move).
      const page     = currentPageRef.current;
      const ids      = selectedIdsRef.current;
      const hasLayout = !!useSolarStore.getState().proposalData.activeLayout;
      const pagesLen  = useSolarStore.getState().proposalData.activeLayout?.pages.length
        ?? CLASSIC_TEMPLATE.pages.length;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return; }
      // Ctrl+S — open "Salvar como template" dialog (mirrors the toolbar button).
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); setShowSaveDialog(true); return; }

      // Ctrl+A — select all non-page-block visible elements
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const allIds = page?.elements
          .filter((el) => !el.type.startsWith('page-') && el.visible)
          .map((el) => el.id) ?? [];
        setSelectedIds(allIds);
        return;
      }

      // Ctrl+D — duplicate selected element(s)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (ids.length === 0 || !page) return;
        pushToHistory();
        setIsDirty(true);
        const ts = Date.now();
        const newEls: CanvasElement[] = [];
        ids.forEach((id, idx) => {
          const el = page.elements.find((e) => e.id === id);
          if (!el || el.locked) return;
          newEls.push({
            ...el,
            id: `${el.id}-dup-${ts}-${idx}`,
            x: nextPasteCoord(el.x, 16, el.width,  A4_WIDTH),
            y: nextPasteCoord(el.y, 16, el.height, A4_HEIGHT),
            zIndex: el.zIndex + 1,
            groupId: undefined,
          });
        });
        if (newEls.length > 0) {
          batchAddCanvasElements(page.id, newEls);
          setSelectedIds(newEls.map((el) => el.id));
        }
        return;
      }

      // Arrow Left/Right — navigate pages when no element is selected
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ids.length === 0 && !renamingPageId) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') setCanvasPageIdx((i) => Math.max(0, i - 1));
        else                       setCanvasPageIdx((i) => Math.min(pagesLen - 1, i + 1));
        return;
      }

      // Arrow keys — nudge selected elements (single store call via batch)
      const NUDGE = e.shiftKey ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ids.length > 0 && page) {
        e.preventDefault();
        pushToHistory();
        setIsDirty(true);
        const dx = e.key === 'ArrowLeft' ? -NUDGE : e.key === 'ArrowRight' ? NUDGE : 0;
        const dy = e.key === 'ArrowUp'   ? -NUDGE : e.key === 'ArrowDown'  ? NUDGE : 0;
        const updates = ids.flatMap((id) => {
          const el = page.elements.find((el) => el.id === id);
          if (!el || el.locked) return [];
          // Guard the upper bound with Math.max(0, ...) so that oversized elements
          // (width > A4_WIDTH) don't get a negative bound and snap to x = 0 on nudge.
          return [{
            id,
            patch: {
              x: Math.max(0, Math.min(Math.max(0, A4_WIDTH  - el.width),  el.x + dx)),
              y: Math.max(0, Math.min(Math.max(0, A4_HEIGHT - el.height), el.y + dy)),
            },
          }];
        });
        if (updates.length > 0) batchUpdateCanvasElements(page.id, updates);
        return;
      }

      // G — toggle grid visibility
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setGridConfig((prev) => ({ ...prev, visible: !prev.visible }));
        return;
      }
      // S — toggle snap-to-grid
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setGridConfig((prev) => ({ ...prev, snap: !prev.snap }));
        return;
      }
      // Ctrl+G — group selection (inlined to avoid forward-ref on handleGroupSelected)
      if (e.key === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey && page && ids.length >= 2 && hasLayout) {
        e.preventDefault();
        // Skip locked elements — they cannot meaningfully participate in a group.
        const groupable = ids.filter((id) => {
          const el = page.elements.find((e) => e.id === id);
          return !!el && !el.locked;
        });
        if (groupable.length < 2) return;
        pushToHistory();
        setIsDirty(true);
        const newGroupId = `grp-${Date.now()}`;
        const groupableSet = new Set(groupable);
        updateCanvasPage(page.id, {
          elements: page.elements.map((el) =>
            groupableSet.has(el.id) ? { ...el, groupId: newGroupId } : el
          ),
        });
        return;
      }
      // Ctrl+Shift+G — ungroup selection (inlined for same reason)
      if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey && page && ids.length >= 1) {
        e.preventDefault();
        // Only ungroup non-locked elements — locked elements keep their groupId.
        const ungroupable = ids.filter((id) => {
          const el = page.elements.find((e) => e.id === id);
          return !!el && !el.locked;
        });
        if (ungroupable.length === 0) return;
        pushToHistory();
        setIsDirty(true);
        const ungroupableSet = new Set(ungroupable);
        updateCanvasPage(page.id, {
          elements: page.elements.map((el) =>
            ungroupableSet.has(el.id) ? { ...el, groupId: undefined } : el
          ),
        });
        setSelectedIds([]);
        return;
      }

      // Ctrl+C — copy selected elements to clipboard
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!page || ids.length === 0) return;
        const toCopy = ids
          .map(id => page.elements.find(el => el.id === id))
          .filter(Boolean) as CanvasElement[];
        // Strip groupId so pasted elements aren't accidentally in a group
        setClipboard(toCopy.map(el => ({ ...el, groupId: undefined })));
        return;
      }

      // Ctrl+V — paste elements from clipboard
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!page || clipboard.length === 0) return;
        pushToHistory();
        setIsDirty(true);
        const ts = Date.now();
        const newEls: CanvasElement[] = clipboard.map((el, idx) => ({
          ...el,
          id: `${el.id}-paste-${ts}-${idx}`,
          x: nextPasteCoord(el.x, 16, el.width,  A4_WIDTH),
          y: nextPasteCoord(el.y, 16, el.height, A4_HEIGHT),
          zIndex: el.zIndex + 1,
        }));
        batchAddCanvasElements(page.id, newEls);
        setSelectedIds(newEls.map((el) => el.id));
        return;
      }

      if (e.key === 'Escape') {
        // When any modal/panel is open, let it handle its own Escape — don't wipe canvas state.
        if (showSaveDialog || showVersionHistory || showBgPanel || showImportMedia) return;
        if (editingGroupId && page) {
          // Sai do modo de edição e restaura seleção do grupo
          const groupMembers = page.elements
            .filter((el) => el.groupId === editingGroupId)
            .map((el) => el.id);
          setSelectedIds(groupMembers);
          setEditingGroupId(null);
        } else {
          setSelectedIds([]);
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length > 0 && page) {
        // Filter out locked elements — they must survive Delete even when selected via Ctrl+A.
        const deletable = ids.filter((id) => {
          const el = page.elements.find((e) => e.id === id);
          return !!el && !el.locked;
        });
        if (deletable.length === 0) return;
        pushToHistory();
        setIsDirty(true);
        batchRemoveCanvasElements(page.id, deletable);
        // Remove only the deleted IDs from selection; locked elements remain selected.
        const deletableSet = new Set(deletable);
        setSelectedIds((prev) => prev.filter((id) => !deletableSet.has(id)));
        showDeleteToast(deletable.length, ids.length - deletable.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // currentPage/selectedIds/activeLayout/pages.length are read from refs/getState() inside
  // the handler — removing them from this dep array stops the listener from re-registering
  // on every drag frame. handleUndo/handleRedo are stable (dep = [applyTemplate]).
  // showSave/VersionHistory/BgPanel/ImportMedia are modal booleans that change only on user
  // actions (not per-frame), so including them here is fine — they're needed for the Escape guard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, clipboard, renamingPageId, editingGroupId, showSaveDialog, showVersionHistory, showBgPanel, showImportMedia, batchAddCanvasElements, batchRemoveCanvasElements, batchUpdateCanvasElements, updateCanvasPage, pushToHistory, showDeleteToast]);

  const isApproved = projectStatus === 'approved';

  // ─── DnD handlers ─────────────────────────────────────────────────────────
  // NOTE: All hooks below are declared unconditionally so they always run in
  // the same order. The !isApproved guard is expressed in the JSX return at
  // the bottom of the component — not as an early return here — to comply
  // with the Rules of Hooks.

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.fromPalette && !data.isPreset) setActiveDragType(String(data.elementType));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Ensure the mutation flag is cleared at drag-end regardless of rAF timing.
    // handleMutationStart schedules clearance via rAF, but a quick click-release can
    // cause the rAF to fire before drag-end, leaving the flag set incorrectly.
    isMutatingRef.current = false;
    setActiveDragType(null);
    const { active, over, delta } = event;
    const data = active.data.current;

    // Read current values via refs — avoids listing currentPage/canvasScale/gridConfig
    // as deps, which would cause recreation on every drag frame, zoom, or grid toggle.
    const currentPage  = currentPageRef.current;
    const canvasScale  = canvasScaleRef.current;
    const gridConfig   = gridConfigRef.current;

    if (!data?.fromPalette || !over || !currentPage) return;

    // Compute drop position relative to the A4 canvas
    const canvasEl = document.getElementById(`canvas-drop-${currentPage.id}`);
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    // Safely extract clientX/Y — activatorEvent can be MouseEvent, TouchEvent, or KeyboardEvent.
    // TouchEvent lacks top-level clientX/Y (they live on touches[0]); casting to PointerEvent
    // would silently produce NaN on touch drags, turning the drop position into NaN.
    const ae = event.activatorEvent;
    const clientX = ae instanceof MouseEvent
      ? ae.clientX
      : ae instanceof TouchEvent
      ? (ae.touches[0]?.clientX ?? 0)
      : 0;
    const clientY = ae instanceof MouseEvent
      ? ae.clientY
      : ae instanceof TouchEvent
      ? (ae.touches[0]?.clientY ?? 0)
      : 0;
    const finalX = clientX + delta.x;
    const finalY = clientY + delta.y;

    const rawX = (finalX - rect.left) / canvasScale;
    const rawY = (finalY - rect.top) / canvasScale;

    const w = Number(data.defaultWidth ?? 200);
    const h = Number(data.defaultHeight ?? 100);
    const snap = (v: number) => gridConfig.snap
      ? Math.round(v / gridConfig.size) * gridConfig.size
      : Math.round(v);
    const x = snap(Math.max(0, Math.min(A4_WIDTH  - w, rawX - w / 2)));
    const y = snap(Math.max(0, Math.min(A4_HEIGHT - h, rawY - h / 2)));

    // addCanvasElement handles null activeLayout internally — no need to guard here
    const baseZIndex = (currentPage.elements.length + 1) * 10;

    // ── Preset: adiciona múltiplos elementos de uma vez (único set()) ─────────
    if (data.isPreset) {
      pushToHistory();
      setIsDirty(true);
      type PresetDef = { type: CanvasElement['type']; dx: number; dy: number; width: number; height: number; zIndex: number; groupId?: string; props: Record<string, unknown> };
      const defs = (data.presetElements as PresetDef[]) ?? [];
      const ts = Date.now();
      const newElements: CanvasElement[] = defs.map((def, i) => ({
        id:      `el-${ts}-${Math.random().toString(36).slice(2, 7)}-${i}`,
        type:    def.type,
        x:       Math.round(snap(Math.max(0, x + def.dx))),
        y:       Math.round(snap(Math.max(0, y + def.dy))),
        width:   def.width,
        height:  def.height,
        zIndex:  baseZIndex + def.zIndex,
        locked:  false,
        visible: true,
        groupId: def.groupId ?? undefined,
        props:   { ...def.props },
      }));
      batchAddCanvasElements(currentPage.id, newElements);
      setSelectedIds(newElements.map((el) => el.id));
      return;
    }

    // ── Elemento único ─────────────────────────────────────────────────────────
    pushToHistory();
    setIsDirty(true);
    const newElement: CanvasElement = {
      id:      `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type:    data.elementType as CanvasElement['type'],
      x:       Math.round(x),
      y:       Math.round(y),
      width:   w,
      height:  h,
      zIndex:  baseZIndex,
      locked:  false,
      visible: true,
      props:   { ...(data.defaultProps ?? DEFAULT_ELEMENT_PROPS[data.elementType as CanvasElement['type']]) },
    };

    addCanvasElement(currentPage.id, newElement);
    setSelectedIds([newElement.id]);
  // stable for component lifetime — currentPage/canvasScale/gridConfig read via refs.
  }, [addCanvasElement, batchAddCanvasElements, pushToHistory]);

  // ─── Page management ───────────────────────────────────────────────────────

  const handleAddPage = useCallback(() => {
    // Read activeLayout from the store at call time — avoids listing the volatile
    // store object as a dep, which would recreate this callback on every element mutation.
    if (!useSolarStore.getState().proposalData.activeLayout) {
      applyTemplate(CLASSIC_TEMPLATE);
      return;
    }
    pushToHistory();
    setIsDirty(true);
    // Read pages.length from the store to avoid it as a dep while still getting current value.
    const len = useSolarStore.getState().proposalData.activeLayout!.pages.length;
    const newPage: CanvasPageType = {
      id: `p-${Date.now()}`,
      label: `Página ${len + 1}`,
      background: { color: '#ffffff' },
      elements: [],
    };
    addCanvasPage(newPage);
    setCanvasPageIdx(len);
    setSelectedIds([]);
  // stable — activeLayout and pages.length read from getState() at call time.
  }, [applyTemplate, pushToHistory, addCanvasPage]);

  const handleRemovePage = useCallback((pageId: string) => {
    // Read pages.length from the store at call time — avoids the volatile dep and
    // keeps this callback stable across edits (same pattern as handleAddPage/handleDuplicatePage).
    const len = useSolarStore.getState().proposalData.activeLayout?.pages.length
      ?? CLASSIC_TEMPLATE.pages.length;
    if (len <= 1) return;
    pushToHistory();
    setIsDirty(true);
    removeCanvasPage(pageId);
    // Cap index at newLength - 1 = len - 2 (pre-removal count minus the removed page minus 1).
    setCanvasPageIdx((prev) => Math.min(prev, len - 2));
    setSelectedIds([]);
  // stable — pages.length read from getState() at call time.
  }, [pushToHistory, removeCanvasPage]);

  const handleDuplicatePage = useCallback((pageId: string) => {
    // Read activeLayout from the store at call time — avoids listing the volatile
    // store object as a dep, which would recreate this callback on every element mutation.
    const layout = useSolarStore.getState().proposalData.activeLayout;
    if (!layout) {
      applyTemplate(CLASSIC_TEMPLATE);
      return; // re-render will have a layout; user clicks again
    }
    const src = layout.pages.find((p) => p.id === pageId);
    if (!src) return;
    const ts = Date.now();
    const newPage = {
      ...src,
      id: `page-dup-${ts}`,
      label: `${src.label} (cópia)`,
      elements: src.elements.map((el, i) => ({ ...el, id: `${el.id}-dup-${ts}-${i}` })),
    };
    pushToHistory();
    setIsDirty(true);
    addCanvasPage(newPage);
    setCanvasPageIdx(layout.pages.length); // navigate to the newly appended duplicate
    setSelectedIds([]); // clear stale selection — IDs from old page don't exist on the new one
  // stable — activeLayout and pages.length read from getState() at call time.
  }, [applyTemplate, pushToHistory, addCanvasPage]);

  const handleRenamePage = useCallback((pageId: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return; // child guards via fallback, but defence-in-depth against empty labels
    pushToHistory();
    setIsDirty(true);
    updateCanvasPage(pageId, { label: trimmed });
  }, [pushToHistory, updateCanvasPage]);

  // ─── Element handlers ──────────────────────────────────────────────────────

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    const page = currentPageRef.current;
    if (!page) return;
    setIsDirty(true);
    // Pre-drag snapshot already pushed by onMutationStart — skip during the drag stroke.
    if (!isMutatingRef.current) {
      const now = Date.now();
      if (now - lastHistoryPushRef.current > 500) {
        pushToHistory();
        lastHistoryPushRef.current = now;
      }
    }
    updateCanvasElement(page.id, elementId, updates);
  // stable — reads currentPage via currentPageRef, not as a closure dep.
  // Prevents per-frame recreation during drag strokes when currentPage gets a new ref.
  }, [updateCanvasElement, pushToHistory]);

  const handleRemoveElement = useCallback((elementId: string) => {
    const page = currentPageRef.current;
    if (!page) return;
    pushToHistory();
    setIsDirty(true);
    removeCanvasElement(page.id, elementId);
    // Functional updater avoids capturing selectedIds in the dep array —
    // prevents handleRemoveElement from recreating on every selection change.
    setSelectedIds((prev) => prev.includes(elementId) ? prev.filter((id) => id !== elementId) : prev);
  // stable — reads currentPage via currentPageRef.
  }, [removeCanvasElement, pushToHistory]);

  // ─── Group handlers ────────────────────────────────────────────────────────

  const handleGroupSelected = useCallback(() => {
    const ids  = selectedIdsRef.current;
    const page = currentPageRef.current;
    if (!page || ids.length < 2) return;
    // Read activeLayout directly from the store — stable reference, no dep needed.
    if (!useSolarStore.getState().proposalData.activeLayout) {
      applyTemplate(CLASSIC_TEMPLATE);
      // Inform the user that the template had to be initialised first — they need
      // to reselect and group again after the layout loads.
      showToast('Template carregado. Selecione os elementos e agrupe novamente.');
      return;
    }
    // Skip locked elements — they cannot meaningfully participate in a group.
    const groupable = ids.filter((id) => {
      const el = page.elements.find((e) => e.id === id);
      return !!el && !el.locked;
    });
    if (groupable.length < 2) return;
    pushToHistory();
    setIsDirty(true);
    const newGroupId = `grp-${Date.now()}`;
    const groupableSet = new Set(groupable);
    const elements = page.elements.map((el) =>
      groupableSet.has(el.id) ? { ...el, groupId: newGroupId } : el
    );
    updateCanvasPage(page.id, { elements });
  // stable — reads currentPage/selectedIds via refs; activeLayout via getState().
  // showToast is stable (deps []).
  }, [applyTemplate, pushToHistory, showToast, updateCanvasPage]);

  const handleUngroupSelected = useCallback(() => {
    const page = currentPageRef.current;
    if (!page) return;
    // Only ungroup non-locked elements — locked elements keep their groupId unchanged,
    // mirroring the locked filter added to handleGroupSelected and Ctrl+G.
    const ungroupable = selectedIdsRef.current.filter((id) => {
      const el = page.elements.find((e) => e.id === id);
      return !!el && !el.locked;
    });
    if (ungroupable.length === 0) return;
    pushToHistory();
    setIsDirty(true);
    const ungroupableSet = new Set(ungroupable);
    const elements = page.elements.map((el) =>
      ungroupableSet.has(el.id) ? { ...el, groupId: undefined } : el
    );
    updateCanvasPage(page.id, { elements });
    setSelectedIds([]);
  // stable — reads currentPage/selectedIds via refs.
  }, [pushToHistory, updateCanvasPage]);

  // ─── Decompose / Restore page handlers ─────────────────────────────────────

  const handleDecomposePage = useCallback(() => {
    const page = currentPageRef.current;
    if (!page) return;
    pushToHistory();
    setIsDirty(true);
    // Remove existing page-technical block and add decomposed elements in a single set().
    const ts = Date.now();
    const withoutTechBlock = page.elements.filter((e) => e.type !== 'page-technical');
    const newEls = TECHNICAL_PAGE_ELEMENTS.map((el, i) => ({ ...el, id: `${el.id}-${ts}-${i}` }));
    updateCanvasPage(page.id, { elements: [...withoutTechBlock, ...newEls] });
    setSelectedIds([]);
  // stable — reads currentPage via currentPageRef.
  }, [pushToHistory, updateCanvasPage]);

  const handleRestorePage = useCallback(() => {
    const page = currentPageRef.current;
    if (!page) return;
    // Read activeLayout directly from the store — stable, no subscription needed.
    if (!useSolarStore.getState().proposalData.activeLayout) return;
    pushToHistory();
    setIsDirty(true);
    // Clear all elements and restore the canonical page-technical block in one mutation.
    updateCanvasPage(page.id, {
      elements: [{
        id: `classic-p0-main-${Date.now()}`,
        type: 'page-technical',
        x: 0, y: 0, width: 794, height: 1123,
        zIndex: 0, locked: true, visible: true, props: {},
      }],
    });
    setSelectedIds([]);
  // stable — reads currentPage via currentPageRef; activeLayout via getState().
  }, [pushToHistory, updateCanvasPage]);

  // Stable pan callback — must be memoised so CanvasPage's space-key useEffect
  // doesn't re-register listeners on every parent render.
  const handlePanDelta = useCallback((dx: number, dy: number) => {
    canvasScrollRef.current?.scrollBy({ left: -dx, top: -dy });
  }, []);

  // ─── Stable CanvasPage / LayersPanel callbacks ────────────────────────────────
  // Extracted from inline JSX so that adding React.memo to CanvasPage in the future
  // doesn't require a separate pass to fix prop instability.

  const handleMutationStart = useCallback(() => {
    isMutatingRef.current = true;
    pushToHistory();
    lastHistoryPushRef.current = Date.now();
    // rAF guarantees the reset fires after React 18 concurrent renderer has flushed
    // all useEffect/useLayoutEffect from the drag-start — safer than setTimeout(0).
    requestAnimationFrame(() => { isMutatingRef.current = false; });
    setIsDirty(true);
  }, [pushToHistory]);

  const handleDuplicateElement = useCallback((elementId: string) => {
    const page = currentPageRef.current;
    if (!page) return;
    const el = page.elements.find((e) => e.id === elementId);
    if (!el || el.locked) return;
    pushToHistory();
    setIsDirty(true);
    const ts = Date.now();
    const newEl: CanvasElement = {
      ...el,
      id: `${el.id}-dup-${ts}`,
      x: nextPasteCoord(el.x, 16, el.width,  A4_WIDTH),
      y: nextPasteCoord(el.y, 16, el.height, A4_HEIGHT),
      zIndex: el.zIndex + 1,
      groupId: undefined,
    };
    addCanvasElement(page.id, newEl);
    setSelectedIds([newEl.id]);
  // stable — reads currentPage via currentPageRef.
  }, [pushToHistory, addCanvasElement]);

  const handleEnterGroupEdit = useCallback((groupId: string, elementId: string) => {
    setEditingGroupId(groupId);
    setSelectedIds([elementId]);
  }, []);

  const handleExitGroupEdit = useCallback(() => {
    setEditingGroupId(null);
  }, []);

  const handleDropImage = useCallback(({ url, x, y }: { url: string; x: number; y: number }) => {
    const page = currentPageRef.current;
    if (!page) return;
    pushToHistory();
    setIsDirty(true);
    const clampedX = Math.max(0, Math.min(A4_WIDTH - 200, x - 100));
    const clampedY = Math.max(0, Math.min(A4_HEIGHT - 150, y - 75));
    const newEl = createImageElement(url, clampedX, clampedY, (page.elements.length + 1) * 10);
    addCanvasElement(page.id, newEl);
    setSelectedIds([newEl.id]);
  // stable — reads currentPage via currentPageRef.
  }, [pushToHistory, addCanvasElement]);

  const handleReorderElements = useCallback((orderedIds: string[]) => {
    const page = currentPageRef.current;
    if (!page) return;
    pushToHistory();
    setIsDirty(true);
    const total = orderedIds.length;
    const zMap = new Map(orderedIds.map((id, i) => [id, (total - i) * 10]));
    const elements = page.elements.map((el) =>
      zMap.has(el.id) ? { ...el, zIndex: zMap.get(el.id)! } : el
    );
    updateCanvasPage(page.id, { elements });
  // stable — reads currentPage via currentPageRef.
  }, [pushToHistory, updateCanvasPage]);

  // ─── Stable PageNavigatorBar callbacks ──────────────────────────────────────
  // Extracted so PageNavigatorBar (and any future React.memo wrapper) isn't
  // handed new function references on every parent render.

  const handleNavigatePage = useCallback((idx: number) => {
    setCanvasPageIdx(idx);
    setSelectedIds([]);
  }, []);

  const handleCommitRename = useCallback((id: string, label: string) => {
    handleRenamePage(id, label);
    setRenamingPageId(null);
  }, [handleRenamePage]);

  const handleCancelRename = useCallback(() => setRenamingPageId(null), []);

  // Stable callback for ElementPropertiesPanel onUpdate — only recreates when
  // the selected element's ID changes (i.e. when the user selects a different element).
  const handleUpdateSelectedElement = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (!selectedElement?.id) return;
      handleUpdateElement(selectedElement.id, updates);
    },
    // handleUpdateElement is stable; selectedElement?.id is a primitive string.
    [selectedElement?.id, handleUpdateElement],
  );

  // ─── Zoom controls ────────────────────────────────────────────────────────────

  const handleZoomIn  = useCallback(() => {
    setManualScale((prev) => computeNextZoom(prev, fitScaleRef.current, 'in'));
  }, []); // stable — fitScale read via fitScaleRef (same pattern as the Ctrl+scroll handler)

  const handleZoomOut = useCallback(() => {
    setManualScale((prev) => computeNextZoom(prev, fitScaleRef.current, 'out'));
  }, []); // stable — fitScale read via fitScaleRef

  const handleZoomFit = useCallback(() => setManualScale(null), []);

  // Export: switch to preview (which mounts ProposalDocumentPreview), then fire window.print()
  // ProposalDocumentPreview listens to isExportingPdf in the store and calls window.print() itself.
  const handleExportPdf = useCallback(() => {
    // Warn the user when there are unsaved layout changes so they can save before exporting.
    if (isDirty && !window.confirm('Há alterações não salvas no layout.\nDeseja exportar mesmo assim?')) return;
    pendingPrintRef.current = true;
    setViewMode('preview');
  }, [isDirty]);

  // When preview mode becomes active with a pending print, fire after mount delay
  useEffect(() => {
    if (viewMode !== 'preview' || !pendingPrintRef.current) return;
    pendingPrintRef.current = false;
    const timer = setTimeout(() => setExportingPdf(true), 400);
    return () => clearTimeout(timer);
  }, [viewMode, setExportingPdf]);

  // ── Import: imagem ou única página de PDF → elemento no canvas ───────────
  const handleImportConfirm = useCallback((dataUrl: string) => {
    const page = currentPageRef.current;
    if (!page) return;
    pushToHistory();
    setIsDirty(true);
    const newEl = createImageElement(dataUrl, 197, 311, (page.elements.length + 1) * 10);
    addCanvasElement(page.id, newEl);
    setSelectedIds([newEl.id]);
    setShowImportMedia(false);
  // stable — reads currentPage via currentPageRef.
  }, [pushToHistory, addCanvasElement]);

  // ── Import: páginas de PDF → novas páginas com imagem de fundo ───────────
  const handleImportAsPages = useCallback((pdfPages: PdfPageResult[]) => {
    if (pdfPages.length === 0) return;
    pushToHistory();
    setIsDirty(true);

    const newPages: CanvasPageType[] = pdfPages.map(({ dataUrl, pageNumber }, i) => ({
      id:          `page-pdf-${Date.now()}-${i}`,
      label:       `PDF pág. ${pageNumber}`,
      background:  { imageUrl: `${dataUrl}|cover` },
      elements:    [],
      orientation: 'portrait' as const,
    }));
    batchAddCanvasPages(newPages);

    // Read the current page count from the store so this callback doesn't need
    // pages.length as a dep (which would recreate it on every page add/remove).
    const currentLen = useSolarStore.getState().proposalData.activeLayout?.pages.length
      ?? CLASSIC_TEMPLATE.pages.length;
    setCanvasPageIdx(currentLen);
    setSelectedIds([]);
    setShowImportMedia(false);
  // stable — pages.length read from getState() at call time.
  }, [batchAddCanvasPages, pushToHistory]);

  // Non-passive wheel listener for Ctrl+scroll — single source of truth for zoom.
  // Must be on window (passive:false) so e.preventDefault() works; React's onWheel is passive in React 19.
  // Uses fitScaleRef (not fitScale) so fitScale changes don't re-register the listener.
  useEffect(() => {
    if (viewMode !== 'editor') return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 'in' : 'out';
      setManualScale((prev) => computeNextZoom(prev, fitScaleRef.current, direction));
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, [viewMode]);

  const handleAlign = useCallback((direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'distribute-h' | 'distribute-v') => {
    const page = currentPageRef.current;
    const ids  = selectedIdsRef.current;
    if (!page || ids.length < 2) return;
    // Compute movable BEFORE pushing history — if all selected elements are locked,
    // we skip the mutation entirely rather than pushing a spurious empty undo entry.
    const movable = page.elements.filter((e) => ids.includes(e.id) && !e.locked);
    if (movable.length < 2) return;
    pushToHistory();
    setIsDirty(true);

    const minX    = Math.min(...movable.map((e) => e.x));
    const maxX    = Math.max(...movable.map((e) => e.x + e.width));
    const minY    = Math.min(...movable.map((e) => e.y));
    const maxY    = Math.max(...movable.map((e) => e.y + e.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Build a patchMap for all affected elements in one pass, then apply in a single updateCanvasPage.
    const patchMap = new Map<string, Partial<CanvasElement>>();

    if (direction === 'distribute-h') {
      const sorted = [...movable].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + e.width, 0);
      const gap = (maxX - minX - totalW) / (sorted.length - 1);
      let cursor = minX;
      for (const el of sorted) {
        patchMap.set(el.id, { x: Math.round(cursor) });
        cursor += el.width + gap;
      }
    } else if (direction === 'distribute-v') {
      const sorted = [...movable].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + e.height, 0);
      const gap = (maxY - minY - totalH) / (sorted.length - 1);
      let cursor = minY;
      for (const el of sorted) {
        patchMap.set(el.id, { y: Math.round(cursor) });
        cursor += el.height + gap;
      }
    } else {
      for (const el of movable) {
        const updates: Partial<CanvasElement> = {};
        if (direction === 'left')     updates.x = minX;
        if (direction === 'right')    updates.x = maxX - el.width;
        if (direction === 'center-h') updates.x = Math.round(centerX - el.width / 2);
        if (direction === 'top')      updates.y = minY;
        if (direction === 'bottom')   updates.y = maxY - el.height;
        if (direction === 'center-v') updates.y = Math.round(centerY - el.height / 2);
        patchMap.set(el.id, updates);
      }
    }

    const elements = page.elements.map((el) => {
      const patch = patchMap.get(el.id);
      return patch ? { ...el, ...patch } : el;
    });
    updateCanvasPage(page.id, { elements });
  // stable — reads currentPage/selectedIds via refs; no dep on either.
  }, [pushToHistory, updateCanvasPage]);

  // Stable callbacks for PageBackgroundPanel — extracted from inline JSX so the panel
  // doesn't see new function references on every parent render while the user is actively
  // editing the background (e.g. dragging a color slider triggers rapid re-renders).
  const handleBgUpdate = useCallback((bg: CanvasPageType['background']) => {
    const pageId = currentPageRef.current?.id;
    if (!pageId) return;
    pushToHistory();
    setIsDirty(true);
    updateCanvasPage(pageId, { background: bg });
  }, [pushToHistory, updateCanvasPage]);

  const handleCloseBgPanel = useCallback(() => setShowBgPanel(false), []);

  const isPageDecomposed = useMemo(
    () => currentPage ? !currentPage.elements.some((e) => e.type === 'page-technical') : false,
    // Dep on elements (not currentPage) so the memo doesn't recompute on unrelated
    // page-level changes (label, background) — matches selectedElement/selectedGroupId pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage?.elements],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!isApproved) {
    return (
      <ProposalBlockedScreen
        onGoToProjection={() => setFocusedBlock('projection')}
        onNavigate={(block) => setFocusedBlock(block)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden relative">

      {/* Top Mode Switcher */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 flex items-center gap-1 px-4 py-1.5 justify-between">
        <div className="flex items-center gap-1">
          {VIEW_TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              {tab.icon}
              {tab.label}
              {/* Show dot on any active tab whenever there are unsaved changes — not just
                  when already viewing the editor, so users switching to Preview/Templates
                  retain the visual affordance that work is pending. */}
              {tab.id === 'editor' && isDirty && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" title="Alterações não salvas" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          {viewMode === 'editor' && (
            <>
              <button
                type="button"
                onClick={() => setShowVersionHistory(true)}
                className="p-1.5 rounded-md text-indigo-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Histórico de versões"
              >
                <History size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowImportMedia(true)}
                className="p-1.5 rounded-md text-violet-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Importar imagem ou página de PDF"
              >
                <FileImage size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                className="p-1.5 rounded-md text-emerald-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Salvar como template"
              >
                <Save size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
            </>
          )}
          <button
            type="button"
            onClick={handleExportPdf}
            title="Exportar todas as páginas como PDF (Ctrl+P)"
            className="p-1.5 rounded-md text-sky-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FileDown size={14} />
          </button>
        </div>
      </div>

      {/* ── TEMPLATES MODE ───────────────────────────────────────────────── */}
      {viewMode === 'templates' && (
        <div className="flex-1 overflow-hidden bg-slate-50">
          <ProposalTemplateGallery onUseTemplate={() => { setViewMode('editor'); setIsDirty(false); }} />
        </div>
      )}

      {/* ── EDITOR MODE ──────────────────────────────────────────────────── */}
      {viewMode === 'editor' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex overflow-hidden relative">

            {/* Left sidebar — fixed 224px */}
            <div className="w-56 shrink-0 flex flex-col overflow-hidden bg-slate-950">
              {/* Tab switcher */}
              <div className="shrink-0 flex border-b border-slate-800 bg-slate-900/20">
                <button
                  type="button"
                  onClick={() => setSidebarTab('elements')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                    sidebarTab === 'elements'
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  <PanelLeft size={11} />
                  Elementos
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('layers')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                    sidebarTab === 'layers'
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  <LayoutList size={11} />
                  Camadas
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('pages')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                    sidebarTab === 'pages'
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  <Files size={11} />
                  Páginas
                </button>
              </div>

              {/* Content */}
              {sidebarTab === 'elements' && (
                <ElementPalette hasCustomLayout={!!activeLayout} />
              )}
              {sidebarTab === 'layers' && (
                <LayersPanel
                  elements={currentPage?.elements ?? []}
                  selectedIds={selectedIds}
                  onSelect={setSelectedIds}
                  onUpdate={handleUpdateElement}
                  onRemove={handleRemoveElement}
                  onReorderElements={handleReorderElements}
                />
              )}
              {sidebarTab === 'pages' && (
                <PagesThumbnailPanel
                  pages={pages}
                  activeIdx={safePageIdx}
                  excludedPages={excludedPages}
                  onNavigate={handleNavigatePage}
                  onAddPage={handleAddPage}
                  onDuplicate={handleDuplicatePage}
                  onRemove={handleRemovePage}
                />
              )}
            </div>

            {/* Canvas area */}
            <div ref={canvasAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-900/80 relative">
              {/* Canvas toolbar — clean single line */}
              <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800 gap-3">

                {/* Grid controls */}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1">
                  <button
                    type="button"
                    onClick={() => updateGrid({ visible: !gridConfig.visible })}
                    title={gridConfig.visible ? 'Ocultar grid (G)' : 'Mostrar grid (G)'}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridConfig.visible ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <Grid3x3 size={13} />
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  <button
                    type="button"
                    onClick={() => updateGrid({ snap: !gridConfig.snap })}
                    title={gridConfig.snap ? 'Desativar snap (S)' : 'Ativar snap (S)'}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridConfig.snap ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <Magnet size={13} />
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  <button
                    type="button"
                    onClick={() => updateGrid({ guides: !gridConfig.guides })}
                    title={gridConfig.guides ? 'Desativar guias inteligentes' : 'Ativar guias inteligentes'}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridConfig.guides ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <Target size={13} />
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  <div className="flex items-center gap-0.5 px-1">
                    {([8, 16] as const).map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => updateGrid({ size })}
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] rounded font-mono transition-colors',
                          gridConfig.size === size
                            ? 'text-white bg-slate-600'
                            : 'text-slate-500 hover:text-slate-300'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px h-4 bg-slate-700" />

                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    title="Desfazer (Ctrl+Z)"
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Undo2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    title="Refazer (Ctrl+Y)"
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Redo2 size={12} />
                  </button>
                </div>

                <div className="w-px h-4 bg-slate-700" />

                {/* Zoom controls */}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Diminuir zoom (Ctrl+−)"
                    disabled={canvasScale <= 0.25}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <ZoomOut size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomFit}
                    className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded font-mono tabular-nums min-w-[3rem] text-center transition-colors"
                    title="Ajustar à tela"
                  >
                    {Math.round(canvasScale * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Aumentar zoom (Ctrl++)"
                    disabled={canvasScale >= 2.0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <ZoomIn size={12} />
                  </button>

                  <div className="w-px h-4 bg-slate-700 mx-0.5" />

                  <button
                    type="button"
                    onClick={handleZoomFit}
                    title="Ajustar à tela"
                    className={cn(
                      'p-1 rounded transition-colors',
                      manualScale === null
                        ? 'text-emerald-400 bg-slate-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    )}
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>

              {/* Floating alignment bar */}
              {selectedIds.length >= 2 && (
                <div
                  role="toolbar"
                  aria-label="Ferramentas de alinhamento"
                  style={{
                  position: 'absolute',
                  top: 48,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 990,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '4px 8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  pointerEvents: 'auto',
                }}>
                  {!selectedGroupId && (
                    <button type="button" onClick={handleGroupSelected}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-400 hover:bg-slate-800 transition-colors font-medium"
                      title="Agrupar seleção">
                      <Layers size={12} /> {selectedIds.length}
                    </button>
                  )}
                  <div style={ALIGN_SEP_STYLE} />
                  <button type="button" onClick={() => handleAlign('left')} title="Alinhar à esquerda" aria-label="Alinhar à esquerda" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignStartVertical size={13} /></button>
                  <button type="button" onClick={() => handleAlign('center-h')} title="Centralizar horizontalmente" aria-label="Centralizar horizontalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignCenterVertical size={13} /></button>
                  <button type="button" onClick={() => handleAlign('right')} title="Alinhar à direita" aria-label="Alinhar à direita" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignEndVertical size={13} /></button>
                  <div style={ALIGN_SEP_STYLE} />
                  <button type="button" onClick={() => handleAlign('top')} title="Alinhar ao topo" aria-label="Alinhar ao topo" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignStartHorizontal size={13} /></button>
                  <button type="button" onClick={() => handleAlign('center-v')} title="Centralizar verticalmente" aria-label="Centralizar verticalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignCenterHorizontal size={13} /></button>
                  <button type="button" onClick={() => handleAlign('bottom')} title="Alinhar ao fundo" aria-label="Alinhar ao fundo" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignEndHorizontal size={13} /></button>
                  {selectedIds.length >= 3 && (
                    <>
                      <div style={ALIGN_SEP_STYLE} />
                      <button type="button" onClick={() => handleAlign('distribute-h')} title="Distribuir horizontalmente" aria-label="Distribuir horizontalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignHorizontalDistributeCenter size={13} /></button>
                      <button type="button" onClick={() => handleAlign('distribute-v')} title="Distribuir verticalmente" aria-label="Distribuir verticalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignVerticalDistributeCenter size={13} /></button>
                    </>
                  )}
                </div>
              )}

              {/* Floating page navigator — Figma/Canva style, bottom-center of canvas area */}
              <PageNavigatorBar
                pages={pages}
                activeIdx={safePageIdx}
                renamingPageId={renamingPageId}
                onNavigate={handleNavigatePage}
                onAddPage={handleAddPage}
                onDuplicate={handleDuplicatePage}
                onRemove={handleRemovePage}
                onStartRename={setRenamingPageId}
                onCommitRename={handleCommitRename}
                onCancelRename={handleCancelRename}
              />

              {/* A4 Canvas */}
              <div
                ref={canvasScrollRef}
                role="application"
                aria-label="Canvas de documento"
                // tabIndex={0} makes the canvas focusable so keyboard shortcuts fire for
                // users who navigate via keyboard only (the window-level handler fires
                // regardless, but focus here provides a clear activation target for AT).
                tabIndex={0}
                className="flex-1 overflow-auto flex items-start justify-center p-8 custom-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                // Only deselect when clicking the scroll container background directly —
                // not when the click bubbled up from the canvas page or its children.
                // Without this guard, rubber-band selections get wiped after mouseup.
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedIds([]); }}
              >
                {currentPage && (
                  <div
                    id={`canvas-drop-${currentPage.id}`}
                    style={{
                      transform: `scale(${canvasScale})`,
                      transformOrigin: 'top center',
                      marginBottom: canvasScale < 1 ? `${(A4_HEIGHT * canvasScale) - A4_HEIGHT}px` : 0,
                    }}
                  >
                    <CanvasPage
                      page={currentPage}
                      scale={canvasScale}
                      selectedIds={selectedIds}
                      gridConfig={gridConfig}
                      onSelect={setSelectedIds}
                      onUpdateElement={handleUpdateElement}
                      onPanDelta={handlePanDelta}
                      onMutationStart={handleMutationStart}
                      onDuplicateElement={handleDuplicateElement}
                      onRemoveElement={handleRemoveElement}
                      editingGroupId={editingGroupId}
                      onEnterGroupEdit={handleEnterGroupEdit}
                      onExitGroupEdit={handleExitGroupEdit}
                      onDropImage={handleDropImage}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right properties panel — always visible when a page is loaded */}
            {currentPage && (
              <div className="w-64 shrink-0 flex flex-col overflow-hidden bg-slate-950 border-l border-slate-800">
                {selectedElement ? (
                  <>
                    {/* Header */}
                    <div className="shrink-0 px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Propriedades</p>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">
                          {ELEMENT_DISPLAY_NAMES[selectedElement.type] ?? selectedElement.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                        title="Fechar"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Properties panel - flex-1 scrollable */}
                    <ElementPropertiesPanel
                      element={selectedElement}
                      onUpdate={handleUpdateSelectedElement}
                      onDecompose={handleDecomposePage}
                    />

                    {/* Ungroup button (when grouped) */}
                    {selectedElement.groupId && (
                      <div className="shrink-0 border-t border-slate-800 px-3 py-2">
                        <button
                          type="button"
                          onClick={handleUngroupSelected}
                          className="w-full text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1.5 transition-colors"
                        >
                          Desagrupar
                        </button>
                      </div>
                    )}
                  </>
                ) : selectedGroupId ? (
                  <div className="flex flex-col h-full">
                    <div className="shrink-0 px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Grupo</p>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedIds.length} elementos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                        title="Fechar"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <Layers size={24} className="text-indigo-400 opacity-60" />
                      <button
                        type="button"
                        onClick={handleUngroupSelected}
                        className="w-full text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 transition-colors"
                      >
                        Desagrupar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="shrink-0 px-3 py-2.5 border-b border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Página</p>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5">{currentPage?.label}</p>
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBgPanel(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors group"
                      >
                        <div
                          className="w-5 h-5 rounded-md border border-slate-600 shrink-0"
                          style={{
                            background: currentPage.background.gradient
                              ? currentPage.background.gradient
                              : currentPage.background.imageUrl
                              ? `url(${parseBackgroundImageUrl(currentPage.background.imageUrl).url}) center/cover`
                              : (currentPage.background.color ?? '#ffffff'),
                          }}
                        />
                        <span className="text-xs text-slate-400 group-hover:text-slate-200 flex-1 text-left">Fundo</span>
                        <Palette size={11} className="text-slate-600 group-hover:text-indigo-400" />
                      </button>

                      {/* Orientation buttons */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { const id = currentPageRef.current?.id; if (!id) return; pushToHistory(); setIsDirty(true); updateCanvasPage(id, { orientation: 'portrait' }); }}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border transition-colors',
                            (currentPage?.orientation ?? 'portrait') === 'portrait'
                              ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                              : 'border-slate-700 text-slate-500 hover:text-slate-300'
                          )}
                        >
                          <PortraitIcon /> Retrato
                        </button>
                        <button
                          type="button"
                          onClick={() => { const id = currentPageRef.current?.id; if (!id) return; pushToHistory(); setIsDirty(true); updateCanvasPage(id, { orientation: 'landscape' }); }}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border transition-colors',
                            currentPage?.orientation === 'landscape'
                              ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                              : 'border-slate-700 text-slate-500 hover:text-slate-300'
                          )}
                        >
                          <LandscapeIcon /> Paisagem
                        </button>
                      </div>

                      {/* Decompose / Restore */}
                      {!isPageDecomposed && currentPage?.elements.some(e => e.type === 'page-technical') && (
                        <button
                          type="button"
                          onClick={handleDecomposePage}
                          className="w-full text-xs text-violet-400 hover:bg-violet-400/10 border border-violet-400/30 rounded px-2 py-1.5 transition-colors"
                        >
                          Decompor em blocos
                        </button>
                      )}
                      {isPageDecomposed && (
                        <button
                          type="button"
                          onClick={handleRestorePage}
                          className="w-full text-xs text-amber-400 hover:bg-amber-400/10 border border-amber-400/30 rounded px-2 py-1.5 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw size={11} /> Restaurar padrão
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drag overlay ghost — aria-hidden: purely decorative, excluded from AT */}
            <DragOverlay dropAnimation={null}>
              {activeDragType && (() => {
                const meta = DRAG_GHOST_META[activeDragType as CanvasElementType] ?? { label: activeDragType, icon: '◻' };
                return (
                  <div
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      background: 'rgba(99,102,241,0.95)',
                      border: '1.5px solid rgba(129,140,248,0.8)',
                      borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </div>
                );
              })()}
            </DragOverlay>
          </div>

          {showSaveDialog && (
            <SaveTemplateDialog
              onSave={(name) => {
                saveCurrentAsTemplate(name);
                saveVersion(effectiveLayoutRef.current, true);
                setShowSaveDialog(false);
                setIsDirty(false);
                showToast('Template salvo com sucesso!');
              }}
              onCancel={() => setShowSaveDialog(false)}
            />
          )}

          {/* Toast */}
          {toast && (
            <div
              style={{
                position: 'absolute',
                // bottom:60 clears the PageNavigatorBar pill (bottom:16, ~36px tall)
                // with a comfortable gap, preventing visual overlap of toast text.
                bottom: 60,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: 12,
                padding: '8px 16px',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                zIndex: 9999,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {toast}
            </div>
          )}
        </DndContext>
      )}

      {/* ── PREVIEW MODE ─────────────────────────────────────────────────── */}
      {viewMode === 'preview' && (
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
          <ProposalDocumentPreview />
        </div>
      )}

      {/* Import media dialog */}
      {showImportMedia && (
        <ImportMediaDialog
          onConfirmElement={handleImportConfirm}
          onConfirmPages={handleImportAsPages}
          onClose={() => setShowImportMedia(false)}
        />
      )}

      {/* Page background editor modal */}
      {showBgPanel && currentPage && (
        <PageBackgroundPanel
          page={currentPage}
          onUpdate={handleBgUpdate}
          onClose={handleCloseBgPanel}
        />
      )}

      {/* Version history modal */}
      {showVersionHistory && (
        <VersionHistoryPanel
          onRestore={(layout) => {
            // Snapshot the current state before restoring so the user can Ctrl+Z
            // back to where they were if the restored version isn't what they wanted.
            pushToHistory();
            applyTemplate(layout);
            setShowVersionHistory(false);
            setIsDirty(false);
          }}
          onClose={() => setShowVersionHistory(false)}
          onSaveManual={() => {
            // Use ref to always save the current layout, not the one captured at render.
            saveVersion(effectiveLayoutRef.current, true);
          }}
        />
      )}

    </div>
  );
};
