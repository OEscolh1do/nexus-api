import React, { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
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
  selfId?: string,
): SnapResult {
  if (!enabled || others.length === 0) return { x, y, guides: { x: [], y: [] } };

  // Find the single closest snap candidate for X and Y independently.
  // Using the original x/y for all comparisons prevents drift accumulation
  // when multiple elements are near the same guide line.
  let bestDx = Infinity;
  let bestDy = Infinity;
  let snapTargetX: number | null = null;
  let snapTargetY: number | null = null;

  const myLeft    = x;
  const myCenter  = x + w / 2;
  const myRight   = x + w;
  const myTop     = y;
  const myCenterY = y + h / 2;
  const myBottom  = y + h;

  for (const other of others) {
    if (other.id === selfId) continue; // skip self when full element list is passed
    const oRight  = other.x + other.width;
    const oBottom = other.y + other.height;
    const oCx     = other.x + other.width / 2;
    const oCy     = other.y + other.height / 2;

    const xPairs: [number, number][] = [
      [myLeft,    other.x], [myLeft,    oRight], [myLeft,    oCx],
      [myCenter,  other.x], [myCenter,  oRight], [myCenter,  oCx],
      [myRight,   other.x], [myRight,   oRight], [myRight,   oCx],
    ];
    for (const [mine, theirs] of xPairs) {
      const d = Math.abs(mine - theirs);
      if (d < scaledThreshold && d < bestDx) {
        bestDx = d;
        snapTargetX = theirs - (mine - x); // delta to apply to x
      }
    }

    const yPairs: [number, number][] = [
      [myTop,     other.y], [myTop,     oBottom], [myTop,     oCy],
      [myCenterY, other.y], [myCenterY, oBottom], [myCenterY, oCy],
      [myBottom,  other.y], [myBottom,  oBottom], [myBottom,  oCy],
    ];
    for (const [mine, theirs] of yPairs) {
      const d = Math.abs(mine - theirs);
      if (d < scaledThreshold && d < bestDy) {
        bestDy = d;
        snapTargetY = theirs - (mine - y);
      }
    }
  }

  const snappedX = snapTargetX ?? x;
  const snappedY = snapTargetY ?? y;

  // Collect guide lines at the snapped position
  const guidesX: number[] = [];
  const guidesY: number[] = [];
  if (snapTargetX !== null) {
    for (const other of others) {
      const oRight = other.x + other.width;
      const oCx    = other.x + other.width / 2;
      for (const ref of [other.x, oRight, oCx]) {
        const snLeft = snappedX, snCx = snappedX + w / 2, snRight = snappedX + w;
        if (Math.abs(snLeft - ref) < 1 || Math.abs(snCx - ref) < 1 || Math.abs(snRight - ref) < 1) {
          if (!guidesX.includes(ref)) guidesX.push(ref);
        }
      }
    }
  }
  if (snapTargetY !== null) {
    for (const other of others) {
      const oBottom = other.y + other.height;
      const oCy     = other.y + other.height / 2;
      for (const ref of [other.y, oBottom, oCy]) {
        const snTop = snappedY, snCy = snappedY + h / 2, snBottom = snappedY + h;
        if (Math.abs(snTop - ref) < 1 || Math.abs(snCy - ref) < 1 || Math.abs(snBottom - ref) < 1) {
          if (!guidesY.includes(ref)) guidesY.push(ref);
        }
      }
    }
  }

  return { x: snappedX, y: snappedY, guides: { x: guidesX, y: guidesY } };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  isGrouped: boolean;
  canvasScale: number;
  gridSize: number;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  otherElements: CanvasElement[];
  onSelect: (shiftKey?: boolean) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onGuideChange: (guides: GuideLines) => void;
  onGroupDragStart?: () => void;
  onGroupDragDelta?: (dx: number, dy: number) => void;
  onGroupDragEnd?: () => void;
  onMutationStart?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  groupEditMode?: boolean;
  isInGroupEdit?: boolean;
  onEnterGroupEdit?: () => void;
}

