import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CanvasElementWrapper } from './CanvasElementWrapper';
import { GridOverlay } from './GridOverlay';
import { SmartGuides } from './SmartGuides';
import type { CanvasPage as CanvasPageType, CanvasElement, GridConfig, GuideLines } from './types';
import { getPageDimensions, parseBackgroundImageUrl } from './types';

interface Props {
  page: CanvasPageType;
  scale: number;
  selectedIds: string[];
  gridConfig: GridConfig;
  onSelect: (ids: string[]) => void;
  onUpdateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  onMutationStart?: () => void;
  onDuplicateElement?: (elementId: string) => void;
  onRemoveElement?: (elementId: string) => void;
  editingGroupId?: string | null;
  onEnterGroupEdit?: (groupId: string, elementId: string) => void;
  onExitGroupEdit?: () => void;
  onPanDelta?: (dx: number, dy: number) => void;
  /** Called when an image file is dropped directly onto the A4 canvas from the OS */
  onDropImage?: (data: { url: string; x: number; y: number }) => void;
}

export function CanvasPage({
  page, scale, selectedIds, gridConfig,
  onSelect, onUpdateElement, onMutationStart,
  onDuplicateElement, onRemoveElement,
  editingGroupId, onEnterGroupEdit, onExitGroupEdit,
  onPanDelta, onDropImage,
}: Props) {
  const { width: pageW, height: pageH } = getPageDimensions(page.orientation);

  const pageRef = useRef<HTMLDivElement>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLines>({ x: [], y: [] });
  const groupDragStartRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const [rubberBand, setRubberBand] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const rubberBandAbortRef = useRef<AbortController | null>(null);
  const spaceRef = useRef(false);
  const panAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      rubberBandAbortRef.current?.abort();
      panAbortRef.current?.abort();
    };
  }, []);

  // Track Space key for pan-with-space gesture (only when pan is enabled)
  useEffect(() => {
    if (!onPanDelta) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) spaceRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onPanDelta]);

  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${page.id}`,
    data: { pageId: page.id },
  });

  const handleElementSelect = useCallback((element: CanvasElement, shiftKey: boolean) => {
    if (editingGroupId && element.groupId === editingGroupId) {
      // Dentro do modo de edição: seleção individual
      if (shiftKey) {
        const alreadySelected = selectedIds.includes(element.id);
        onSelect(alreadySelected
          ? selectedIds.filter((id) => id !== element.id)
          : [...selectedIds, element.id]);
      } else {
        onSelect([element.id]);
      }
      return;
    }
    // Modo normal
    if (shiftKey) {
      const alreadySelected = selectedIds.includes(element.id);
      onSelect(alreadySelected
        ? selectedIds.filter((id) => id !== element.id)
        : [...selectedIds, element.id]);
    } else if (element.groupId && !editingGroupId) {
      const groupMembers = page.elements
        .filter((e) => e.groupId === element.groupId)
        .map((e) => e.id);
      onSelect(groupMembers);
    } else {
      onSelect([element.id]);
    }
  }, [page.elements, onSelect, selectedIds, editingGroupId]);

  const handleEnterGroupEdit = useCallback((element: CanvasElement) => {
    if (!element.groupId) return;
    onEnterGroupEdit?.(element.groupId, element.id);
  }, [onEnterGroupEdit]);

  const handleGroupDragStart = useCallback((selectedIds: string[]) => {
    groupDragStartRef.current = new Map();
    page.elements
      .filter((e) => selectedIds.includes(e.id))
      .forEach((e) => groupDragStartRef.current!.set(e.id, { x: e.x, y: e.y }));
  }, [page.elements]);

  const handleGroupDragDelta = useCallback((dx: number, dy: number, elementIds: string[]) => {
    if (!groupDragStartRef.current) return;
    elementIds.forEach((id) => {
      const start = groupDragStartRef.current!.get(id);
      const el = page.elements.find((e) => e.id === id);
      if (!start || !el) return;
      onUpdateElement(id, {
        x: Math.round(Math.max(0, Math.min(pageW - el.width,  start.x + dx))),
        y: Math.round(Math.max(0, Math.min(pageH - el.height, start.y + dy))),
      });
    });
  }, [page.elements, onUpdateElement]);

  const handleGroupDragEnd = useCallback(() => {
    groupDragStartRef.current = null;
  }, []);

  const background = (() => {
    if (page.background.gradient) return page.background.gradient;
    if (page.background.imageUrl) {
      const { url, size } = parseBackgroundImageUrl(page.background.imageUrl);
      return `url(${url}) center/${size} no-repeat`;
    }
    return page.background.color ?? '#ffffff';
  })();

  const sortedElements = useMemo(
    () => [...page.elements].sort((a, b) => a.zIndex - b.zIndex),
    [page.elements],
  );

  const nonPageElements = useMemo(
    () => sortedElements.filter((el) => !el.type.startsWith('page-')),
    [sortedElements],
  );

  // Pre-compute selected group IDs once per render (O(selectedIds) vs O(n×selectedIds) inline)
  const selectedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    selectedIds.forEach((id) => {
      const el = page.elements.find((e) => e.id === id);
      if (el?.groupId) ids.add(el.groupId);
    });
    return ids;
  }, [selectedIds, page.elements]);


  return (
    <div
      style={{
        width: pageW,
        height: pageH,
        position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        flexShrink: 0,
        outline: isOver ? '2px dashed #6366f1' : 'none',
        outlineOffset: 2,
        overflow: 'hidden',
        background,
      }}
      onMouseDown={(e) => {
        // Capture onPanDelta into a local so startPan doesn't need a non-null assertion.
        const panDelta = onPanDelta;
        const startPan = (startX: number, startY: number) => {
          panAbortRef.current?.abort();
          panAbortRef.current = new AbortController();
          const { signal } = panAbortRef.current;
          let lastX = startX;
          let lastY = startY;
          window.addEventListener('mousemove', (ev: MouseEvent) => {
            panDelta!(ev.clientX - lastX, ev.clientY - lastY);
            lastX = ev.clientX;
            lastY = ev.clientY;
          }, { signal });
          window.addEventListener('mouseup', () => { panAbortRef.current?.abort(); }, { signal });
        };

        // Middle-mouse-button pan
        if (e.button === 1 && panDelta) {
          e.preventDefault();
          e.stopPropagation();
          startPan(e.clientX, e.clientY);
          return;
        }

        // Space+drag pan
        if (e.button === 0 && spaceRef.current && panDelta) {
          e.preventDefault();
          e.stopPropagation();
          startPan(e.clientX, e.clientY);
          return;
        }

        if (e.target !== e.currentTarget) return;
        if (editingGroupId) {
          onExitGroupEdit?.();
          onSelect([]);
          return;
        }
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = (e.clientX - rect.left) / scale;
        const startY = (e.clientY - rect.top) / scale;
        setRubberBand({ startX, startY, endX: startX, endY: startY });

        const controller = new AbortController();
        const { signal } = controller;
        rubberBandAbortRef.current = controller;

        const onMove = (ev: MouseEvent) => {
          const endX = (ev.clientX - rect.left) / scale;
          const endY = (ev.clientY - rect.top) / scale;
          setRubberBand((prev) => prev ? { ...prev, endX, endY } : null);
        };
        const onUp = () => {
          controller.abort();
          setRubberBand((rb) => {
            if (!rb) return null;
            const selX = Math.min(rb.startX, rb.endX);
            const selY = Math.min(rb.startY, rb.endY);
            const selW = Math.abs(rb.endX - rb.startX);
            const selH = Math.abs(rb.endY - rb.startY);
            if (selW > 4 && selH > 4) {
              const selected = page.elements
                .filter((el) => !el.type.startsWith('page-') && el.visible)
                .filter((el) =>
                  el.x < selX + selW && el.x + el.width > selX &&
                  el.y < selY + selH && el.y + el.height > selY
                )
                .map((el) => el.id);
              if (selected.length > 0) onSelect(selected);
              else onSelect([]);
            } else {
              onSelect([]);
            }
            return null;
          });
        };
        window.addEventListener('mousemove', onMove, { signal });
        window.addEventListener('mouseup', onUp, { signal });
      }}
      onDragOver={(e) => {
        // Only intercept OS file drops (not @dnd-kit internal drags)
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!onDropImage) return;
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) return;
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          if (!url) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.round((e.clientX - rect.left) / scale);
          const y = Math.round((e.clientY - rect.top) / scale);
          onDropImage({ url, x, y });
        };
        reader.readAsDataURL(file);
      }}
    >
      {/* Drop zone invisível (@dnd-kit) */}
      <div
        ref={(node) => {
          setNodeRef(node);
          (pageRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
      />

      {/* Grid visual */}
      {gridConfig.visible && <GridOverlay size={gridConfig.size} />}

      {/* Elementos ordenados por z-index */}
      {sortedElements.map((element) => {
        const isSelected = selectedIds.includes(element.id);
        const isGrouped  = !!element.groupId && selectedGroupIds.has(element.groupId);
        return (
          <CanvasElementWrapper
            key={element.id}
            element={element}
            isSelected={isSelected}
            isGrouped={isGrouped && selectedIds.length > 1}
            canvasScale={scale}
            gridSize={gridConfig.size}
            snapEnabled={gridConfig.snap}
            guidesEnabled={gridConfig.guides}
            otherElements={nonPageElements}
            onSelect={(shiftKey) => handleElementSelect(element, shiftKey ?? false)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            onGuideChange={setActiveGuides}
            onGroupDragStart={() => handleGroupDragStart(selectedIds)}
            onGroupDragDelta={(dx, dy) => handleGroupDragDelta(dx, dy, selectedIds)}
            onGroupDragEnd={handleGroupDragEnd}
            onMutationStart={onMutationStart}
            onDuplicate={() => onDuplicateElement?.(element.id)}
            onRemove={() => onRemoveElement?.(element.id)}
            groupEditMode={!!editingGroupId}
            isInGroupEdit={editingGroupId ? element.groupId === editingGroupId : false}
            onEnterGroupEdit={() => handleEnterGroupEdit(element)}
          />
        );
      })}

      {/* Empty state — visível quando não há elementos livres */}
      {nonPageElements.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 40, opacity: 0.12, color: '#6366f1', lineHeight: 1 }}>+</div>
          <p style={{ fontSize: 13, color: '#475569', fontWeight: 500, margin: 0 }}>
            Arraste elementos da paleta para começar
          </p>
        </div>
      )}

      {/* Unified selection bounding box (multi-select) */}
      {selectedIds.length >= 2 && (() => {
        const selected = page.elements.filter(el => selectedIds.includes(el.id));
        if (selected.length === 0) return null;
        const minX = Math.min(...selected.map(e => e.x));
        const minY = Math.min(...selected.map(e => e.y));
        const maxX = Math.max(...selected.map(e => e.x + e.width));
        const maxY = Math.max(...selected.map(e => e.y + e.height));
        return (
          <div
            style={{
              position: 'absolute',
              left: minX - 2,
              top: minY - 2,
              width: maxX - minX + 4,
              height: maxY - minY + 4,
              border: '1.5px dashed rgba(99,102,241,0.6)',
              borderRadius: 2,
              pointerEvents: 'none',
              zIndex: 997,
            }}
          />
        );
      })()}

      {/* Bounding box do grupo em edição */}
      {editingGroupId && (() => {
        const groupEls = page.elements.filter((e) => e.groupId === editingGroupId);
        if (groupEls.length === 0) return null;
        const minX = Math.min(...groupEls.map((e) => e.x)) - 10;
        const minY = Math.min(...groupEls.map((e) => e.y)) - 10;
        const maxX = Math.max(...groupEls.map((e) => e.x + e.width)) + 10;
        const maxY = Math.max(...groupEls.map((e) => e.y + e.height)) + 10;
        return (
          <div
            style={{
              position: 'absolute',
              left: minX,
              top: minY,
              width: maxX - minX,
              height: maxY - minY,
              border: '2px dashed rgba(99,102,241,0.7)',
              borderRadius: 6,
              pointerEvents: 'none',
              zIndex: 996,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -20,
                left: 0,
                fontSize: 10,
                fontWeight: 700,
                color: '#6366f1',
                background: 'white',
                padding: '1px 6px',
                borderRadius: 3,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                userSelect: 'none',
              }}
            >
              Editando grupo
            </span>
          </div>
        );
      })()}

      {/* Smart guides — sobrepostas a tudo */}
      {gridConfig.guides && <SmartGuides guides={activeGuides} />}

      {/* Overlay azul quando hover de drop */}
      {isOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.05)', pointerEvents: 'none', zIndex: 999 }} />
      )}

      {/* Rubber-band selection rectangle */}
      {rubberBand && (() => {
        const x = Math.min(rubberBand.startX, rubberBand.endX);
        const y = Math.min(rubberBand.startY, rubberBand.endY);
        const w = Math.abs(rubberBand.endX - rubberBand.startX);
        const h = Math.abs(rubberBand.endY - rubberBand.startY);
        return (
          <div style={{
            position: 'absolute', left: x, top: y, width: w, height: h,
            border: '1px solid #6366f1', background: 'rgba(99,102,241,0.08)',
            pointerEvents: 'none', zIndex: 998,
          }} />
        );
      })()}
    </div>
  );
}
