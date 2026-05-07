import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { FileText, LayoutTemplate, Pencil, Save, Layers, ChevronLeft, ChevronRight, Plus, Trash2, Grid3x3, Magnet, Target, PanelLeft, LayoutList, RotateCcw, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Copy, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ProposalDocumentPreview } from './proposal/ProposalDocumentPreview';
import { ProposalBlockedScreen } from './proposal/ProposalBlockedScreen';
import { ProposalTemplateGallery } from './proposal/ProposalTemplateGallery';
import { ElementPalette } from './proposal/engine/ElementPalette';
import { ElementPropertiesPanel } from './proposal/engine/ElementPropertiesPanel';
import { LayersPanel } from './proposal/engine/LayersPanel';
import { CanvasPage } from './proposal/engine/CanvasPage';
import { CLASSIC_TEMPLATE } from './proposal/engine/templates/classicTemplate';
import { TECHNICAL_PAGE_ELEMENTS } from './proposal/engine/templates/technicalPageDecomposed';
import type { CanvasElement, CanvasPage as CanvasPageType, GridConfig } from './proposal/engine/types';
// CanvasPage[] is used for undo/redo history snapshots
type CanvasPageSnapshot = CanvasPageType[];
import { A4_WIDTH, A4_HEIGHT, DEFAULT_ELEMENT_PROPS, DEFAULT_GRID_CONFIG } from './proposal/engine/types';

type ViewMode = 'templates' | 'editor' | 'preview';

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0];

const DRAG_GHOST_META: Record<string, { label: string; icon: string }> = {
  'text':               { label: 'Texto',              icon: '𝐓' },
  'image':              { label: 'Imagem',              icon: '🖼' },
  'logo':               { label: 'Logo',               icon: '✦' },
  'watermark':          { label: 'Marca d\'água',       icon: '⬡' },
  'divider':            { label: 'Divisória',           icon: '—' },
  'box':                { label: 'Caixa',               icon: '▭' },
  'icon':               { label: 'Ícone',               icon: '★' },
  'placeholder':        { label: 'Campo dinâmico',      icon: '{}' },
  'kpi-box':            { label: 'KPI',                 icon: '◈' },
  'chart-generation':   { label: 'Gráfico Geração',     icon: '▦' },
  'chart-financial':    { label: 'Gráfico Financeiro',  icon: '▦' },
  'chart-irradiance':   { label: 'Gráfico Irradiância', icon: '☀' },
  'payment-table':      { label: 'Tabela Investimento', icon: '⊟' },
  'schedule-timeline':  { label: 'Cronograma',          icon: '⊞' },
  'map-static':         { label: 'Mapa',                icon: '⊙' },
};