export function CanvasElementWrapper({
  element, isSelected, isGrouped, canvasScale,
  gridSize, snapEnabled, guidesEnabled, otherElements,
  onSelect, onUpdate, onGuideChange,
  onGroupDragStart, onGroupDragDelta, onGroupDragEnd, onMutationStart,
  onDuplicate, onRemove,
  groupEditMode, isInGroupEdit, onEnterGroupEdit,
}: Props) {
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeTooltip, setResizeTooltip] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [rotationTooltip, setRotationTooltip] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef   = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemW: number; elemH: number; handle: ResizeHandle } | null>(null);
  const dragAbortRef   = useRef<AbortController | null>(null);
  const rotationAbortRef = useRef<AbortController | null>(null);

  // Clean up any dangling window listeners when the element is removed mid-drag
  useEffect(() => () => {
    dragAbortRef.current?.abort();
    rotationAbortRef.current?.abort();
  }, []);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const timerId = setTimeout(() => {
      window.addEventListener('click', close, { once: true });
    }, 0);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const isLocked    = element.locked;
  const isPageBlock = element.type.startsWith('page-');

  const scaledThreshold = GUIDE_THRESHOLD / canvasScale;

  // ── Move drag ──────────────────────────────────────────────────────────────

  const handleMouseDownMove = useCallback((e: React.MouseEvent) => {
    onMutationStart?.();
    // Group drag: when element is part of a multi-selection group
    dragAbortRef.current?.abort();
    dragAbortRef.current = new AbortController();
    const { signal } = dragAbortRef.current;

    if (isGrouped && onGroupDragStart && onGroupDragDelta && onGroupDragEnd) {
      dragStartRef.current = null;
      e.preventDefault();
      e.stopPropagation();
      onGroupDragStart();
      const startX = e.clientX;
      const startY = e.clientY;

      window.addEventListener('mousemove', (ev: MouseEvent) => {
        onGroupDragDelta((ev.clientX - startX) / canvasScale, (ev.clientY - startY) / canvasScale);
      }, { signal });
      window.addEventListener('mouseup', () => {
        onGroupDragEnd();
        onGuideChange({ x: [], y: [] });
      }, { signal });
      return;
    }

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

    window.addEventListener('mousemove', (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      setIsDragging(true);
      const dx = (ev.clientX - dragStartRef.current.mouseX) / canvasScale;
      const dy = (ev.clientY - dragStartRef.current.mouseY) / canvasScale;

      let rawX = Math.max(0, Math.min(A4_WIDTH - element.width, dragStartRef.current.elemX + dx));
      let rawY = Math.max(0, Math.min(A4_HEIGHT - element.height, dragStartRef.current.elemY + dy));

      rawX = snapToGrid(rawX, gridSize, snapEnabled);
      rawY = snapToGrid(rawY, gridSize, snapEnabled);

      const { x, y, guides } = applySmartGuides(
        rawX, rawY, element.width, element.height,
        otherElements, scaledThreshold, guidesEnabled, element.id,
      );

      onGuideChange(guides);
      onUpdate({ x: Math.round(x), y: Math.round(y) });
    }, { signal });

    window.addEventListener('mouseup', () => {
      setIsDragging(false);
      dragStartRef.current = null;
      onGuideChange({ x: [], y: [] });
    }, { signal });
  }, [isGrouped, isLocked, isPageBlock, isTextEditing, element, canvasScale, gridSize, snapEnabled, guidesEnabled, otherElements, scaledThreshold, onSelect, onUpdate, onGuideChange, onGroupDragStart, onGroupDragDelta, onGroupDragEnd, onMutationStart]);

  // ── Resize drag ────────────────────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (isLocked) return;
    onMutationStart?.();
    e.preventDefault();
    e.stopPropagation();

    const lockAspect = e.shiftKey;
    const aspectRatio = element.width / element.height;

    // Clear any in-progress move drag before starting resize
    dragStartRef.current = null;

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: element.x,
      elemY: element.y,
      elemW: element.width,
      elemH: element.height,
      handle,
    };

    dragAbortRef.current?.abort();
    dragAbortRef.current = new AbortController();
    const { signal } = dragAbortRef.current;

    const MIN_SIZE = 20;

    window.addEventListener('mousemove', (ev: MouseEvent) => {
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

      if (lockAspect) {
        const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle);
        const movesW = ['nw', 'ne', 'sw', 'se', 'w', 'e'].includes(handle);
        const movesH = ['nw', 'ne', 'sw', 'se', 'n', 's'].includes(handle);
        if (isCorner) {
          const deltaW = Math.abs(newW - element.width);
          const deltaH = Math.abs(newH - element.height);
          if (deltaW > deltaH) {
            newH = Math.round(newW / aspectRatio);
          } else {
            newW = Math.round(newH * aspectRatio);
          }
        } else if (movesW && !movesH) {
          newH = Math.round(newW / aspectRatio);
        } else if (movesH && !movesW) {
          newW = Math.round(newH * aspectRatio);
        }
      }

      setResizeTooltip({ x: ev.clientX + 12, y: ev.clientY + 12, w: Math.round(newW), h: Math.round(newH) });
      onUpdate({ x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
    }, { signal });

    window.addEventListener('mouseup', () => {
      resizeStartRef.current = null;
      setTimeout(() => setResizeTooltip(null), 800);
    }, { signal });
  }, [isLocked, element, canvasScale, gridSize, snapEnabled, onUpdate, onMutationStart]);

  // ── Rotation handle drag ───────────────────────────────────────────────────

  const handleRotationMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked) return;
    onMutationStart?.();
    e.preventDefault();
    e.stopPropagation();

    // Compute element center in screen coordinates from the wrapper's bounding rect.
    // We locate the wrapper's DOM node via the event's currentTarget's parent (the wrapper div).
    const handleEl = e.currentTarget as HTMLElement;
    const wrapperEl = handleEl.closest('[data-canvas-wrapper]') as HTMLElement | null;
    let centerX: number;
    let centerY: number;
    if (wrapperEl) {
      const rect = wrapperEl.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    } else {
      // Fallback: approximate from element position + scale (less accurate but safe)
      centerX = e.clientX;
      centerY = e.clientY;
    }

    rotationAbortRef.current?.abort();
    rotationAbortRef.current = new AbortController();
    const { signal } = rotationAbortRef.current;

    window.addEventListener('mousemove', (ev: MouseEvent) => {
      const rawAngle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI + 90;
      // Normalise to [0, 360)
      const normalised = ((rawAngle % 360) + 360) % 360;
      const snapped = ev.shiftKey ? Math.round(normalised / 15) * 15 : Math.round(normalised);
      setRotationTooltip({ x: ev.clientX + 12, y: ev.clientY + 12, angle: snapped });
      onUpdate({ rotation: snapped });
    }, { signal });

    window.addEventListener('mouseup', () => {
      rotationAbortRef.current?.abort();
      setTimeout(() => setRotationTooltip(null), 800);
    }, { signal });
  }, [isLocked, onUpdate, onMutationStart]);

  // ── Double click para editar texto ─────────────────────────────────────────

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Se elemento está em grupo e NÃO estamos em modo de edição: entra no modo
    if (element.groupId && !isInGroupEdit && !groupEditMode) {
      e.stopPropagation();
      onEnterGroupEdit?.();
      return;
    }
    // Edição de texto (dentro ou fora de grupo)
    if (element.type === 'text') {
      e.stopPropagation();
      setIsTextEditing(true);
    }
  }, [element.groupId, element.type, isInGroupEdit, groupEditMode, onEnterGroupEdit]);

  const handlePropsChange = useCallback((props: Record<string, unknown>) => {
    onUpdate({ props });
    setIsTextEditing(false);
  }, [onUpdate]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const isOutsideGroup = groupEditMode && !isInGroupEdit;
  const opacity = isOutsideGroup ? 0.2 : element.visible ? 1 : 0.3;

  return (
    <>
    <div
      data-canvas-wrapper
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        opacity,
        pointerEvents: isOutsideGroup ? 'none' : 'auto',
        outline: isGrouped
          ? '1.5px dashed #818cf8'
          : isSelected
            ? '2px solid #6366f1'
            : isHovered && !isPageBlock
              ? '1px solid rgba(99,102,241,0.4)'
              : 'none',
        outlineOffset: 1,
        cursor: isLocked || isPageBlock
          ? 'default'
          : isTextEditing
            ? 'text'
            : isDragging
              ? 'grabbing'
              : 'grab',
        userSelect: 'none',
        boxSizing: 'border-box',
        overflow: isPageBlock ? 'visible' : 'hidden',
        transform: `rotate(${element.rotation ?? 0}deg) scaleX(${element.flipX ? -1 : 1}) scaleY(${element.flipY ? -1 : 1})`,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDownMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(e.shiftKey); }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        if (isPageBlock) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(e.shiftKey);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <CanvasElementRenderer
        element={element}
        isEditing={isTextEditing}
        onPropsChange={handlePropsChange}
      />

      {/* Resize handles + rotation handle quando selecionado */}
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
                border: '1.5px solid #6366f1',
                borderRadius: 2,
                cursor: HANDLE_CURSORS[handle],
                zIndex: 10,
                ...HANDLE_POSITIONS[handle],
                // Scale handles to stay 8px screen-size regardless of canvas zoom
                // Merge with any existing transform from HANDLE_POSITIONS (edge-midpoint handles)
                transform: HANDLE_POSITIONS[handle].transform
                  ? `${HANDLE_POSITIONS[handle].transform} scale(${1 / canvasScale})`
                  : `scale(${1 / canvasScale})`,
                transformOrigin: 'center',
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}

          {/* Rotation handle — stem + circle above top-center */}
          {!isLocked && (
            <>
              {/* Connecting stem: 1px wide, 28px tall (screen-space), centered above top edge */}
              <div
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 28,
                  background: '#6366f1',
                  left: '50%',
                  top: -4,
                  // stem sits between top handle (-4px) and rotation circle (-32px screen-space)
                  // We translate up so its bottom aligns with the element's top edge
                  transform: `translateX(-50%) translateY(-100%) scale(${1 / canvasScale})`,
                  transformOrigin: 'bottom center',
                  pointerEvents: 'none',
                  zIndex: 11,
                }}
              />
              {/* Rotation circle handle */}
              <div
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#6366f1',
                  border: '1.5px solid #ffffff',
                  cursor: 'crosshair',
                  left: '50%',
                  top: -4,
                  // Position the circle 28px above the element top in screen space
                  transform: `translateX(-50%) translateY(calc(-100% - 28px)) scale(${1 / canvasScale})`,
                  transformOrigin: 'bottom center',
                  zIndex: 12,
                }}
                onMouseDown={handleRotationMouseDown}
              />
            </>
          )}
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

    {resizeTooltip && createPortal(
      <div style={{
        position: 'fixed',
        left: resizeTooltip.x,
        top: resizeTooltip.y,
        background: '#0f172a',
        border: '1px solid #1e293b',
        color: '#94a3b8',
        padding: '2px 6px',
        borderRadius: 3,
        fontSize: 10,
        fontFamily: 'monospace',
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
        zIndex: 99999,
        whiteSpace: 'nowrap',
      }}>
        {resizeTooltip.w} × {resizeTooltip.h}
      </div>,
      document.body,
    )}

    {rotationTooltip && createPortal(
      <div style={{
        position: 'fixed',
        left: rotationTooltip.x,
        top: rotationTooltip.y,
        background: '#0f172a',
        border: '1px solid #1e293b',
        color: '#94a3b8',
        padding: '2px 6px',
        borderRadius: 3,
        fontSize: 10,
        fontFamily: 'monospace',
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
        zIndex: 99999,
        whiteSpace: 'nowrap',
      }}>
        {rotationTooltip.angle}°
      </div>,
      document.body,
    )}

    {contextMenu && !isPageBlock && createPortal(
      <div
        role="menu"
        aria-label="Ações do elemento"
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 99999,
          minWidth: 160,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bring to front */}
        <button
          role="menuitem"
          tabIndex={-1}
          autoFocus
          style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12, color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          onClick={() => {
            const maxZ = otherElements.length > 0 ? Math.max(...otherElements.map(e => e.zIndex)) : element.zIndex;
            onUpdate({ zIndex: maxZ + 1 });
            setContextMenu(null);
          }}
        >
          Trazer para frente
        </button>
        {/* Send to back */}
        <button
          role="menuitem"
          tabIndex={-1}
          style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12, color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          onClick={() => {
            const minZ = otherElements.length > 0 ? Math.min(...otherElements.map(e => e.zIndex)) : element.zIndex;
            onUpdate({ zIndex: minZ - 1 });
            setContextMenu(null);
          }}
        >
          Enviar para trás
        </button>
        {/* Divider */}
        <div style={{ height: 1, background: '#334155', margin: '2px 0' }} />
        {/* Duplicate */}
        <button
          role="menuitem"
          tabIndex={-1}
          style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12, color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          onClick={() => { onDuplicate?.(); setContextMenu(null); }}
        >
          Duplicar
        </button>
        {/* Delete */}
        {!isLocked && (
          <button
            role="menuitem"
            tabIndex={-1}
            style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3f1212')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            onClick={() => { onRemove?.(); setContextMenu(null); }}
          >
            Excluir
          </button>
        )}
      </div>,
      document.body,
    )}
    </>
  );
}
