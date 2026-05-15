import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { FileText, LayoutTemplate, Save, Layers, Grid3x3, Magnet, Target, PanelLeft, LayoutList, RotateCcw, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, FileDown, History, FileImage, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportMediaDialog } from './proposal/engine/ImportMediaDialog';

import { ProposalDocumentPreview } from './proposal/ProposalDocumentPreview';
import { ProposalBlockedScreen } from './proposal/ProposalBlockedScreen';
import { ProposalTemplateGallery } from './proposal/ProposalTemplateGallery';
import { ElementPalette } from './proposal/engine/ElementPalette';
import { ElementPropertiesPanel } from './proposal/engine/ElementPropertiesPanel';
import { LayersPanel } from './proposal/engine/LayersPanel';
import { CanvasPage } from './proposal/engine/CanvasPage';
import { useAutosave } from './proposal/engine/useAutosave';
import { VersionHistoryPanel } from './proposal/engine/VersionHistoryPanel';
import { PageBackgroundPanel } from './proposal/engine/PageBackgroundPanel';
import { PageNavigatorBar } from './proposal/engine/PageNavigatorBar';
import { CLASSIC_TEMPLATE } from './proposal/engine/templates/classicTemplate';
import { TECHNICAL_PAGE_ELEMENTS } from './proposal/engine/templates/technicalPageDecomposed';
import type { CanvasElement, CanvasPage as CanvasPageType, GridConfig, CanvasElementType } from './proposal/engine/types';
import type { PdfPageResult } from './proposal/engine/ImportMediaDialog';
type CanvasPageSnapshot = CanvasPageType[];
import { A4_WIDTH, A4_HEIGHT, DEFAULT_ELEMENT_PROPS, DEFAULT_GRID_CONFIG, parseBackgroundImageUrl } from './proposal/engine/types';

