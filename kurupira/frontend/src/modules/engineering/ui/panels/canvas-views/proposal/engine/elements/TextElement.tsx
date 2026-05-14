import React, { useRef, useEffect } from 'react';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
  isEditing: boolean;
  onPropsChange: (props: Record<string, unknown>) => void;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  system:     'system-ui, -apple-system, sans-serif',
  inter:      'Inter, system-ui, sans-serif',
  montserrat: 'Montserrat, system-ui, sans-serif',
  roboto:     'Roboto, system-ui, sans-serif',
  poppins:    'Poppins, system-ui, sans-serif',
  lato:       'Lato, system-ui, sans-serif',
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

/** Inline formatting commands surfaced in the floating toolbar. */
const FORMAT_BUTTONS = [
  { cmd: 'bold',          label: 'B', style: { fontWeight: 700 } as React.CSSProperties },
  { cmd: 'italic',        label: 'I', style: { fontStyle: 'italic' } as React.CSSProperties },
  { cmd: 'underline',     label: 'U', style: { textDecoration: 'underline' } as React.CSSProperties },
  { cmd: 'strikeThrough', label: 'S', style: { textDecoration: 'line-through' } as React.CSSProperties },
] as const;

export function TextElement({ element, isEditing, onPropsChange }: Props) {
  const {
    content       = 'Texto aqui',
    htmlContent,
    fontSize      = 16,
    fontWeight    = 400,
    color         = '#1a1a1a',
    textAlign     = 'left',
    fontFamily    = 'system',
    rotation      = 0,
    letterSpacing = '',
    textTransform = 'none',
    lineHeight    = '',
    italic        = false,
    underline     = false,
    strikethrough = false,
  } = element.props as Record<string, unknown>;

  const ref = useRef<HTMLDivElement>(null);

  // Track the last saved htmlContent so onInput can skip redundant saves.
  const lastSavedHtml = useRef<string>('');

  useEffect(() => {
    if (!isEditing || !ref.current) return;

    // Seed the contentEditable with existing rich HTML (or plain text fallback).
    const initialHtml = (htmlContent as string | undefined) ?? (content as string);
    ref.current.innerHTML = initialHtml;
    lastSavedHtml.current = initialHtml;

    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Persist the current innerHTML immediately, called from onBlur and onInput. */
  const saveHtml = (html: string) => {
    if (html === lastSavedHtml.current) return;
    lastSavedHtml.current = html;
    onPropsChange({ ...element.props, htmlContent: html });
  };

  // Displayed HTML: prefer rich htmlContent, fall back to plain content.
  const displayHtml = (htmlContent as string | undefined) ?? (content as string) ?? '';

  return (
    // Outer wrapper provides the positioning context for the floating toolbar.
    // overflow: visible is critical so the toolbar (top: -40px) is not clipped.
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: isEditing ? 'visible' : 'hidden',
      }}
    >
      {/* ── Floating inline-formatting toolbar ─────────────────────────────── */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '3px 6px',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            // Ensure the toolbar itself never clips its content.
            overflow: 'visible',
          }}
          // Prevent mousedown from stealing focus away from the contentEditable.
          onMouseDown={(e) => e.preventDefault()}
        >
          {FORMAT_BUTTONS.map(({ cmd, label, style }) => (
            <button
              key={cmd}
              onMouseDown={(e) => {
                e.preventDefault();
                // execCommand applies inline formatting to the current selection
                // within the focused contentEditable. Deprecated but universally
                // supported for this use-case with no library dependency.
                document.execCommand(cmd, false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#e2e8f0',
                cursor: 'pointer',
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 13,
                lineHeight: 1,
                ...style,
              }}
              title={cmd}
              aria-label={cmd}
            >
              {label}
            </button>
          ))}

          {/* Visual separator */}
          <div style={{ width: 1, alignSelf: 'stretch', background: '#334155', margin: '0 2px' }} />

          {/* Inline color picker — changes the foreground color of the selection */}
          <input
            type="color"
            defaultValue="#ffffff"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              document.execCommand('foreColor', false, e.target.value);
            }}
            style={{
              width: 24,
              height: 22,
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
              background: 'none',
              padding: 0,
            }}
            title="Cor do texto selecionado"
            aria-label="Cor do texto selecionado"
          />
        </div>
      )}

      {/* ── Editable / display div ─────────────────────────────────────────── */}
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        // Render stored rich HTML when not in edit mode.
        // In edit mode the content is seeded imperatively via useEffect to avoid
        // React re-rendering collapsing the cursor position mid-edit.
        {...(!isEditing
          ? { dangerouslySetInnerHTML: { __html: displayHtml } }
          : {}
        )}
        onBlur={(e) => {
          // Save innerHTML to preserve execCommand-generated <b>/<i>/<u>/etc. spans.
          if (isEditing) saveHtml(e.currentTarget.innerHTML ?? '');
        }}
        onInput={(e) => {
          // Persist partial edits immediately so clicking outside doesn't lose them.
          if (isEditing) saveHtml((e.currentTarget as HTMLDivElement).innerHTML ?? '');
        }}
        style={{
          width:      '100%',
          height:     '100%',
          fontSize:      `${fontSize}px`,
          fontWeight:    fontWeight as number,
          color:         color as string,
          textAlign:     textAlign as React.CSSProperties['textAlign'],
          fontFamily:    FONT_FAMILY_MAP[fontFamily as string] ?? FONT_FAMILY_MAP.system,
          letterSpacing: String(letterSpacing) || undefined,
          textTransform: (textTransform as React.CSSProperties['textTransform']) ?? 'none',
          lineHeight:    String(lineHeight) || undefined,
          fontStyle:     italic ? 'italic' : 'normal',
          textDecoration: [underline && 'underline', strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
          outline:       'none',
          cursor:        isEditing ? 'text' : 'default',
          whiteSpace:    'pre-wrap',
          wordBreak:     'break-word',
          userSelect:    isEditing ? 'text' : 'none',
          display:    'flex',
          alignItems: 'center',
          justifyContent:
            textAlign === 'center' ? 'center' :
            textAlign === 'right'  ? 'flex-end' : 'flex-start',
          ...rotationStyle(Number(rotation)),
        }}
      />
    </div>
  );
}
