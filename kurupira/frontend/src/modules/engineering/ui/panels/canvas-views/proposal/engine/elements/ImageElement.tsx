import React, { useState, useEffect } from 'react';
import { ImageIcon, ImageOff } from 'lucide-react';
import type { CanvasElement } from '../types';

/** 10 KB threshold — above this we show a brief loading spinner for base64 blobs */
const LARGE_BASE64_THRESHOLD = 10 * 1024;

const DASHED_CONTAINER: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: '#f8fafc',
  border: '2px dashed #e2e8f0',
  borderRadius: 4,
  color: '#94a3b8',
  userSelect: 'none',
};

interface Props {
  element: CanvasElement;
}

export function ImageElement({ element }: Props) {
  const {
    url = '',
    objectFit = 'contain',
    cropX,
    cropY,
    cropScale,
  } = element.props as Record<string, unknown>;
  const [imgError, setImgError]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);

  // Reset error / loading when the url changes
  useEffect(() => {
    setImgError(false);
    // Show brief loading indicator only for large base64 payloads
    if (typeof url === 'string' && url.startsWith('data:') && url.length > LARGE_BASE64_THRESHOLD) {
      setIsLoading(true);
      // One frame is enough for the browser to parse & paint the image
      const raf = requestAnimationFrame(() => setIsLoading(false));
      return () => cancelAnimationFrame(raf);
    }
    setIsLoading(false);
    return undefined;
  }, [url]);

  if (!url) {
    return (
      <div style={DASHED_CONTAINER}>
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

  if (imgError) {
    return (
      <div style={DASHED_CONTAINER}>
        <ImageOff size={28} strokeWidth={1.5} />
        <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>Imagem inválida</p>
        <p style={{ fontSize: 10, margin: '2px 0 0', opacity: 0.7 }}>URL ou arquivo incorreto</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={DASHED_CONTAINER}>
        {/* Simple CSS spinner — no external dep */}
        <div style={{
          width: 24, height: 24,
          border: '3px solid #e2e8f0',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 10, margin: 0, opacity: 0.6 }}>Carregando imagem…</p>
      </div>
    );
  }

  const useCrop =
    (cropScale as number ?? 1) > 1 ||
    (cropX as number ?? 0) !== 0 ||
    (cropY as number ?? 0) !== 0;

  const imgStyle: React.CSSProperties = useCrop
    ? {
        width: '100%',
        height: '100%',
        objectFit: 'none',
        objectPosition: `${-(cropX as number ?? 0)}px ${-(cropY as number ?? 0)}px`,
        transform: `scale(${cropScale as number ?? 1})`,
        transformOrigin: 'top left',
      }
    : {
        width: '100%',
        height: '100%',
        objectFit: objectFit as React.CSSProperties['objectFit'],
      };

  return (
    <img
      src={url as string}
      alt=""
      onError={() => setImgError(true)}
      style={imgStyle}
      draggable={false}
    />
  );
}
