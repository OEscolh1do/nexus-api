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
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: 4 }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <ImageIcon size={32} />
          <p style={{ fontSize: 11, marginTop: 4 }}>Imagem</p>
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
