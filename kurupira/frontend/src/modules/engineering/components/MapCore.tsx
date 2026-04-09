/**
 * =============================================================================
 * MAP CORE — Motor Leaflet do CenterCanvas (GFX-02)
 * =============================================================================
 *
 * Componente raiz do motor gráfico. Orquestra:
 * - MapContainer (react-leaflet) com TileLayer satélite
 * - MapInvalidator: sincroniza resize do CanvasContainer com o Leaflet
 * - MapViewSync: sincroniza zoom/center com o projectSlice
 *
 * Regras de arquitetura:
 * - Store é o único source of truth
 * - Nenhuma geometria vive apenas no Leaflet
 * - Eventos de mousemove usam refs, não setState
 * - Apenas pointerUp/double-click disparam commit no store
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
import { useCenterContent } from '../store/panelStore';
import { selectCoordinates, selectZoom } from '@/core/state/solarSelectors';
import { SolarLayer } from './SolarLayer';
import { MapMeasureTool } from './MapMeasureTool';
import { MapFlyToSync } from './MapFlyToSync';

// =============================================================================
// TILE CONFIG
// =============================================================================

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const tileUrl = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const tileAttribution = MAPBOX_TOKEN
  ? '© <a href="https://www.mapbox.com/">Mapbox</a>'
  : '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>';

// OSM tiles only support zoom 0-19. Mapbox satellite supports up to 22.
const MAX_ZOOM = MAPBOX_TOKEN ? 22 : 19;

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * MapInvalidator — Escuta mudanças de tamanho do CanvasContainer
 * e chama invalidateSize() para evitar tiles desalinhados.
 */
const MapInvalidator: React.FC = () => {
  const map = useMap();
  const canvasSize = useCanvasSize();

  useEffect(() => {
    // Delay para garantir que o DOM já refletiu as novas dimensões
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 50);
    return () => clearTimeout(timer);
  }, [map, canvasSize.width, canvasSize.height]);

  return null;
};

/**
 * MapVisibilityObserver — Auto-invalida o tamanho do Leaflet quando o mapa
 * transiciona de oculto para visível (display:none → block durante center swap).
 * Usa IntersectionObserver para desacoplar MapCore do panelStore (SPEC-000 §Conflito 4).
 */
const MapVisibilityObserver: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Leaflet precisa recalcular tamanho após display:none → block
          setTimeout(() => map.invalidateSize(), 50);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
};

/**
 * MapMinimapObserver — Escuta o estado isMinimap e trava interações
 * do Leaflet quando ele está encapsulado na doca (evitando bugs de scroll).
 */
const MapMinimapObserver: React.FC = () => {
  const map = useMap();
  const centerContent = useCenterContent();
  const isMinimap = centerContent !== 'map';

  useEffect(() => {
    if (isMinimap) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      setTimeout(() => map.invalidateSize(), 150);
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      setTimeout(() => map.invalidateSize(), 150);
    }
  }, [map, isMinimap]);

  return null;
};

/**
 * MapViewSync — Sincroniza o zoom/center do mapa com o projectSlice.
 * moveend e zoomend disparam commit no store.
 */
const MapViewSync: React.FC = () => {
  const setZoom = useSolarStore(s => s.setZoom);
  const setCoordinates = useSolarStore(s => s.setCoordinates);

  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      setCoordinates(center.lat, center.lng);
    },
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
  });

  return null;
};

/**
 * MapRefExposer -- Extrai a instância real do Leaflet via contexto
 * e injeta na nossa ref global para que scripts fora do React possam usá-la.
 */
const MapRefExposer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    globalLeafletMapRef.current = map;
    return () => {
      globalLeafletMapRef.current = null;
    };
  }, [map]);
  return null;
};

// =============================================================================
// MAIN COMPONENT & GLOBAL REF
// =============================================================================

/** 
 * Referência global mutável para a instância do Leaflet.
 * Permite que o R3F (useLeafletSync) leia o estado (zoom/pan) no ciclo de vida
 * do WebGL a 60fps sem causar re-renders no React ou encher o Redux/Zustand.
 */
export const globalLeafletMapRef: { current: LeafletMap | null } = { current: null };

interface MapCoreProps {
  /** Ferramenta ativa — dita o comportamento de interação */
  activeTool: 'SELECT' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE';
}

const MapCoreInner: React.FC<MapCoreProps> = ({ activeTool }) => {
  const coordinates = useSolarStore(selectCoordinates);
  const zoom = useSolarStore(selectZoom);

  // Fallback central: Manaus (sede Neonorte) se coordenadas não definidas
  const center: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lng]
    : [-3.1316, -60.0233];

  return (
    <MapContainer
      center={center}
      zoom={Math.min(zoom, MAX_ZOOM)}
      maxZoom={MAX_ZOOM}
      minZoom={3}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Exposes the map instance gobally */}
      <MapRefExposer />

      {/* Tile Layer — Mapbox satélite com fallback OSM */}
      <TileLayer
        url={tileUrl}
        attribution={tileAttribution}
        maxZoom={MAX_ZOOM}
        tileSize={MAPBOX_TOKEN ? 512 : 256}
        zoomOffset={MAPBOX_TOKEN ? -1 : 0}
        crossOrigin={true}
      />

      {/* Sincronização de resize, visibilidade e viewport */}
      <MapInvalidator />
      <MapVisibilityObserver />
      <MapMinimapObserver />
      <MapViewSync />
      <MapFlyToSync />

      {/* Camada de geometria solar */}
      <SolarLayer activeTool={activeTool} />
      <MapMeasureTool activeTool={activeTool} />
    </MapContainer>
  );
};

export const MapCore = React.memo(MapCoreInner);
