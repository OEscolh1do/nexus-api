/**
 * =============================================================================
 * CANVAS CONTAINER — Versão Unificada (PGFX-01)
 * =============================================================================
 *
 * Wrapper com ResizeObserver que observa o tamanho real do contêiner pai
 * e expõe dimensões via Context + callback onResize.
 *
 * Corrige:
 * - A2: Duas versões conflitantes unificadas em uma só
 * - A3: data-width/height substituído por Context (Leaflet-safe)
 * - A8: API clara para evitar duplo envolvimento
 *
 * Uso:
 *   <CanvasContainer onResize={({ width, height }) => map.invalidateSize()}>
 *     <MapCore />
 *   </CanvasContainer>
 * =============================================================================
 */

import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';

// =============================================================================
// CONTEXT — Dimensões do contêiner disponíveis para qualquer filho
// =============================================================================

export interface CanvasSize {
  /** Largura em pixels do contêiner */
  width: number;
  /** Altura em pixels do contêiner */
  height: number;
}

const CanvasSizeContext = createContext<CanvasSize>({ width: 0, height: 0 });

/**
 * Hook para acessar as dimensões do CanvasContainer mais próximo.
 * Útil para motores de rendering que precisam saber o tamanho do viewport.
 */
export const useCanvasSize = (): CanvasSize => useContext(CanvasSizeContext);

// =============================================================================
// PROPS
// =============================================================================

interface CanvasContainerProps {
  /** Conteúdo filho (motor gráfico, mapa, etc.) */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
  /**
   * Callback disparado a cada resize do contêiner.
   * Leaflet deve chamar map.invalidateSize() aqui.
   */
  onResize?: (size: CanvasSize) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ children, className, onResize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 });
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (!entry) return;

    const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
    const rounded = { width: Math.round(width), height: Math.round(height) };

    // 1. Mutação de ref — sem re-render (para uso no rAF do motor gráfico)
    sizeRef.current = rounded;

    // 2. setState — propaga via Context para consumidores React
    setSize((prev) => {
      if (prev.width === rounded.width && prev.height === rounded.height) {
        return prev;
      }
      return rounded;
    });

    // 3. Callback para o motor Leaflet chamar invalidateSize()
    onResize?.(rounded);
  }, [onResize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(el, { box: 'content-box' });

    return () => observer.disconnect();
  }, [handleResize]);

  return (
    <CanvasSizeContext.Provider value={size}>
      <div
        ref={containerRef}
        className={className}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </CanvasSizeContext.Provider>
  );
};
