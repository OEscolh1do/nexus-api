/**
 * =============================================================================
 * WEBGL OVERLAY — Canvas R3F Transparente sobre Leaflet (P5-1)
 * =============================================================================
 *
 * Renderiza um <Canvas> React Three Fiber como overlay transparente
 * (position: absolute, pointer-events: none) sobre o MapCore Leaflet.
 *
 * Regras Arquiteturais:
 * - frameloop="demand" → GPU dorme quando idle (0% CPU)
 * - resize={{ debounce: 0 }} → Sinc instantânea com CanvasContainer
 * - gl={{ alpha: true }} → Fundo transparente para ver o Leaflet
 * - Câmera ortográfica sincronizada com bounds do Leaflet via useLeafletSync
 *
 * =============================================================================
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useLeafletSync } from '../hooks/useLeafletSync';
import { ModuleMeshes } from './ModuleMeshes';

// =============================================================================
// SYNC BRIDGE (componente filho do Canvas que ativa o hook)
// =============================================================================

const SyncBridge: React.FC = () => {
  useLeafletSync();
  return null;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const WebGLOverlayInner: React.FC = () => {
  return (
    <div
      className="webgl-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 500, // Abaixo dos HUD controls (z-1000) mas acima dos tiles Leaflet
      }}
    >
      {/* 
        CSS override: R3F v9 creates internal divs with pointer-events: auto  
        for its raycasting system. This bleeds through the parent's 'none'.
        We must force ALL children to inherit pointer-events: none.
      */}
      <style>{`.webgl-overlay * { pointer-events: none !important; }`}</style>
      <Canvas
        orthographic
        frameloop="demand"
        resize={{ debounce: 0 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        camera={{
          position: [0, 0, 100],
          near: -1000,
          far: 1000,
          zoom: 1,
        }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        {/* Luz ambiente para visibilidade uniforme dos módulos */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        {/* Sincronizador de câmera Leaflet ↔ R3F */}
        <SyncBridge />

        {/* Módulos renderizados como InstancedMesh */}
        <ModuleMeshes />
      </Canvas>
    </div>
  );
};

export const WebGLOverlay = React.memo(WebGLOverlayInner);
