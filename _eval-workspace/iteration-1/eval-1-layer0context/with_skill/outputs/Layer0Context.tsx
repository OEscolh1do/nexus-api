/**
 * =============================================================================
 * LAYER 0 CONTEXT — Motor de Mapa Base do Módulo de Arranjo
 * =============================================================================
 *
 * Responsabilidades:
 * - Montar a instância Leaflet uma única vez (deps vazia)
 * - Prover tile Google Satellite (subdomains mt0–mt3, sem API key)
 * - Suportar dois modos visuais:
 *     'recon'     → satélite pleno
 *     'blueprint' → tile dessaturado + grid SVG em rgba(99,102,241,0.12)
 * - Exibir estado de erro com CTA quando lat/lng é null
 * - Exportar Layer0ContextValue via React Context e hook useLayer0()
 * =============================================================================
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type L from 'leaflet';

// =============================================================================
// TIPOS PÚBLICOS
// =============================================================================

export type Layer0Mode = 'recon' | 'blueprint';

export interface Layer0ContextValue {
  /** Instância nativa do Leaflet. Null antes de montar. */
  map: L.Map | null;
  /** Modo visual atual. */
  mode: Layer0Mode;
  /** Alterna o modo visual. */
  setMode: (mode: Layer0Mode) => void;
  /**
   * Origem de pixel do viewport atual no CRS do Leaflet.
   * Útil para camadas superiores alinharem elementos em px.
   * Null antes de montar.
   */
  pixelOrigin: L.Point | null;
  /** Zoom atual do mapa. */
  zoom: number;
}

// =============================================================================
// CONTEXT
// =============================================================================

const Layer0Context = createContext<Layer0ContextValue | null>(null);

// =============================================================================
// CONSTANTES
// =============================================================================

const TILE_URL_TEMPLATE =
  'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

const TILE_SUBDOMAINS = ['0', '1', '2', '3'];

const DEFAULT_ZOOM = 19;
const MIN_ZOOM = 3;
const MAX_ZOOM = 22;

/** Passo do grid SVG em modo blueprint (px). */
const GRID_STEP = 20;

/** Cor do grid em modo blueprint. */
const GRID_COLOR = 'rgba(99,102,241,0.12)';

// =============================================================================
// HELPERS — GRID SVG
// =============================================================================

function createGridSvg(width: number, height: number): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');

  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('xmlns', ns);
  svg.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:500',
  ].join(';');

  const cols = Math.ceil(width / GRID_STEP) + 1;
  const rows = Math.ceil(height / GRID_STEP) + 1;

  for (let c = 0; c < cols; c++) {
    const x = c * GRID_STEP;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(height));
    line.setAttribute('stroke', GRID_COLOR);
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  for (let r = 0; r < rows; r++) {
    const y = r * GRID_STEP;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(width));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', GRID_COLOR);
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  return svg;
}

// =============================================================================
// PROVIDER PROPS
// =============================================================================

export interface Layer0ProviderProps {
  lat: number | null;
  lng: number | null;
  initialMode?: Layer0Mode;
  initialZoom?: number;
  onErrorCta: () => void;
  children: React.ReactNode;
}

// =============================================================================
// PROVIDER
// =============================================================================

export const Layer0Provider: React.FC<Layer0ProviderProps> = ({
  lat,
  lng,
  initialMode = 'recon',
  initialZoom = DEFAULT_ZOOM,
  onErrorCta,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gridSvgRef = useRef<SVGSVGElement | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mode, setModeState] = useState<Layer0Mode>(initialMode);
  const [pixelOrigin, setPixelOrigin] = useState<L.Point | null>(null);
  const [zoom, setZoom] = useState<number>(initialZoom);

  // Mount: deps vazia — mapa criado uma única vez
  useEffect(() => {
    if (!containerRef.current) return;
    if (lat === null || lng === null) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet') as typeof import('leaflet');

    const container = containerRef.current;
    if (mapRef.current) return; // guard StrictMode

    const map = L.map(container, {
      center: [lat, lng],
      zoom: initialZoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    const tileLayer = L.tileLayer(TILE_URL_TEMPLATE, {
      subdomains: TILE_SUBDOMAINS,
      maxZoom: MAX_ZOOM,
      maxNativeZoom: 20,
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    const syncState = () => {
      setZoom(map.getZoom());
      setPixelOrigin(map.getPixelOrigin());
    };

    map.on('zoomend moveend', syncState);
    syncState();
    setMapInstance(map);

    return () => {
      map.off('zoomend moveend', syncState);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modo visual: classes CSS + grid SVG
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mode === 'blueprint') {
      container.classList.add('layer-0--blueprint');
      container.classList.remove('layer-0--recon');

      if (!gridSvgRef.current) {
        const { offsetWidth: w, offsetHeight: h } = container;
        const svg = createGridSvg(w || 800, h || 600);
        container.appendChild(svg);
        gridSvgRef.current = svg;
      }
    } else {
      container.classList.add('layer-0--recon');
      container.classList.remove('layer-0--blueprint');

      if (gridSvgRef.current) {
        gridSvgRef.current.remove();
        gridSvgRef.current = null;
      }
    }
  }, [mode]);

  const setMode = useCallback((next: Layer0Mode) => {
    setModeState(next);
  }, []);

  // Estado de erro: coordenadas ausentes
  if (lat === null || lng === null) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#94a3b8',
          gap: '12px',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', textAlign: 'center', maxWidth: '280px' }}>
          📍 Localização do projeto não definida.
        </p>
        <button
          onClick={onErrorCta}
          style={{
            padding: '8px 20px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '6px',
            color: 'rgba(99,102,241,0.9)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Definir localização
        </button>
      </div>
    );
  }

  const contextValue: Layer0ContextValue = {
    map: mapInstance,
    mode,
    setMode,
    pixelOrigin,
    zoom,
  };

  return (
    <Layer0Context.Provider value={contextValue}>
      {/*
        CSS global esperado:
        .layer-0--blueprint .leaflet-tile-pane { filter: brightness(0.5) saturate(0); transition: filter 400ms ease; }
        .layer-0--recon .leaflet-tile-pane { filter: brightness(1) saturate(1); transition: filter 400ms ease; }
      */}
      <div
        ref={containerRef}
        className="layer-0--recon"
        style={{ width: '100%', height: '100%', position: 'relative', background: '#020617' }}
      />
      {children}
    </Layer0Context.Provider>
  );
};

// =============================================================================
// HOOK PÚBLICO
// =============================================================================

export function useLayer0(): Layer0ContextValue {
  const ctx = useContext(Layer0Context);
  if (!ctx) {
    throw new Error(
      '[useLayer0] Hook usado fora do <Layer0Provider>.',
    );
  }
  return ctx;
}

export { Layer0Context };