function SaveTemplateDialog({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('Meu Template');
  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Salvar como template</h3>
        <p className="text-xs text-slate-400 mb-4">Este layout ficará disponível na galeria de templates.</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(name); if (e.key === 'Escape') onCancel(); }}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-400"
          placeholder="Nome do template"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-xs text-slate-500 px-3 py-1.5 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(name)} className="text-xs font-medium bg-slate-800 text-white px-4 py-1.5 rounded-lg hover:bg-slate-700">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export const ProposalCanvasView: React.FC = () => {
  const projectStatus   = useSolarStore((s) => s.project.projectStatus);
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);

  const activeLayout        = useSolarStore((s) => s.proposalData.activeLayout);
  const addCanvasElement    = useSolarStore((s) => s.addCanvasElement);
  const updateCanvasElement = useSolarStore((s) => s.updateCanvasElement);
  const removeCanvasElement = useSolarStore((s) => s.removeCanvasElement);
  const addCanvasPage            = useSolarStore((s) => s.addCanvasPage);
  const removeCanvasPage         = useSolarStore((s) => s.removeCanvasPage);
  const saveCurrentAsTemplate    = useSolarStore((s) => s.saveCurrentAsTemplate);
  const applyTemplate            = useSolarStore((s) => s.applyTemplate);
  const updateCanvasPageBackground = useSolarStore((s) => s.updateCanvasPageBackground);

  const [viewMode, setViewMode]             = useState<ViewMode>('preview');
  const [canvasPageIdx, setCanvasPageIdx]   = useState(0);
  const [selectedIds, setSelectedIds]       = useState<string[]>([]);
  const [clipboard, setClipboard]           = useState<CanvasElement[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [gridConfig, setGridConfig]         = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [sidebarTab, setSidebarTab]         = useState<'elements' | 'layers'>('elements');
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renamingPageLabel, setRenamingPageLabel] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('kurupira-proposal-sidebar-w');
    return saved ? Math.max(200, Math.min(420, Number(saved))) : 260;
  });
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<CanvasPageSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasPageSnapshot[]>([]);

  const updateGrid = (patch: Partial<GridConfig>) =>
    setGridConfig((prev) => ({ ...prev, ...patch }));

  const canvasAreaRef       = useRef<HTMLDivElement>(null);
  const lastHistoryPushRef  = useRef<number>(0);
  const [fitScale, setFitScale]       = useState(0.6);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const canvasScale = manualScale ?? fitScale;

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

  // Selected element object (single element)
  const selectedElement = selectedIds.length === 1
    ? currentPage?.elements.find((el) => el.id === selectedIds[0]) ?? null
    : null;

  // A group is selected only when ALL selected elements share the same groupId.
  // Using only selectedIds[0] would wrongly show "Grupo" when elements from
  // different groups are selected together via the LayersPanel.
  const selectedGroupId = (() => {
    if (selectedIds.length < 2 || !currentPage) return null;
    const groupIds = selectedIds.map(
      (id) => currentPage.elements.find((e) => e.id === id)?.groupId ?? null,
    );
    const first = groupIds[0];
    return first && groupIds.every((g) => g === first) ? first : null;
  })();

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

  const pushToHistory = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), effectiveLayout.pages]);
    setRedoStack([]);
  }, [effectiveLayout]);

  const showDeleteToast = useCallback((count: number) => {
    if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
    setDeleteToast(`${count} elemento${count !== 1 ? 's' : ''} excluído${count !== 1 ? 's' : ''} • Ctrl+Z para desfazer`);
    deleteToastTimerRef.current = setTimeout(() => setDeleteToast(null), 3500);
  }, []);

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
        setSelectedIds([]);
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
  }, [viewMode, selectedIds, clipboard, currentPage, removeCanvasElement, handleUndo, handleRedo, pushToHistory, addCanvasElement, updateCanvasElement, showDeleteToast]);

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

    // If no custom layout yet, clone classic
    if (!activeLayout) applyTemplate(CLASSIC_TEMPLATE);

    const baseZIndex = (currentPage.elements.length + 1) * 10;

    // ── Preset: adiciona múltiplos elementos de uma vez ────────────────────────
    if (data.isPreset) {
      pushToHistory();
      type PresetDef = { type: CanvasElement['type']; dx: number; dy: number; width: number; height: number; zIndex: number; groupId?: string; props: Record<string, unknown> };
      const defs = (data.presetElements as PresetDef[]) ?? [];
      defs.forEach((def, i) => {
        const el: CanvasElement = {
          id:      `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
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
        };
        addCanvasElement(currentPage.id, el);
      });
      return;
    }

    // ── Elemento único ─────────────────────────────────────────────────────────
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
  }, [currentPage, canvasScale, gridConfig, activeLayout, applyTemplate, addCanvasElement, pushToHistory]);

  // ─── Page management ───────────────────────────────────────────────────────

  const handleAddPage = useCallback(() => {
    if (!activeLayout) applyTemplate(CLASSIC_TEMPLATE);
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

  const handleRemovePage = useCallback((idx: number) => {
    if (pages.length <= 1) return;
    removeCanvasPage(pages[idx].id);
    setCanvasPageIdx((prev) => Math.min(prev, pages.length - 2));
    setSelectedIds([]);
  }, [pages, removeCanvasPage]);

  const handleDuplicatePage = useCallback((pageId: string) => {
    const layout = activeLayout;
    if (!layout) return;
    const src = layout.pages.find((p) => p.id === pageId);
    if (!src) return;
    const ts = Date.now();
    const newPage = {
      ...src,
      id: `page-dup-${ts}`,
      label: `${src.label} (cópia)`,
      elements: src.elements.map((el, i) => ({ ...el, id: `${el.id}-dup-${ts}-${i}` })),
    };
    addCanvasPage(newPage);
  }, [activeLayout, addCanvasPage]);

  const handleRenamePage = useCallback((pageId: string, newLabel: string) => {
    const layout = activeLayout;
    if (!layout) return;
    applyTemplate({
      ...layout,
      pages: layout.pages.map((p) => p.id === pageId ? { ...p, label: newLabel } : p),
    });
  }, [activeLayout, applyTemplate]);

  // ─── Element handlers ──────────────────────────────────────────────────────

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!currentPage) return;
    const now = Date.now();
    if (now - lastHistoryPushRef.current > 500) {
      pushToHistory();
      lastHistoryPushRef.current = now;
    }
    updateCanvasElement(currentPage.id, elementId, updates);
  }, [currentPage, updateCanvasElement, pushToHistory]);

  const handleRemoveElement = useCallback((elementId: string) => {
    if (!currentPage) return;
    pushToHistory();
    removeCanvasElement(currentPage.id, elementId);
    if (selectedIds.includes(elementId)) setSelectedIds(selectedIds.filter(id => id !== elementId));
  }, [currentPage, removeCanvasElement, selectedIds, pushToHistory]);

  // ─── Group handlers ────────────────────────────────────────────────────────

  const handleGroupSelected = useCallback(() => {
    if (!currentPage || selectedIds.length < 2) return;
    if (!activeLayout) applyTemplate(CLASSIC_TEMPLATE);
    const newGroupId = `grp-${Date.now()}`;
    selectedIds.forEach((id) => updateCanvasElement(currentPage.id, id, { groupId: newGroupId }));
  }, [currentPage, selectedIds, activeLayout, applyTemplate, updateCanvasElement]);

  const handleUngroupSelected = useCallback(() => {
    if (!currentPage) return;
    selectedIds.forEach((id) => updateCanvasElement(currentPage.id, id, { groupId: undefined }));
    setSelectedIds([]);
  }, [currentPage, selectedIds, updateCanvasElement]);

  // ─── Decompose / Restore page handlers ─────────────────────────────────────

  const handleDecomposePage = useCallback(() => {
    if (!currentPage) return;
    // Clone classic first if still on built-in
    if (!activeLayout) applyTemplate(CLASSIC_TEMPLATE);
    // Remove the locked page-technical element
    const pageTechEl = currentPage.elements.find((e) => e.type === 'page-technical');
    if (pageTechEl) removeCanvasElement(currentPage.id, pageTechEl.id);
    // Add all decomposed elements — capture timestamp + index to guarantee unique IDs
    const ts = Date.now();
    TECHNICAL_PAGE_ELEMENTS.forEach((el, i) => {
      addCanvasElement(currentPage.id, { ...el, id: `${el.id}-${ts}-${i}` });
    });
    setSelectedIds([]);
  }, [currentPage, activeLayout, applyTemplate, removeCanvasElement, addCanvasElement]);

  const handleRestorePage = useCallback(() => {
    if (!currentPage) return;
    if (!activeLayout) return;
    // Remove everything that is not a page block AND remove any stray page-* elements
    // that don't belong to this page (e.g. if page-cover was dragged in manually).
    // Only the page-technical block should remain — everything else is cleared.
    [...currentPage.elements].forEach((el) => {
      removeCanvasElement(currentPage.id, el.id);
    });
    // Add back the locked page-technical element
    addCanvasElement(currentPage.id, {
      id: `classic-p0-main-${Date.now()}`,
      type: 'page-technical',
      x: 0,
      y: 0,
      width: 794,
      height: 1123,
      zIndex: 0,
      locked: true,
      visible: true,
      props: {},
    });
    setSelectedIds([]);
  }, [currentPage, activeLayout, removeCanvasElement, addCanvasElement]);

  // ─── Zoom controls ────────────────────────────────────────────────────────────

  const handleZoomIn  = useCallback(() => {
    setManualScale((prev) => {
      const cur = prev ?? fitScale;
      return ZOOM_STEPS.find((s) => s > cur + 0.01) ?? cur;
    });
  }, [fitScale]);

  const handleZoomOut = useCallback(() => {
    setManualScale((prev) => {
      const cur = prev ?? fitScale;
      return [...ZOOM_STEPS].reverse().find((s) => s < cur - 0.01) ?? cur;
    });
  }, [fitScale]);

  const handleZoomFit = useCallback(() => setManualScale(null), []);

  // CHANGE 3 — Ctrl+scroll zoom
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const direction = e.deltaY < 0 ? 'in' : 'out';
    setManualScale((prev) => {
      const current = prev ?? fitScale;
      const idx = ZOOM_STEPS.findIndex((s) => s >= current);
      const newIdx = direction === 'in'
        ? Math.min(ZOOM_STEPS.length - 1, (idx < 0 ? ZOOM_STEPS.length - 1 : idx) + 1)
        : Math.max(0, (idx < 0 ? 0 : idx) - 1);
      return ZOOM_STEPS[newIdx] ?? current;
    });
  }, [fitScale]);

  // Non-passive wheel listener for Ctrl+scroll — attached to window so zoom works regardless of cursor position
  useEffect(() => {
    if (viewMode !== 'editor') return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 'in' : 'out';
      setManualScale((prev) => {
        const current = prev ?? fitScale;
        const idx = ZOOM_STEPS.findIndex((s) => s >= current);
        const newIdx = direction === 'in'
          ? Math.min(ZOOM_STEPS.length - 1, (idx < 0 ? ZOOM_STEPS.length - 1 : idx) + 1)
          : Math.max(0, (idx < 0 ? 0 : idx) - 1);
        return ZOOM_STEPS[newIdx] ?? current;
      });
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, [viewMode, fitScale]);

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

  // Detect if the current page is decomposed (no page-technical element)
  const isPageDecomposed = currentPage
    ? !currentPage.elements.some((e) => e.type === 'page-technical')
    : false;

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
            </button>
          ))}
        </div>

        {viewMode === 'editor' && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            <Save size={12} />
            Salvar template
          </button>
        )}
      </div>

      {/* ── TEMPLATES MODE ───────────────────────────────────────────────── */}
      {viewMode === 'templates' && (
        <div className="flex-1 overflow-hidden bg-slate-50">
          <ProposalTemplateGallery onUseTemplate={() => setViewMode('editor')} />
        </div>
      )}

      {/* ── EDITOR MODE ──────────────────────────────────────────────────── */}
      {viewMode === 'editor' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex overflow-hidden relative">

            {/* Left sidebar */}
            <div style={{ width: sidebarWidth, minWidth: sidebarWidth }} className="shrink-0 flex flex-col overflow-hidden bg-slate-950">
              {selectedElement ? (
                <>
                  {/* Back button */}
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 bg-slate-900/40">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
                    >
                      <ChevronLeft size={11} />
                      {sidebarTab === 'layers' ? 'Camadas' : 'Elementos'}
                    </button>
                  </div>
                  <ElementPropertiesPanel
                    element={selectedElement}
                    onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                    onDecompose={handleDecomposePage}
                  />
                  {selectedElement.groupId && (
                    <div className="shrink-0 border-t border-slate-800 px-3 py-2">
                      <button
                        onClick={handleUngroupSelected}
                        className="w-full text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1.5 transition-colors"
                      >
                        Desagrupar ({currentPage?.elements.filter(e => e.groupId === selectedElement.groupId).length ?? 0} elementos)
                      </button>
                    </div>
                  )}
                </>
              ) : selectedGroupId ? (
                <>
                  {/* Back button — dark theme consistent with the rest of the editor */}
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 bg-slate-900/40">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
                    >
                      <ChevronLeft size={11} />
                      {sidebarTab === 'layers' ? 'Camadas' : 'Elementos'}
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <Layers size={24} className="text-indigo-400 opacity-60" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Grupo selecionado</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{selectedIds.length} elementos agrupados</p>
                    </div>
                    <button
                      onClick={handleUngroupSelected}
                      className="w-full text-xs text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 transition-colors font-medium"
                    >
                      Desagrupar elementos
                    </button>
                  </div>
                </>
              ) : (
                <>
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

                  {sidebarTab === 'elements'
                    ? <ElementPalette hasCustomLayout={!!activeLayout} />
                    : <LayersPanel
                        elements={currentPage?.elements ?? []}
                        selectedIds={selectedIds}
                        onSelect={(ids) => setSelectedIds(ids)}
                        onUpdate={handleUpdateElement}
                        onRemove={handleRemoveElement}
                      />
                  }

                  {/* Page background panel — shown when nothing is selected */}
                  {selectedIds.length === 0 && currentPage && (
                    <div className="shrink-0 border-t border-slate-800 px-3 py-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Página</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 flex-1">Cor de fundo</label>
                        <input
                          type="color"
                          value={currentPage.background.color ?? '#ffffff'}
                          onChange={(e) => updateCanvasPageBackground(currentPageId, { color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border border-slate-700 bg-transparent"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Page list at bottom */}
              <div className="shrink-0 border-t border-slate-800 bg-slate-900/40 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Páginas</span>
                  <button onClick={handleAddPage} className="p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {pages.map((page, idx) => (
                    <div
                      key={page.id}
                      className={cn(
                        'flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer group',
                        idx === safePageIdx ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-slate-800'
                      )}
                      onClick={() => { setCanvasPageIdx(idx); setSelectedIds([]); }}
                    >
                      {renamingPageId === page.id ? (
                        <input
                          autoFocus
                          value={renamingPageLabel}
                          placeholder="Nome da página"
                          onChange={(e) => setRenamingPageLabel(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => { handleRenamePage(page.id, renamingPageLabel); setRenamingPageId(null); }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') { handleRenamePage(page.id, renamingPageLabel); setRenamingPageId(null); }
                            if (e.key === 'Escape') setRenamingPageId(null);
                          }}
                          className="flex-1 bg-slate-800 text-slate-200 text-xs px-1 py-0.5 rounded outline-none border border-indigo-500/50"
                        />
                      ) : (
                        <span
                          className="truncate flex-1"
                          onDoubleClick={(e) => { e.stopPropagation(); setRenamingPageId(page.id); setRenamingPageLabel(page.label); }}
                        >
                          {page.label}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicatePage(page.id); }}
                          className="p-1 text-slate-500 hover:text-indigo-400"
                          title="Duplicar página"
                        >
                          <Copy size={12} />
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemovePage(idx); }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remover página"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar resize handle */}
            <div
              className="w-[3px] shrink-0 cursor-col-resize bg-slate-800 hover:bg-indigo-500/50 active:bg-indigo-500/80 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startW = sidebarWidth;
                const ctrl = new AbortController();
                const { signal } = ctrl;
                window.addEventListener('mousemove', (ev: MouseEvent) => {
                  const newW = Math.max(200, Math.min(420, startW + (ev.clientX - startX)));
                  setSidebarWidth(newW);
                  localStorage.setItem('kurupira-proposal-sidebar-w', String(newW));
                }, { signal });
                window.addEventListener('mouseup', () => ctrl.abort(), { signal, once: true });
              }}
            />

            {/* Canvas area */}
            <div ref={canvasAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-900/80">
              {/* Canvas toolbar */}
              <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800 gap-3">
                {/* Navegação de páginas */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={safePageIdx === 0}
                    onClick={() => { setCanvasPageIdx((i) => i - 1); setSelectedIds([]); }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {currentPage?.label ?? ''} ({safePageIdx + 1}/{pages.length})
                  </span>
                  <button
                    disabled={safePageIdx >= pages.length - 1}
                    onClick={() => { setCanvasPageIdx((i) => i + 1); setSelectedIds([]); }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Actions when elements are selected */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedIds.length >= 2 && !selectedGroupId && (
                      <button
                        onClick={handleGroupSelected}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-400 hover:bg-slate-800 transition-colors"
                      >
                        <Layers size={12} />
                        Agrupar ({selectedIds.length})
                      </button>
                    )}
                    {selectedIds.length >= 2 && (
                      <>
                        <div className="w-px h-5 bg-slate-700 mx-1" />
                        <button onClick={() => handleAlign('left')}         title="Alinhar à esquerda"          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignStartVertical size={14} /></button>
                        <button onClick={() => handleAlign('center-h')}    title="Centralizar horizontal"      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignCenterVertical size={14} /></button>
                        <button onClick={() => handleAlign('right')}        title="Alinhar à direita"           className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignEndVertical size={14} /></button>
                        <div className="w-px h-4 bg-slate-800 mx-0.5" />
                        <button onClick={() => handleAlign('top')}          title="Alinhar ao topo"             className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignStartHorizontal size={14} /></button>
                        <button onClick={() => handleAlign('center-v')}    title="Centralizar vertical"        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignCenterHorizontal size={14} /></button>
                        <button onClick={() => handleAlign('bottom')}       title="Alinhar à base"              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignEndHorizontal size={14} /></button>
                        <div className="w-px h-4 bg-slate-800 mx-0.5" />
                        <button onClick={() => handleAlign('distribute-h')} title="Distribuir horizontalmente"  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignHorizontalDistributeCenter size={14} /></button>
                        <button onClick={() => handleAlign('distribute-v')} title="Distribuir verticalmente"    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"><AlignVerticalDistributeCenter size={14} /></button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (!currentPage) return;
                        pushToHistory();
                        const count = selectedIds.length;
                        selectedIds.forEach((id) => removeCanvasElement(currentPage.id, id));
                        setSelectedIds([]);
                        showDeleteToast(count);
                      }}
                      title="Excluir selecionados (Delete)"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 size={12} />
                      {selectedIds.length > 1 ? `Excluir (${selectedIds.length})` : 'Excluir'}
                    </button>
                  </div>
                )}

                {/* Restore default button (only when decomposed) */}
                {isPageDecomposed && (
                  <button
                    onClick={handleRestorePage}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span className="hidden sm:inline">Restaurar padrão</span>
                  </button>
                )}

                {/* Grid controls */}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1">
                  {/* Toggle grid visual */}
                  <button
                    onClick={() => updateGrid({ visible: !gridConfig.visible })}
                    title={gridConfig.visible ? 'Ocultar grid' : 'Mostrar grid'}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      gridConfig.visible ? 'text-blue-400 bg-slate-700' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <Grid3x3 size={12} />
                    <span className="hidden sm:inline">Grid</span>
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  {/* Toggle snap */}
                  <button
                    onClick={() => updateGrid({ snap: !gridConfig.snap })}
                    title={gridConfig.snap ? 'Desativar snap' : 'Ativar snap'}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      gridConfig.snap ? 'text-emerald-400 bg-slate-700' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <Magnet size={12} />
                    <span className="hidden sm:inline">Snap</span>
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  {/* Toggle smart guides */}
                  <button
                    onClick={() => updateGrid({ guides: !gridConfig.guides })}
                    title={gridConfig.guides ? 'Desativar guias' : 'Ativar guias'}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      gridConfig.guides ? 'text-rose-400 bg-slate-700' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <Target size={12} />
                    <span className="hidden sm:inline">Guias</span>
                  </button>

                  <div className="w-px h-4 bg-slate-700" />

                  {/* Tamanho do grid */}
                  <div className="flex items-center gap-0.5 px-1">
                    {([8, 16, 24] as const).map((size) => (
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

                {/* Zoom controls + dica */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-600 hidden lg:flex items-center gap-1">
                    <Pencil size={10} />
                    Arraste para a página
                  </span>

                  <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg px-1 py-1">
                    <button
                      onClick={handleZoomOut}
                      title="Diminuir zoom (−)"
                      disabled={canvasScale <= 0.25}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded transition-colors"
                    >
                      <ZoomOut size={12} />
                    </button>

                    <span className="px-2 py-0.5 text-[10px] font-mono min-w-[44px] text-center text-slate-300 tabular-nums select-none">
                      {Math.round(canvasScale * 100)}%
                    </span>

                    <button
                      onClick={handleZoomIn}
                      title="Aumentar zoom (+)"
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
              </div>

              {/* A4 Canvas */}
              <div
                className="flex-1 overflow-auto flex items-start justify-center p-8 custom-scrollbar"
                onClick={() => setSelectedIds([])}
                onWheel={handleCanvasWheel}
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
                      onMutationStart={pushToHistory}
                      onDuplicateElement={(elementId) => {
                        if (!currentPage) return;
                        const el = currentPage.elements.find((e) => e.id === elementId);
                        if (!el || el.locked) return;
                        pushToHistory();
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
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Drag overlay ghost */}
            <DragOverlay dropAnimation={null}>
              {activeDragType && (() => {
                const meta = DRAG_GHOST_META[activeDragType] ?? { label: activeDragType, icon: '◻' };
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
              onSave={(name) => { saveCurrentAsTemplate(name); setShowSaveDialog(false); }}
              onCancel={() => setShowSaveDialog(false)}
            />
          )}

          {/* Delete toast */}
          {deleteToast && (
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
              {deleteToast}
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
    </div>
  );
};
