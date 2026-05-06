import React, { useRef, useEffect } from 'react';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
  isEditing: boolean;
  onPropsChange: (props: Record<string, unknown>) => void;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  system:     'system-ui, sans-serif',
  inter:      'Inter, system-ui, sans-serif',
  montserrat: 'Montserrat, system-ui, sans-serif',
};

/**
 * Resolve writing-mode + transform para o prop `rotation`.
 *  0   → horizontal normal
 *  90  → vertical de cima para baixo  (writing-mode: vertical-rl)
 * -90  → vertical de baixo para cima  (writing-mode: vertical-rl + rotate 180°)
 * 180  → texto de cabeça para baixo
 */
function rotationStyle(rotation: number): React.CSSProperties {
  if (rotation === 90)  return { writingMode: 'vertical-rl', textOrientation: 'mixed' };
  if (rotation === -90) return { writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' };
  if (rotation === 180) return { transform: 'rotate(180deg)' };
  return {};
}

export function TextElement({ element, isEditing, onPropsChange }: Props) {
  const {
    content    = 'Texto aqui',
    fontSize   = 16,
    fontWeight = 400,
    color      = '#1a1a1a',
    textAlign  = 'left',
    fontFamily = 'system',
    rotation   = 0,
  } = element.props as Record<string, unknown>;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing || !ref.current) return;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditing]);

  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (isEditing) onPropsChange({ ...element.props, content: e.currentTarget.textContent ?? '' });
      }}
      style={{
        width:      '100%',
        height:     '100%',
        fontSize:   `${fontSize}px`,
        fontWeight: fontWeight as number,
        color:      color as string,
        textAlign:  textAlign as React.CSSProperties['textAlign'],
        fontFamily: FONT_FAMILY_MAP[fontFamily as string] ?? FONT_FAMILY_MAP.system,
        outline:    'none',
        cursor:     isEditing ? 'text' : 'default',
        whiteSpace: 'pre-wrap',
        wordBreak:  'break-word',
        userSelect: isEditing ? 'text' : 'none',
        display:    'flex',
        alignItems: 'center',
        justifyContent:
          textAlign === 'center' ? 'center' :
          textAlign === 'right'  ? 'flex-end' : 'flex-start',
        ...rotationStyle(Number(rotation)),
      }}
    >
      {content as string}
    </div>
  );
}
