/**
 * BoxElement — retângulo configurável.
 * Primitivo de design puro: sem dados, só estilo.
 * Usado para construir fundos coloridos, badges, separadores, containers, etc.
 */
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
}

export function BoxElement({ element }: Props) {
  const p = element.props as Record<string, unknown>;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: String(p.bgColor ?? 'transparent'),
        // Bordas: aceita shorthand para todas, ou lado a lado
        border:       String(p.border       ?? '') || undefined,
        borderTop:    String(p.borderTop    ?? '') || undefined,
        borderRight:  String(p.borderRight  ?? '') || undefined,
        borderBottom: String(p.borderBottom ?? '') || undefined,
        borderLeft:   String(p.borderLeft   ?? '') || undefined,
        borderRadius: `${Number(p.borderRadius ?? 0)}px`,
        opacity:      Number(p.opacity ?? 1),
        boxShadow:    Boolean(p.shadow) ? '0 4px 16px rgba(0,0,0,0.1)' : undefined,
      }}
    />
  );
}
