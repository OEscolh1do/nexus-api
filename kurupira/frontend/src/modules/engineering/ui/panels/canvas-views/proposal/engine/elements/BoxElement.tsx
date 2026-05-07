/**
 * BoxElement — retângulo configurável.
 * Primitivo de design puro: sem dados, só estilo.
 * Usado para construir fundos coloridos, badges, separadores, containers, etc.
 */
import React from 'react';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
}

export function BoxElement({ element }: Props) {
  const p = element.props as Record<string, unknown>;

  // borderRadius aceita número (px) ou string direta (ex: "4px 0 0 4px", "50%")
  const borderRadiusRaw = p.borderRadius ?? 0;
  const borderRadius = typeof borderRadiusRaw === 'string' && isNaN(Number(borderRadiusRaw))
    ? borderRadiusRaw
    : `${Number(borderRadiusRaw)}px`;

  // gradient sobrescreve backgroundColor quando definido
  const gradient = String(p.gradient ?? '').trim();

  return (
    <div
      style={{
        width:        '100%',
        height:       '100%',
        boxSizing:    'border-box',
        background:   gradient || undefined,
        backgroundColor: !gradient ? String(p.bgColor ?? 'transparent') : undefined,
        border:       String(p.border       ?? '') || undefined,
        borderTop:    String(p.borderTop    ?? '') || undefined,
        borderRight:  String(p.borderRight  ?? '') || undefined,
        borderBottom: String(p.borderBottom ?? '') || undefined,
        borderLeft:   String(p.borderLeft   ?? '') || undefined,
        borderRadius,
        opacity:      Number(p.opacity ?? 1),
        boxShadow:    Boolean(p.shadow) ? '0 4px 16px rgba(0,0,0,0.1)' : undefined,
        overflow:     String(p.overflow ?? 'visible') as React.CSSProperties['overflow'],
      }}
    />
  );
}
