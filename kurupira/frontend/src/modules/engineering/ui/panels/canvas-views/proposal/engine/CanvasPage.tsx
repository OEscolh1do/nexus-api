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
  selectedId: string | null;
  gridConfig: GridConfig;
  onSelect: (id: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  onRemoveElement: (elementId: string) => void;
}

export function CanvasPage({
  page, scale, selectedId, gridConfig,
  onSelect, onUpdateElement, onRemoveElement,
}: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLines>({ x: [], y: [] });

  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${page.id}`,
    data: { pageId: page.id },
  });

  const handlePageClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

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
        const others = sortedElements.filter((el) => el.id !== element.id && !el.type.startsWith('page-'));
        return (
          <CanvasElementWrapper
            key={element.id}
            element={element}
            isSelected={selectedId === element.id}
            canvasScale={scale}
            gridSize={gridConfig.size}
            snapEnabled={gridConfig.snap}
            guidesEnabled={gridConfig.guides}
            otherElements={others}
            onSelect={() => onSelect(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            onDelete={() => {
              onRemoveElement(element.id);
              if (selectedId === element.id) onSelect(null);
            }}
            onGuideChange={setActiveGuides}
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
