import React from 'react';
import { ImageIcon } from 'lucide-react';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
}

export function ImageElement({ element }: Props) {
  const { url = '', objectFit = 'contain' } = element.props as Record<string, unknown>;

  if (!url) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#f8fafc',
          border: '2px dashed #cbd5e1',
          borderRadius: 4,
          color: '#94a3b8',
          userSelect: 'none',
        }}
      >
        <ImageIcon size={28} strokeWidth={1.5} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>Sem imagem</p>
          <p style={{ fontSize: 10, margin: '2px 0 0', opacity: 0.7 }}>
            Use Propriedades → Selecionar imagem
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={url as string}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: objectFit as React.CSSProperties['objectFit'] }}
      draggable={false}
    />
  );
}
