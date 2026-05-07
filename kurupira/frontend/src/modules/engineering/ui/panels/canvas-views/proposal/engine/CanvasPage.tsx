import React, { useCallback, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CanvasElementWrapper } from './CanvasElementWrapper';
import { GridOverlay } from './GridOverlay';
import { SmartGuides } from './SmartGuides';
import type { CanvasPage as CanvasPageType, CanvasElement, GridConfig, GuideLines } from './types';
import { A4_WIDTH, A4_HEIGHT } from './types';

interface Props {
  page: CanvasPageType;
  scale: number;
  selectedIds: string[];
  gridConfig: GridConfig;
  onSelect: (ids: string[]) => void;
  onUpdateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  onRemoveElement: (elementId: string) => void;
}

export function CanvasPage({
  page, scale, selectedIds, gridConfig,
  onSelect, onUpdateElement, onRemoveElement,
}: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLines>({ x: [], y: [] });
  const groupDragStartRef = useRef<Map<string, { x: number; y: number }> | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${page.id}`,
    data: { pageId: page.id },
  });

  const handlePageClick = useCallback(() => {
    onSelect([]);
  }, [onSelect]);

  const handleElementSelect = useCallback((element: CanvasElement) => {
    if (element.groupId) {
      const groupMembers = page.elements
        .filter((e) => e.groupId === element.groupId)
        .map((e) => e.id);
      onSelect(groupMembers);
    } else {
      onSelect([element.id]);
    }
  }, [page.elements, onSelect]);

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
        x: Math.round(Math.max(0, Math.min(A4_WIDTH  - el.width,  start.x + dx))),
        y: Math.round(Math.max(0, Math.min(A4_HEIGHT - el.height, start.y + dy))),
      });
    });
  }, [page.elements, onUpdateElement]);

  const handleGroupDragEnd = useCallback(() => {
    groupDragStartRef.current = null;
  }, []);

  const background = (() => {
    if (page.background.gradient) return page.background.gradient;
    if (page.background.imageUrl)  return `url(${page.background.imageUrl}) center/cover no-repeat`;
    return page.background.color ?? '#ffffff';
  })();

  const sortedElements = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      style={{
        width: A4_WIDTH,
        height: A4_HEIGHT,
        position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        flexShrink: 0,
        outline: isOver ? '2px dashed #3b82f6' : 'none',
        outlineOffset: 2,
        overflow: 'hidden',
        background,
      }}
      onClick={handlePageClick}
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
        const isGrouped  = !!element.groupId && selectedIds.some(id => {
          const el = page.elements.find(e => e.id === id);
          return el?.groupId === element.groupId;
        });
        const others = sortedElements.filter((el) => el.id !== element.id && !el.type.startsWith('page-'));
        return (
          <CanvasElementWrapper
            key={element.id}
            element={element}
            isSelected={isSelected}
            isGrouped={isGrouped && selectedIds.length > 1}
            selectedIds={selectedIds}
            canvasScale={scale}
            gridSize={gridConfig.size}
            snapEnabled={gridConfig.snap}
            guidesEnabled={gridConfig.guides}
            otherElements={others}
            onSelect={() => handleElementSelect(element)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            onDelete={() => {
              onRemoveElement(element.id);
              if (selectedIds.includes(element.id)) onSelect(selectedIds.filter(id => id !== element.id));
            }}
            onGuideChange={setActiveGuides}
            onGroupDragStart={() => handleGroupDragStart(selectedIds)}
            onGroupDragDelta={(dx, dy) => handleGroupDragDelta(dx, dy, selectedIds)}
            onGroupDragEnd={handleGroupDragEnd}
          />
        );
      })}

      {/* Smart guides — sobrepostas a tudo */}
      {gridConfig.guides && <SmartGuides guides={activeGuides} />}

      {/* Overlay azul quando hover de drop */}
      {isOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.04)', pointerEvents: 'none', zIndex: 999 }} />
      )}
    </div>
  );
}
