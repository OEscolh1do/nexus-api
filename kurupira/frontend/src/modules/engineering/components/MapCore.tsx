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
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
import { useCenterContent } from '../store/panelStore';
import { selectCoordinates, selectZoom, selectProjectSiteLocation } from '@/core/state/solarSelectors';
import { useUIStore, type Tool } from '@/core/state/uiStore';
import { SolarLayer } from './SolarLayer';
import { MapMeasureTool } from './MapMeasureTool';
import { MapFlyToSync } from './MapFlyToSync';
import { MapLayout0Lock } from './MapLayout0Lock';

// = =============================================================================
// TILE CONFIG
// =============================================================================

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const GOOGLE_MAPS_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// =============================================================================
// FALLBACK PROVIDERS (Usados quando o token proprietário está ausente)
// =============================================================================
const OSM_FALLBACK = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  maxNativeZoom: 19
};

const ESRI_SATELLITE_FALLBACK = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
  maxNativeZoom: 19
};

const getTileConfig = (mapType: 'SATELLITE' | 'STREET' | 'GOOGLE_SATELLITE') => {
  // Limite global de zoom da UI (nível 24 permite precisão centimétrica extrema)
  const UI_MAX_ZOOM = 24;

  if (!MAPBOX_TOKEN) {
    if (mapType === 'SATELLITE') {
      return {
        ...ESRI_SATELLITE_FALLBACK,
        maxZoom: UI_MAX_ZOOM,
        tileSize: 256,
        zoomOffset: 0
      };
    }
    
    return {
      ...OSM_FALLBACK,
      maxZoom: UI_MAX_ZOOM,
      tileSize: 256,
      zoomOffset: 0
    };
  }

  const style = mapType === 'SATELLITE' ? 'mapbox/satellite-v9' : 'mapbox/streets-v12';
  
  return {
    url: `https://api.mapbox.com/styles/v1/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
    maxNativeZoom: 22,
    maxZoom: UI_MAX_ZOOM,
    tileSize: 512,
    zoomOffset: -1
  };
};

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
    let timer: any;
    if (isMinimap) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      timer = setTimeout(() => {
        if (map) map.invalidateSize();
      }, 150);
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      timer = setTimeout(() => {
        if (map) map.invalidateSize();
      }, 150);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
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
  activeTool: Tool;
  /** Indica se o usuário está em navegação livre (pós-origem do desenho) */
  isNavigating?: boolean;
  children?: React.ReactNode;
}

const MapCoreInner: React.FC<MapCoreProps> = ({ activeTool, isNavigating = false, children }) => {
  const coordinates = useSolarStore(selectCoordinates);
  const siteLocation = useSolarStore(selectProjectSiteLocation);
  const zoom = useSolarStore(selectZoom);

  // Cadeia de Prioridade de Centro (SPEC-SITE-SYNC):
  // 1. Viewport salva (project.coordinates)
  // 2. Localização do Sítio (clientData.lat/lng)
  // 3. Fallback (Manaus)
  const center: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lng]
    : (siteLocation.lat && siteLocation.lng)
      ? [siteLocation.lat, siteLocation.lng]
      : [-3.1316, -60.0233];

  const mapType = useUIStore(s => s.mapType);
  const tileConfig = getTileConfig(mapType);

  return (
    <MapContainer
      center={center}
      zoom={Math.min(zoom, tileConfig.maxZoom)}
      maxZoom={tileConfig.maxZoom}
      minZoom={3}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Exposes the map instance gobally */}
      <MapRefExposer />

      {/* Tile Layer — Mapbox satélite/streets com fallback OSM/Esri */}
      {mapType !== 'GOOGLE_SATELLITE' && (
        <TileLayer
          key={tileConfig.url}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
          maxNativeZoom={tileConfig.maxNativeZoom}
          tileSize={tileConfig.tileSize}
          zoomOffset={tileConfig.zoomOffset}
          crossOrigin={true}
        />
      )}

      {/* Google Maps Layer (requer API Key no .env.local) */}
      {mapType === 'GOOGLE_SATELLITE' && (
        <ReactLeafletGoogleLayer 
          apiKey={GOOGLE_MAPS_TOKEN || ''} 
          type="satellite"
        />
      )}

      {/* Sincronização de resize, visibilidade e viewport */}
      <MapInvalidator />
      <MapVisibilityObserver />
      <MapMinimapObserver />
      <MapViewSync />
      <MapFlyToSync />
      <MapLayout0Lock isNavigating={isNavigating} />
      <MapRefExposer />
      {/* Camada de geometria solar */}
      <SolarLayer activeTool={activeTool} />
      <MapMeasureTool activeTool={activeTool} />
      {children}
    </MapContainer>
  );
};

export const MapCore = React.memo(MapCoreInner);
