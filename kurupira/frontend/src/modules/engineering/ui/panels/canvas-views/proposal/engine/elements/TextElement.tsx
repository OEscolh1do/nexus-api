import React, { useRef, useEffect } from 'react';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
  isEditing: boolean;
  onPropsChange: (props: Record<string, unknown>) => void;
}

export function TextElement({ element, isEditing, onPropsChange }: Props) {
  const { content = 'Texto aqui', fontSize = 16, fontWeight = 400, color = '#1a1a1a', textAlign = 'left', fontFamily = 'system' } = element.props as Record<string, unknown>;
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

  const fontFamilyMap: Record<string, string> = {
    system: 'system-ui, sans-serif',
    inter: 'Inter, system-ui, sans-serif',
    montserrat: 'Montserrat, system-ui, sans-serif',
  };

  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (isEditing) onPropsChange({ ...element.props, content: e.currentTarget.textContent ?? '' });
      }}
      style={{
        width: '100%',
        height: '100%',
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight as number,
        color: color as string,
        textAlign: textAlign as React.CSSProperties['textAlign'],
        fontFamily: fontFamilyMap[fontFamily as string] ?? fontFamilyMap.system,
        outline: 'none',
        cursor: isEditing ? 'text' : 'default',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: isEditing ? 'text' : 'none',
      }}
    >
      {content as string}
    </div>
  );
}
