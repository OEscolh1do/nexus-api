import React, { useRef, useCallback, useState } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import { CanvasElementRenderer } from './CanvasElementRenderer';
import type { CanvasElement, GuideLines } from './types';
import { A4_WIDTH, A4_HEIGHT } from './types';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e:  'e-resize',  se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
};

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_POSITIONS: Record<ResizeHandle, React.CSSProperties> = {
  nw: { top: -4,  left: -4 },
  n:  { top: -4,  left: '50%', transform: 'translateX(-50%)' },
  ne: { top: -4,  right: -4 },
  e:  { top: '50%', right: -4, transform: 'translateY(-50%)' },
  se: { bottom: -4, right: -4 },
  s:  { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
  sw: { bottom: -4, left: -4 },
  w:  { top: '50%', left: -4, transform: 'translateY(-50%)' },
};

// ─── Snap helpers ────────────────────────────────────────────────────────────

function snapToGrid(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return Math.round(val);
  return Math.round(val / gridSize) * gridSize;
}

interface SnapResult {
  x: number;
  y: number;
  guides: GuideLines;
}

const GUIDE_THRESHOLD = 6; // px no espaço A4

function applySmartGuides(
  x: number,
  y: number,
  w: number,
  h: number,
  others: CanvasElement[],
  scaledThreshold: number,
  enabled: boolean,
): SnapResult {
  if (!enabled || others.length === 0) return { x, y, guides: { x: [], y: [] } };

  let snappedX = x;
  let snappedY = y;
  const guidesX: number[] = [];
  const guidesY: number[] = [];

  for (const other of others) {
    const oRight  = other.x + other.width;
    const oBottom = other.y + other.height;
    const oCx     = other.x + other.width / 2;
    const oCy     = other.y + other.height / 2;

    // Pontos de alinhamento X: [borda esq do elemento, centro, borda dir]
    const myLeft   = snappedX;
    const myCenter = snappedX + w / 2;
    const myRight  = snappedX + w;

    // Comparações: cada borda do elemento contra cada borda do outro
    const xPairs: [number, number][] = [
      [myLeft,   other.x],  [myLeft,   oRight],  [myLeft,   oCx],
      [myCenter, other.x],  [myCenter, oRight],  [myCenter, oCx],
      [myRight,  other.x],  [myRight,  oRight],  [myRight,  oCx],
    ];

    for (const [mine, theirs] of xPairs) {
      if (Math.abs(mine - theirs) < scaledThreshold) {
        snappedX += theirs - mine;
        if (!guidesX.includes(theirs)) guidesX.push(theirs);
        break;
      }
    }

    // Pontos de alinhamento Y: [borda top, centro, borda bottom]
    const myTop    = snappedY;
    const myCenterY = snappedY + h / 2;
    const myBottom = snappedY + h;

    const yPairs: [number, number][] = [
      [myTop,     other.y],  [myTop,     oBottom],  [myTop,     oCy],
      [myCenterY, other.y],  [myCenterY, oBottom],  [myCenterY, oCy],
      [myBottom,  other.y],  [myBottom,  oBottom],  [myBottom,  oCy],
    ];

    for (const [mine, theirs] of yPairs) {
      if (Math.abs(mine - theirs) < scaledThreshold) {
        snappedY += theirs - mine;
        if (!guidesY.includes(theirs)) guidesY.push(theirs);
        break;
      }
    }
  }

  return { x: snappedX, y: snappedY, guides: { x: guidesX, y: guidesY } };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  canvasScale: number;
  gridSize: number;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  otherElements: CanvasElement[];
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onGuideChange: (guides: GuideLines) => void;
}

export function CanvasElementWrapper({
  element, isSelected, canvasScale,
  gridSize, snapEnabled, guidesEnabled, otherElements,
  onSelect, onUpdate, onDelete, onGuideChange,
}: Props) {
  const [isTextEditing, setIsTextEditing] = useState(false);
  const dragStartRef   = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemW: number; elemH: number; handle: ResizeHandle } | null>(null);

  const isLocked    = element.locked;
  const isPageBlock = element.type.startsWith('page-');

  const scaledThreshold = GUIDE_THRESHOLD / canvasScale;

  // ── Move drag ──────────────────────────────────────────────────────────────

  const handleMouseDownMove = useCallback((e: React.MouseEvent) => {
    if (isLocked || isPageBlock || isTextEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: element.x,
      elemY: element.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (ev.clientX - dragStartRef.current.mouseX) / canvasScale;
      const dy = (ev.clientY - dragStartRef.current.mouseY) / canvasScale;

      let rawX = Math.max(0, Math.min(A4_WIDTH - element.width, dragStartRef.current.elemX + dx));
      let rawY = Math.max(0, Math.min(A4_HEIGHT - element.height, dragStartRef.current.elemY + dy));

      // 1) Snap to grid
      rawX = snapToGrid(rawX, gridSize, snapEnabled);
      rawY = snapToGrid(rawY, gridSize, snapEnabled);

      // 2) Smart guides (sobrescreve snap se alinhamento encontrado)
      const { x, y, guides } = applySmartGuides(
        rawX, rawY, element.width, element.height,
        otherElements, scaledThreshold, guidesEnabled,
      );

      onGuideChange(guides);
      onUpdate({ x: Math.round(x), y: Math.round(y) });
    };

    const onUp = () => {
      dragStartRef.current = null;
      onGuideChange({ x: [], y: [] });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isLocked, isPageBlock, isTextEditing, element, canvasScale, gridSize, snapEnabled, guidesEnabled, otherElements, scaledThreshold, onSelect, onUpdate, onGuideChange]);

  // ── Resize drag ────────────────────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: element.x,
      elemY: element.y,
      elemW: element.width,
      elemH: element.height,
      handle,
    };

    const MIN_SIZE = 20;

    const onMove = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const { mouseX, mouseY, elemX, elemY, elemW, elemH, handle: h } = resizeStartRef.current;
      const dx = (ev.clientX - mouseX) / canvasScale;
      const dy = (ev.clientY - mouseY) / canvasScale;

      let newX = elemX, newY = elemY, newW = elemW, newH = elemH;

      if (h.includes('e')) newW = Math.max(MIN_SIZE, snapToGrid(elemW + dx, gridSize, snapEnabled));
      if (h.includes('s')) newH = Math.max(MIN_SIZE, snapToGrid(elemH + dy, gridSize, snapEnabled));
      if (h.includes('w')) {
        const snapped = snapToGrid(elemX + dx, gridSize, snapEnabled);
        newW = Math.max(MIN_SIZE, elemX + elemW - snapped);
        newX = elemX + elemW - newW;
      }
      if (h.includes('n')) {
        const snapped = snapToGrid(elemY + dy, gridSize, snapEnabled);
        newH = Math.max(MIN_SIZE, elemY + elemH - snapped);
        newY = elemY + elemH - newH;
      }

      onUpdate({ x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
    };

    const onUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isLocked, element, canvasScale, gridSize, snapEnabled, onUpdate]);

  // ── Double click para editar texto ─────────────────────────────────────────

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (element.type === 'text') {
      e.stopPropagation();
      setIsTextEditing(true);
    }
  }, [element.type]);

  const handlePropsChange = useCallback((props: Record<string, unknown>) => {
    onUpdate({ props });
    setIsTextEditing(false);
  }, [onUpdate]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        opacity: element.visible ? 1 : 0.3,
        outline: isSelected ? '2px solid #3b82f6' : 'none',
        outlineOffset: 1,
        cursor: isLocked || isPageBlock ? 'default' : (isTextEditing ? 'text' : 'move'),
        userSelect: 'none',
        boxSizing: 'border-box',
        overflow: isPageBlock ? 'visible' : 'hidden',
      }}
      onMouseDown={handleMouseDownMove}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={handleDoubleClick}
    >
      <CanvasElementRenderer
        element={element}
        isEditing={isTextEditing}
        onPropsChange={handlePropsChange}
      />

      {/* Resize handles + toolbar quando selecionado */}
      {isSelected && !isPageBlock && (
        <>
          {!isLocked && HANDLES.map((handle) => (
            <div
              key={handle}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: '#ffffff',
                border: '1.5px solid #3b82f6',
                borderRadius: 2,
                cursor: HANDLE_CURSORS[handle],
                zIndex: 10,
                ...HANDLE_POSITIONS[handle],
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}

          {/* Mini toolbar */}
          <div
            style={{
              position: 'absolute',
              top: -28,
              right: 0,
              display: 'flex',
              gap: 2,
              background: '#1e293b',
              borderRadius: 4,
              padding: '2px 4px',
              zIndex: 20,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Coordenadas ao vivo */}
            <span style={{ color: '#64748b', padding: '2px 4px', fontSize: 10, fontFamily: 'monospace' }}>
              {element.x},{element.y}
            </span>
            {isLocked && (
              <div style={{ color: '#94a3b8', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                <Lock size={11} />
              </div>
            )}
            <button
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
              onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
              title="Remover elemento"
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Dimensões ao vivo no canto inferior direito */}
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              right: 0,
              background: '#1e293b',
              color: '#64748b',
              padding: '1px 6px',
              borderRadius: 3,
              fontSize: 10,
              fontFamily: 'monospace',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            {element.width}×{element.height}
          </div>
        </>
      )}

      {/* Badge de bloqueado para blocos de página inteira */}
      {isSelected && isLocked && isPageBlock && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <Lock size={10} />
          <span>Bloco bloqueado</span>
        </div>
      )}
    </div>
  );
}
