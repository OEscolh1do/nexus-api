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
import { Settings2, FileText, LayoutTemplate, Pencil, Save, Layers, ChevronLeft, ChevronRight, Plus, Trash2, Grid3x3, Magnet, Target, PanelLeft, LayoutList, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ProposalEditPanel } from './proposal/ProposalEditPanel';
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
import { A4_WIDTH, A4_HEIGHT, DEFAULT_ELEMENT_PROPS, DEFAULT_GRID_CONFIG } from './proposal/engine/types';

type ViewMode = 'templates' | 'editor' | 'preview';

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
  const addCanvasPage       = useSolarStore((s) => s.addCanvasPage);
  const removeCanvasPage    = useSolarStore((s) => s.removeCanvasPage);
  const saveCurrentAsTemplate = useSolarStore((s) => s.saveCurrentAsTemplate);
  const applyTemplate       = useSolarStore((s) => s.applyTemplate);

  const [viewMode, setViewMode]             = useState<ViewMode>('preview');
  const [mobileMode, setMobileMode]         = useState<'editor' | 'document'>('document');
  const [canvasPageIdx, setCanvasPageIdx]   = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [gridConfig, setGridConfig]         = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [sidebarTab, setSidebarTab]         = useState<'elements' | 'layers'>('elements');

  const updateGrid = (patch: Partial<GridConfig>) =>
    setGridConfig((prev) => ({ ...prev, ...patch }));

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(0.6);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Compute the effective layout and pages
  const effectiveLayout = activeLayout ?? CLASSIC_TEMPLATE;
  const pages           = effectiveLayout.pages;
  const safePageIdx     = Math.min(canvasPageIdx, pages.length - 1);
  const currentPage     = pages[safePageIdx] ?? null;

  // Selected element object
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId) ?? null;

  // Resize observer for canvas scale
  useEffect(() => {
    if (!canvasAreaRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scaleW = (width - 64) / A4_WIDTH;
      const scaleH = (height - 80) / A4_HEIGHT;
      setCanvasScale(Math.min(scaleW, scaleH, 1));
    });
    obs.observe(canvasAreaRef.current);
    return () => obs.disconnect();
  }, []);

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
      type PresetDef = { type: CanvasElement['type']; dx: number; dy: number; width: number; height: number; zIndex: number; props: Record<string, unknown> };
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
          props:   { ...def.props },
        };
        addCanvasElement(currentPage.id, el);
      });
      return;
    }

    // ── Elemento único ─────────────────────────────────────────────────────────
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
    setSelectedElementId(newElement.id);
  }, [currentPage, canvasScale, activeLayout, applyTemplate, addCanvasElement]);

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
  }, [activeLayout, applyTemplate, addCanvasPage, pages.length]);

  const handleRemovePage = useCallback((idx: number) => {
    if (pages.length <= 1) return;
    removeCanvasPage(pages[idx].id);
    setCanvasPageIdx((prev) => Math.min(prev, pages.length - 2));
  }, [pages, removeCanvasPage]);

  // ─── Element handlers ──────────────────────────────────────────────────────

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!currentPage) return;
    updateCanvasElement(currentPage.id, elementId, updates);
  }, [currentPage, updateCanvasElement]);

  const handleRemoveElement = useCallback((elementId: string) => {
    if (!currentPage) return;
    removeCanvasElement(currentPage.id, elementId);
    if (selectedElementId === elementId) setSelectedElementId(null);
  }, [currentPage, removeCanvasElement, selectedElementId]);

  // ─── Decompose / Restore page handlers ─────────────────────────────────────

  const handleDecomposePage = useCallback(() => {
    if (!currentPage) return;
    // Clone classic first if still on built-in
    if (!activeLayout) applyTemplate(CLASSIC_TEMPLATE);
    // Remove the locked page-technical element
    const pageTechEl = currentPage.elements.find((e) => e.type === 'page-technical');
    if (pageTechEl) removeCanvasElement(currentPage.id, pageTechEl.id);
    // Add all decomposed elements
    TECHNICAL_PAGE_ELEMENTS.forEach((el) => {
      addCanvasElement(currentPage.id, { ...el, id: `${el.id}-${Date.now()}` });
    });
    setSelectedElementId(null);
  }, [currentPage, activeLayout, applyTemplate, removeCanvasElement, addCanvasElement]);

  const handleRestorePage = useCallback(() => {
    if (!currentPage) return;
    if (!activeLayout) return;
    // Remove all non-page elements
    [...currentPage.elements].forEach((el) => {
      if (!el.type.startsWith('page-')) removeCanvasElement(currentPage.id, el.id);
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
    setSelectedElementId(null);
  }, [currentPage, activeLayout, removeCanvasElement, addCanvasElement]);

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
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
            <div className="w-[260px] shrink-0 flex flex-col overflow-hidden border-r border-slate-800 bg-white">
              {selectedElement ? (
                <>
                  {/* Back button */}
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
                    <button
                      onClick={() => setSelectedElementId(null)}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-200"
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
                </>
              ) : (
                <>
                  {/* Tab switcher */}
                  <div className="shrink-0 flex border-b border-slate-200">
                    <button
                      onClick={() => setSidebarTab('elements')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-colors',
                        sidebarTab === 'elements'
                          ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
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
                          ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
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
                        selectedId={selectedElementId}
                        onSelect={setSelectedElementId}
                        onUpdate={handleUpdateElement}
                        onRemove={handleRemoveElement}
                      />
                  }
                </>
              )}

              {/* Page list at bottom */}
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Páginas</span>
                  <button onClick={handleAddPage} className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                  {pages.map((page, idx) => (
                    <div
                      key={page.id}
                      className={cn(
                        'flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer group',
                        idx === safePageIdx ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                      )}
                      onClick={() => { setCanvasPageIdx(idx); setSelectedElementId(null); }}
                    >
                      <span className="truncate">{page.label}</span>
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemovePage(idx); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas area */}
            <div ref={canvasAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-900/80">
              {/* Canvas toolbar */}
              <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800 gap-3">
                {/* Navegação de páginas */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={safePageIdx === 0}
                    onClick={() => { setCanvasPageIdx((i) => i - 1); setSelectedElementId(null); }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {currentPage?.label ?? ''} ({safePageIdx + 1}/{pages.length})
                  </span>
                  <button
                    disabled={safePageIdx >= pages.length - 1}
                    onClick={() => { setCanvasPageIdx((i) => i + 1); setSelectedElementId(null); }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 rounded"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

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

                {/* Zoom e dica */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-600 hidden lg:flex items-center gap-1">
                    <Pencil size={10} />
                    Arraste para a página
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{Math.round(canvasScale * 100)}%</span>
                </div>
              </div>

              {/* A4 Canvas */}
              <div
                className="flex-1 overflow-auto flex items-start justify-center p-8"
                onClick={() => setSelectedElementId(null)}
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
                      selectedId={selectedElementId}
                      gridConfig={gridConfig}
                      onSelect={setSelectedElementId}
                      onUpdateElement={handleUpdateElement}
                      onRemoveElement={handleRemoveElement}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Drag overlay ghost */}
            <DragOverlay>
              {activeDragType && (
                <div className="bg-blue-500/20 border-2 border-blue-400 border-dashed rounded text-blue-400 text-xs flex items-center justify-center px-3 py-2 pointer-events-none">
                  {activeDragType}
                </div>
              )}
            </DragOverlay>
          </div>

          {showSaveDialog && (
            <SaveTemplateDialog
              onSave={(name) => { saveCurrentAsTemplate(name); setShowSaveDialog(false); }}
              onCancel={() => setShowSaveDialog(false)}
            />
          )}
        </DndContext>
      )}

      {/* ── PREVIEW MODE ─────────────────────────────────────────────────── */}
      {viewMode === 'preview' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
          <div className={cn(
            'w-full lg:w-[40%] xl:w-[35%] 2xl:w-[30%] min-w-[380px] max-w-[700px] shrink-0 border-r border-slate-800 bg-[#0a0f1a] flex-col overflow-hidden',
            mobileMode === 'editor' ? 'flex h-full' : 'hidden lg:flex lg:h-full'
          )}>
            <ProposalEditPanel />
          </div>
          <div className={cn(
            'flex-1 bg-[#05080e] flex flex-col overflow-hidden',
            mobileMode === 'document' ? 'flex' : 'hidden lg:flex'
          )}>
            <ProposalDocumentPreview />
          </div>

          {/* Mobile nav (preview mode only) */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-2 px-4 z-50">
            <button
              onClick={() => setMobileMode('editor')}
              className={cn('flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors', mobileMode === 'editor' ? 'text-indigo-400' : 'text-slate-500')}
            >
              <Settings2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Editor</span>
            </button>
            <div className="w-px h-8 bg-slate-800" />
            <button
              onClick={() => setMobileMode('document')}
              className={cn('flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors', mobileMode === 'document' ? 'text-emerald-400' : 'text-slate-500')}
            >
              <FileText size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Documento</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
