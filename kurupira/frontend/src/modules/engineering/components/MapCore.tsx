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

import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
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
  const mapRef = useRef<LeafletMap | null>(null);
  const coordinates = useSolarStore(selectCoordinates);
  const zoom = useSolarStore(selectZoom);

  // Expor a instância do mapa para o hook WebGL assim que montar
  useEffect(() => {
    globalLeafletMapRef.current = mapRef.current;
    return () => {
      globalLeafletMapRef.current = null;
    };
  }, []);

  // Fallback central: Manaus (sede Neonorte) se coordenadas não definidas
  const center: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lng]
    : [-3.1316, -60.0233];

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={zoom}
      maxZoom={22}
      minZoom={3}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Tile Layer — Mapbox satélite com fallback OSM */}
      <TileLayer
        url={tileUrl}
        attribution={tileAttribution}
        maxZoom={22}
        tileSize={MAPBOX_TOKEN ? 512 : 256}
        zoomOffset={MAPBOX_TOKEN ? -1 : 0}
      />

      {/* Sincronização de resize e viewport */}
      <MapInvalidator />
      <MapViewSync />
      <MapFlyToSync />

      {/* Camada de geometria solar */}
      <SolarLayer activeTool={activeTool} />
      <MapMeasureTool activeTool={activeTool} />
    </MapContainer>
  );
};

export const MapCore = React.memo(MapCoreInner);