type ViewMode = 'templates' | 'editor' | 'preview';

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0];

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
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-80">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">Salvar como template</h3>
        <p className="text-xs text-slate-400 mb-4">Este layout ficará disponível na galeria de templates.</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(name); if (e.key === 'Escape') onCancel(); }}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Nome do template"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs transition-colors">Cancelar</button>
          <button onClick={() => onSave(name)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export const ProposalCanvasView: React.FC = () => {
  const projectStatus   = useSolarStore((s) => s.project.projectStatus);
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);

  const activeLayout = useSolarStore((s) => s.proposalData.activeLayout);

  // Action functions are created once at slice init — stable references, no subscription needed.
  const {
    addCanvasElement, batchAddCanvasElements, updateCanvasElement, updateCanvasPage,
    removeCanvasElement, addCanvasPage, batchAddCanvasPages, removeCanvasPage,
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
  const [sidebarTab, setSidebarTab]         = useState<'elements' | 'layers'>('elements');
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  // renamingPageLabel removed — draft label now lives inside PageNavigatorBar.
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

  const updateGrid = (patch: Partial<GridConfig>) =>
    setGridConfig((prev) => ({ ...prev, ...patch }));

  const canvasAreaRef   = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const lastHistoryPushRef  = useRef<number>(0);
  const [fitScale, setFitScale]       = useState(0.6);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const canvasScale = manualScale ?? fitScale;
  // Shadow fitScale in a ref so the wheel listener always reads the latest value
  // without needing fitScale in its dependency array (avoids re-registration on every resize).
  const fitScaleRef = useRef(fitScale);
  useEffect(() => { fitScaleRef.current = fitScale; }, [fitScale]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Compute the effective layout and pages
  const effectiveLayout = activeLayout ?? CLASSIC_TEMPLATE;
  const pages           = effectiveLayout.pages;
  const safePageIdx     = Math.min(canvasPageIdx, pages.length - 1);
  const currentPage     = pages[safePageIdx] ?? null;
  const currentPageId   = currentPage?.id ?? '';

  // Autosave + version history
  const { saveVersion } = useAutosave(
    effectiveLayout,
    isDirty,
    (layout) => { applyTemplate(layout); setIsDirty(false); },
  );

  // Selected element object (single element)
  const selectedElement = selectedIds.length === 1
    ? currentPage?.elements.find((el) => el.id === selectedIds[0]) ?? null
    : null;

  // A group is selected only when ALL selected elements share the same groupId.
  // Memoized to avoid O(n × selectedIds) find() on every render (runs on every drag frame).
  const selectedGroupId = useMemo(() => {
    if (selectedIds.length < 2 || !currentPage) return null;
    const groupIds = selectedIds.map(
      (id) => currentPage.elements.find((e) => e.id === id)?.groupId ?? null,
    );
    const first = groupIds[0];
    return first && groupIds.every((g) => g === first) ? first : null;
  }, [selectedIds, currentPage]);

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

  const MAX_HISTORY = 50;

  const pushToHistory = useCallback(() => {
    setUndoStack((prev) => {
      const next = [...prev, effectiveLayout.pages];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, [effectiveLayout]);

  const showToast = useCallback((message: string, duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const showDeleteToast = useCallback((count: number) => {
    showToast(`${count} elemento${count !== 1 ? 's' : ''} excluído${count !== 1 ? 's' : ''} • Ctrl+Z para desfazer`, 3500);
  }, [showToast]);

  useEffect(() => {
    if (!isDirty || viewMode !== 'editor') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, viewMode]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [effectiveLayout.pages, ...r.slice(0, 29)]);
    setUndoStack((s) => s.slice(0, -1));
    applyTemplate({ ...effectiveLayout, pages: prev });
  }, [undoStack, effectiveLayout, applyTemplate]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((s) => [...s.slice(-29), effectiveLayout.pages]);
    setRedoStack((r) => r.slice(1));
    applyTemplate({ ...effectiveLayout, pages: next });
  }, [redoStack, effectiveLayout, applyTemplate]);

  // Keyboard shortcuts (Delete/Backspace = excluir seleção, Escape = desselecionar)
  useEffect(() => {
    if (viewMode !== 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return; }

      // Ctrl+A — select all non-page-block visible elements
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const allIds = currentPage?.elements
          .filter((el) => !el.type.startsWith('page-') && el.visible)
          .map((el) => el.id) ?? [];
        setSelectedIds(allIds);
        return;
      }

      // Ctrl+D — duplicate selected element(s)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedIds.length === 0 || !currentPage) return;
        pushToHistory();
        const ts = Date.now();
        const newIds: string[] = [];
        selectedIds.forEach((id, idx) => {
          const el = currentPage.elements.find((e) => e.id === id);
          if (!el || el.locked) return;
          const newEl = {
            ...el,
            id: `${el.id}-dup-${ts}-${idx}`,
            x: Math.min(el.x + 16, A4_WIDTH - el.width),
            y: Math.min(el.y + 16, A4_HEIGHT - el.height),
            zIndex: el.zIndex + 1,
            groupId: undefined,
          };
          addCanvasElement(currentPage.id, newEl);
          newIds.push(newEl.id);
        });
        setSelectedIds(newIds);
        return;
      }

      // Arrow Left/Right — navigate pages when no element is selected
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selectedIds.length === 0 && !renamingPageId) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') setCanvasPageIdx((i) => Math.max(0, i - 1));
        else                       setCanvasPageIdx((i) => Math.min(pages.length - 1, i + 1));
        // selectedIds is already [] per the guard above — no-op setSelectedIds omitted
        return;
      }

      // Arrow keys — nudge selected elements
      const NUDGE = e.shiftKey ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0 && currentPage) {
        e.preventDefault();
        pushToHistory();
        selectedIds.forEach((id) => {
          const el = currentPage.elements.find((e) => e.id === id);
          if (!el || el.locked) return;
          const dx = e.key === 'ArrowLeft' ? -NUDGE : e.key === 'ArrowRight' ? NUDGE : 0;
          const dy = e.key === 'ArrowUp'   ? -NUDGE : e.key === 'ArrowDown'  ? NUDGE : 0;
          updateCanvasElement(currentPage.id, id, {
            x: Math.max(0, Math.min(A4_WIDTH  - el.width,  el.x + dx)),
            y: Math.max(0, Math.min(A4_HEIGHT - el.height, el.y + dy)),
          });
        });
        return;
      }

      // Ctrl+C — copy selected elements to clipboard
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentPage || selectedIds.length === 0) return;
        const toCopy = selectedIds
          .map(id => currentPage.elements.find(el => el.id === id))
          .filter(Boolean) as CanvasElement[];
        // Strip groupId so pasted elements aren't accidentally in a group
        setClipboard(toCopy.map(el => ({ ...el, groupId: undefined })));
        return;
      }

      // Ctrl+V — paste elements from clipboard
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentPage || clipboard.length === 0) return;
        pushToHistory();
        const ts = Date.now();
        const newIds: string[] = [];
        clipboard.forEach((el, idx) => {
          const newEl: CanvasElement = {
            ...el,
            id: `${el.id}-paste-${ts}-${idx}`,
            x: Math.min(el.x + 16, A4_WIDTH - el.width),
            y: Math.min(el.y + 16, A4_HEIGHT - el.height),
            zIndex: el.zIndex + 1,
          };
          addCanvasElement(currentPage.id, newEl);
          newIds.push(newEl.id);
        });
        setSelectedIds(newIds);
        return;
      }

      if (e.key === 'Escape') {
        if (editingGroupId && currentPage) {
          // Sai do modo de edição e restaura seleção do grupo
          const groupMembers = currentPage.elements
            .filter((el) => el.groupId === editingGroupId)
            .map((el) => el.id);
          setSelectedIds(groupMembers);
          setEditingGroupId(null);
        } else {
          setSelectedIds([]);
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && currentPage) {
        pushToHistory();
        const count = selectedIds.length;
        selectedIds.forEach((id) => removeCanvasElement(currentPage.id, id));
        setSelectedIds([]);
        showDeleteToast(count);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewMode, selectedIds, clipboard, currentPage, renamingPageId, pages.length, removeCanvasElement, handleUndo, handleRedo, pushToHistory, addCanvasElement, updateCanvasElement, showDeleteToast, editingGroupId]);

  const isApproved = projectStatus === 'approved';

  if (!isApproved) {
    return (
      <ProposalBlockedScreen
        onGoToProjection={() => setFocusedBlock('projection')}
        onNavigate={(block) => setFocusedBlock(block)}
      />
    );
  }

  // ─── DnD handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.fromPalette && !data.isPreset) setActiveDragType(String(data.elementType));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragType(null);
    const { active, over, delta } = event;
    const data = active.data.current;

    if (!data?.fromPalette || !over || !currentPage) return;

    // Compute drop position relative to the A4 canvas
    const canvasEl = document.getElementById(`canvas-drop-${currentPage.id}`);
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const activatorEvent = event.activatorEvent as PointerEvent;
    const finalX = activatorEvent.clientX + delta.x;
    const finalY = activatorEvent.clientY + delta.y;

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
      setIsDirty(true);
      pushToHistory();
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
      return;
    }

    // ── Elemento único ─────────────────────────────────────────────────────────
    setIsDirty(true);
    pushToHistory();
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
  }, [currentPage, canvasScale, gridConfig, addCanvasElement, batchAddCanvasElements, pushToHistory]);

  // ─── Page management ───────────────────────────────────────────────────────

  const handleAddPage = useCallback(() => {
    setIsDirty(true);
    if (!activeLayout) {
      // applyTemplate mutates Zustand but the closure still sees null — let re-render happen
      applyTemplate(CLASSIC_TEMPLATE);
      return;
    }
    const newPage: CanvasPageType = {
      id: `p-${Date.now()}`,
      label: `Página ${pages.length + 1}`,
      background: { color: '#ffffff' },
      elements: [],
    };
    addCanvasPage(newPage);
    setCanvasPageIdx(pages.length);
    setSelectedIds([]);
  }, [activeLayout, applyTemplate, addCanvasPage, pages.length]);

  const handleRemovePage = useCallback((pageId: string) => {
    if (pages.length <= 1) return;
    setIsDirty(true);
    removeCanvasPage(pageId);
    setCanvasPageIdx((prev) => Math.min(prev, pages.length - 2));
    setSelectedIds([]);
  // pages.length instead of pages: we no longer index into the array (we have the ID directly),
  // and this produces a more stable memoization (array ref changes every store update).
  }, [pages.length, removeCanvasPage]);

  const handleDuplicatePage = useCallback((pageId: string) => {
    if (!activeLayout) {
      applyTemplate(CLASSIC_TEMPLATE);
      return; // re-render will have a layout; user clicks again
    }
    const src = activeLayout.pages.find((p) => p.id === pageId);
    if (!src) return;
    const ts = Date.now();
    const newPage = {
      ...src,
      id: `page-dup-${ts}`,
      label: `${src.label} (cópia)`,
      elements: src.elements.map((el, i) => ({ ...el, id: `${el.id}-dup-${ts}-${i}` })),
    };
    setIsDirty(true);
    addCanvasPage(newPage);
    setCanvasPageIdx(pages.length); // navigate to the newly appended duplicate
  }, [activeLayout, addCanvasPage, pages.length]);

  const handleRenamePage = useCallback((pageId: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return; // child guards via fallback, but defence-in-depth against empty labels
    pushToHistory();
    setIsDirty(true);
    updateCanvasPage(pageId, { label: trimmed });
  }, [pushToHistory, updateCanvasPage]);

  // ─── Element handlers ──────────────────────────────────────────────────────

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!currentPage) return;
    setIsDirty(true);
    // Pre-drag snapshot already pushed by onMutationStart — skip during the drag stroke.
    if (!isMutatingRef.current) {
      const now = Date.now();
      if (now - lastHistoryPushRef.current > 500) {
        pushToHistory();
        lastHistoryPushRef.current = now;
      }
    }
    updateCanvasElement(currentPage.id, elementId, updates);
  }, [currentPage, updateCanvasElement, pushToHistory]);

  const handleRemoveElement = useCallback((elementId: string) => {
    if (!currentPage) return;
    setIsDirty(true);
    pushToHistory();
    removeCanvasElement(currentPage.id, elementId);
    if (selectedIds.includes(elementId)) setSelectedIds(selectedIds.filter(id => id !== elementId));
  }, [currentPage, removeCanvasElement, selectedIds, pushToHistory]);

  // ─── Group handlers ────────────────────────────────────────────────────────

  const handleGroupSelected = useCallback(() => {
    if (!currentPage || selectedIds.length < 2) return;
    if (!activeLayout) {
      applyTemplate(CLASSIC_TEMPLATE);
      return;
    }
    const newGroupId = `grp-${Date.now()}`;
    const elements = currentPage.elements.map((el) =>
      selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el
    );
    updateCanvasPage(currentPage.id, { elements });
  }, [currentPage, selectedIds, activeLayout, applyTemplate, updateCanvasPage]);

  const handleUngroupSelected = useCallback(() => {
    if (!currentPage) return;
    const elements = currentPage.elements.map((el) =>
      selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el
    );
    updateCanvasPage(currentPage.id, { elements });
    setSelectedIds([]);
  }, [currentPage, selectedIds, updateCanvasPage]);

  // ─── Decompose / Restore page handlers ─────────────────────────────────────

  const handleDecomposePage = useCallback(() => {
    if (!currentPage) return;
    const pageTechEl = currentPage.elements.find((e) => e.type === 'page-technical');
    if (pageTechEl) removeCanvasElement(currentPage.id, pageTechEl.id);
    // Unique IDs per session timestamp + index; single set() via batch
    const ts = Date.now();
    batchAddCanvasElements(
      currentPage.id,
      TECHNICAL_PAGE_ELEMENTS.map((el, i) => ({ ...el, id: `${el.id}-${ts}-${i}` })),
    );
    setSelectedIds([]);
  }, [currentPage, removeCanvasElement, batchAddCanvasElements]);

  const handleRestorePage = useCallback(() => {
    if (!currentPage || !activeLayout) return;
    // Clear all elements and restore the canonical page-technical block in one mutation
    updateCanvasPage(currentPage.id, {
      elements: [{
        id: `classic-p0-main-${Date.now()}`,
        type: 'page-technical',
        x: 0, y: 0, width: 794, height: 1123,
        zIndex: 0, locked: true, visible: true, props: {},
      }],
    });
    setSelectedIds([]);
  }, [currentPage, activeLayout, updateCanvasPage]);

  // Stable pan callback — must be memoised so CanvasPage's space-key useEffect
  // doesn't re-register listeners on every parent render.
  const handlePanDelta = useCallback((dx: number, dy: number) => {
    canvasScrollRef.current?.scrollBy({ left: -dx, top: -dy });
  }, []);

  // ─── Zoom controls ────────────────────────────────────────────────────────────

  const handleZoomIn  = useCallback(() => {
    setManualScale((prev) => computeNextZoom(prev, fitScale, 'in'));
  }, [fitScale]);

  const handleZoomOut = useCallback(() => {
    setManualScale((prev) => computeNextZoom(prev, fitScale, 'out'));
  }, [fitScale]);

  const handleZoomFit = useCallback(() => setManualScale(null), []);

  // Export: switch to preview (which mounts ProposalDocumentPreview), then fire window.print()
  // ProposalDocumentPreview listens to isExportingPdf in the store and calls window.print() itself.
  const handleExportPdf = useCallback(() => {
    pendingPrintRef.current = true;
    setViewMode('preview');
  }, []);

  // When preview mode becomes active with a pending print, fire after mount delay
  useEffect(() => {
    if (viewMode !== 'preview' || !pendingPrintRef.current) return;
    pendingPrintRef.current = false;
    const timer = setTimeout(() => setExportingPdf(true), 400);
    return () => clearTimeout(timer);
  }, [viewMode, setExportingPdf]);

  // ── Import: imagem ou única página de PDF → elemento no canvas ───────────
  const handleImportConfirm = useCallback((dataUrl: string) => {
    if (!currentPage) return;
    setIsDirty(true);
    pushToHistory();
    const newEl = createImageElement(dataUrl, 197, 311, (currentPage.elements.length + 1) * 10);
    addCanvasElement(currentPage.id, newEl);
    setSelectedIds([newEl.id]);
    setShowImportMedia(false);
  }, [currentPage, pushToHistory, addCanvasElement]);

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

    setCanvasPageIdx(pages.length);
    setSelectedIds([]);
    setShowImportMedia(false);
  }, [pages.length, batchAddCanvasPages, pushToHistory]);

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

  // CHANGE 4 — Alignment handler
  const handleAlign = useCallback((direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'distribute-h' | 'distribute-v') => {
    if (!currentPage || selectedIds.length < 2) return;
    pushToHistory();
    const els = currentPage.elements.filter((e) => selectedIds.includes(e.id) && !e.locked);
    if (els.length < 2) return;

    const minX    = Math.min(...els.map((e) => e.x));
    const maxX    = Math.max(...els.map((e) => e.x + e.width));
    const minY    = Math.min(...els.map((e) => e.y));
    const maxY    = Math.max(...els.map((e) => e.y + e.height));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    if (direction === 'distribute-h') {
      const sorted = [...els].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + e.width, 0);
      const gap = (maxX - minX - totalW) / (sorted.length - 1);
      let cursor = minX;
      sorted.forEach((el) => {
        updateCanvasElement(currentPageId, el.id, { x: Math.round(cursor) });
        cursor += el.width + gap;
      });
      return;
    }
    if (direction === 'distribute-v') {
      const sorted = [...els].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + e.height, 0);
      const gap = (maxY - minY - totalH) / (sorted.length - 1);
      let cursor = minY;
      sorted.forEach((el) => {
        updateCanvasElement(currentPageId, el.id, { y: Math.round(cursor) });
        cursor += el.height + gap;
      });
      return;
    }

    els.forEach((el) => {
      const updates: Partial<CanvasElement> = {};
      if (direction === 'left')     updates.x = minX;
      if (direction === 'right')    updates.x = maxX - el.width;
      if (direction === 'center-h') updates.x = Math.round(centerX - el.width / 2);
      if (direction === 'top')      updates.y = minY;
      if (direction === 'bottom')   updates.y = maxY - el.height;
      if (direction === 'center-v') updates.y = Math.round(centerY - el.height / 2);
      updateCanvasElement(currentPageId, el.id, updates);
    });
  }, [currentPage, currentPageId, selectedIds, pushToHistory, updateCanvasElement]);

  const isPageDecomposed = useMemo(
    () => currentPage ? !currentPage.elements.some((e) => e.type === 'page-technical') : false,
    [currentPage],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden relative">

      {/* Top Mode Switcher */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 flex items-center gap-1 px-4 py-1.5 justify-between">
        <div className="flex items-center gap-1">
            {([
            { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={13} /> },
            { id: 'editor',    label: 'Editor',    icon: <Layers size={13} /> },
            { id: 'preview',   label: 'Prévia',    icon: <FileText size={13} /> },
          ] as { id: ViewMode; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
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
              {tab.id === 'editor' && isDirty && viewMode === 'editor' && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" title="Alterações não salvas" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          {viewMode === 'editor' && (
            <>
              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-1.5 rounded-md text-indigo-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Histórico de versões"
              >
                <History size={14} />
              </button>
              <button
                onClick={() => setShowImportMedia(true)}
                className="p-1.5 rounded-md text-violet-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Importar imagem ou página de PDF"
              >
                <FileImage size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
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
                  onClick={() => setSidebarTab('elements')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors',
                    sidebarTab === 'elements'
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  <PanelLeft size={12} />
                  Elementos
                </button>
                <button
                  onClick={() => setSidebarTab('layers')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors',
                    sidebarTab === 'layers'
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  <LayoutList size={12} />
                  Camadas
                </button>
              </div>

              {/* Content — always show palette or layers */}
              {sidebarTab === 'elements'
                ? <ElementPalette hasCustomLayout={!!activeLayout} />
                : <LayersPanel
                    elements={currentPage?.elements ?? []}
                    selectedIds={selectedIds}
                    onSelect={(ids) => setSelectedIds(ids)}
                    onUpdate={handleUpdateElement}
                    onRemove={handleRemoveElement}
                    onReorderElements={(orderedIds) => {
                      if (!currentPage) return;
                      const total = orderedIds.length;
                      const zMap = new Map(orderedIds.map((id, i) => [id, (total - i) * 10]));
                      const elements = currentPage.elements.map((el) =>
                        zMap.has(el.id) ? { ...el, zIndex: zMap.get(el.id)! } : el
                      );
                      updateCanvasPage(currentPage.id, { elements });
                    }}
                  />
              }

            </div>

            {/* Canvas area */}
            <div ref={canvasAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-900/80 relative">
              {/* Canvas toolbar — clean single line */}
              <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800 gap-3">

                {/* Grid controls */}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1">
                  <button
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
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    title="Desfazer (Ctrl+Z)"
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Undo2 size={12} />
                  </button>
                  <button
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
                    onClick={handleZoomOut}
                    title="Diminuir zoom (Ctrl+−)"
                    disabled={canvasScale <= 0.25}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <ZoomOut size={12} />
                  </button>

                  <button
                    onClick={handleZoomFit}
                    className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded font-mono tabular-nums min-w-[3rem] text-center transition-colors"
                    title="Ajustar à tela"
                  >
                    {Math.round(canvasScale * 100)}%
                  </button>

                  <button
                    onClick={handleZoomIn}
                    title="Aumentar zoom (Ctrl++)"
                    disabled={canvasScale >= 2.0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                  >
                    <ZoomIn size={12} />
                  </button>

                  <div className="w-px h-4 bg-slate-700 mx-0.5" />

                  <button
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
                <div style={{
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
                    <button onClick={handleGroupSelected}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-400 hover:bg-slate-800 transition-colors font-medium"
                      title="Agrupar seleção">
                      <Layers size={12} /> {selectedIds.length}
                    </button>
                  )}
                  <div style={{ width: 1, height: 16, background: '#334155', margin: '0 2px' }} />
                  <button onClick={() => handleAlign('left')} title="Alinhar à esquerda" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignStartVertical size={13} /></button>
                  <button onClick={() => handleAlign('center-h')} title="Centralizar horizontalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignCenterVertical size={13} /></button>
                  <button onClick={() => handleAlign('right')} title="Alinhar à direita" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignEndVertical size={13} /></button>
                  <div style={{ width: 1, height: 16, background: '#334155', margin: '0 2px' }} />
                  <button onClick={() => handleAlign('top')} title="Alinhar ao topo" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignStartHorizontal size={13} /></button>
                  <button onClick={() => handleAlign('center-v')} title="Centralizar verticalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignCenterHorizontal size={13} /></button>
                  <button onClick={() => handleAlign('bottom')} title="Alinhar ao fundo" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignEndHorizontal size={13} /></button>
                  {selectedIds.length >= 3 && (
                    <>
                      <div style={{ width: 1, height: 16, background: '#334155', margin: '0 2px' }} />
                      <button onClick={() => handleAlign('distribute-h')} title="Distribuir horizontalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignHorizontalDistributeCenter size={13} /></button>
                      <button onClick={() => handleAlign('distribute-v')} title="Distribuir verticalmente" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignVerticalDistributeCenter size={13} /></button>
                    </>
                  )}
                </div>
              )}

              {/* Floating page navigator — Figma/Canva style, bottom-center of canvas area */}
              <PageNavigatorBar
                pages={pages}
                activeIdx={safePageIdx}
                renamingPageId={renamingPageId}
                onNavigate={(idx) => { setCanvasPageIdx(idx); setSelectedIds([]); }}
                onAddPage={handleAddPage}
                onDuplicate={handleDuplicatePage}
                onRemove={handleRemovePage}
                onStartRename={(id) => setRenamingPageId(id)}
                onCommitRename={(id, label) => { handleRenamePage(id, label); setRenamingPageId(null); }}
                onCancelRename={() => setRenamingPageId(null)}
              />

              {/* A4 Canvas */}
              <div
                ref={canvasScrollRef}
                className="flex-1 overflow-auto flex items-start justify-center p-8 custom-scrollbar"
                onClick={() => setSelectedIds([])}
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
                      onSelect={(ids) => setSelectedIds(ids)}
                      onUpdateElement={handleUpdateElement}
                      onPanDelta={handlePanDelta}
                      onMutationStart={() => {
                        isMutatingRef.current = true;
                        pushToHistory();
                        lastHistoryPushRef.current = Date.now();
                        // Defer reset so the synchronous drag-start onUpdate is still
                        // suppressed, but subsequent independent edits are not.
                        setTimeout(() => { isMutatingRef.current = false; }, 0);
                        setIsDirty(true);
                      }}
                      onDuplicateElement={(elementId) => {
                        if (!currentPage) return;
                        const el = currentPage.elements.find((e) => e.id === elementId);
                        if (!el || el.locked) return;
                        pushToHistory();
                        setIsDirty(true);
                        const ts = Date.now();
                        const newEl: CanvasElement = {
                          ...el,
                          id: `${el.id}-dup-${ts}`,
                          x: Math.min(el.x + 16, A4_WIDTH - el.width),
                          y: Math.min(el.y + 16, A4_HEIGHT - el.height),
                          zIndex: el.zIndex + 1,
                          groupId: undefined,
                        };
                        addCanvasElement(currentPage.id, newEl);
                        setSelectedIds([newEl.id]);
                      }}
                      onRemoveElement={handleRemoveElement}
                      editingGroupId={editingGroupId}
                      onEnterGroupEdit={(groupId: string, elementId: string) => {
                        setEditingGroupId(groupId);
                        setSelectedIds([elementId]);
                      }}
                      onExitGroupEdit={() => {
                        setEditingGroupId(null);
                      }}
                      onDropImage={({ url, x, y }) => {
                        if (!currentPage) return;
                        setIsDirty(true);
                        pushToHistory();
                        const clampedX = Math.max(0, Math.min(A4_WIDTH - 200, x - 100));
                        const clampedY = Math.max(0, Math.min(A4_HEIGHT - 150, y - 75));
                        const newEl = createImageElement(url, clampedX, clampedY, (currentPage.elements.length + 1) * 10);
                        addCanvasElement(currentPage.id, newEl);
                        setSelectedIds([newEl.id]);
                      }}
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
                      onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                      onDecompose={handleDecomposePage}
                    />

                    {/* Ungroup button (when grouped) */}
                    {selectedElement.groupId && (
                      <div className="shrink-0 border-t border-slate-800 px-3 py-2">
                        <button
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
                          onClick={() => updateCanvasPage(currentPage.id, { orientation: 'portrait' })}
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
                          onClick={() => updateCanvasPage(currentPage.id, { orientation: 'landscape' })}
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
                          onClick={handleDecomposePage}
                          className="w-full text-xs text-violet-400 hover:bg-violet-400/10 border border-violet-400/30 rounded px-2 py-1.5 transition-colors"
                        >
                          Decompor em blocos
                        </button>
                      )}
                      {isPageDecomposed && (
                        <button
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

            {/* Drag overlay ghost */}
            <DragOverlay dropAnimation={null}>
              {activeDragType && (() => {
                const meta = DRAG_GHOST_META[activeDragType as CanvasElementType] ?? { label: activeDragType, icon: '◻' };
                return (
                  <div
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
                saveVersion(effectiveLayout, true);
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
                bottom: 24,
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
          onUpdate={(bg) => {
            updateCanvasPage(currentPage.id, { background: bg });
            pushToHistory();
          }}
          onClose={() => setShowBgPanel(false)}
        />
      )}

      {/* Version history modal */}
      {showVersionHistory && (
        <VersionHistoryPanel
          onRestore={(layout) => {
            applyTemplate(layout);
            setShowVersionHistory(false);
            setIsDirty(false);
          }}
          onClose={() => setShowVersionHistory(false)}
          onSaveManual={() => {
            saveVersion(effectiveLayout, true);
          }}
        />
      )}

    </div>
  );
};
