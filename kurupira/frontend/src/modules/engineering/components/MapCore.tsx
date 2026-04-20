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
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
import { useCenterContent } from '../store/panelStore';
import { selectCoordinates, selectZoom, selectProjectSiteLocation } from '@/core/state/solarSelectors';
import { useUIStore, type Tool } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { SolarLayer } from './SolarLayer';
import { MapMeasureTool } from './MapMeasureTool';
import { MapFlyToSync } from './MapFlyToSync';
import { MapLayout0Lock } from './MapLayout0Lock';
import { MapViewAutoFit } from './MapViewAutoFit';

// =============================================================================
// TILE CONFIG
// =============================================================================

const GOOGLE_MAPS_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const UI_MAX_ZOOM = 24;

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
 * MapPropSync — Sincroniza props externas com o Leaflet.
 * Útil para Previews/Modais onde o centro é controlado via props, não pelo store.
 */
const MapPropSync: React.FC<{ center?: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
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
  /** Centro opcional (sobrescreve o store) */
  center?: [number, number];
  /** Zoom opcional (sobrescreve o store) */
  zoom?: number;
  /** Se deve mostrar camadas de engenharia (SolarLayer, Measure, etc) */
  showLayers?: boolean;
  /** Se o mapa é apenas leitura (não sincroniza pan/zoom de volta para o store) */
  readOnly?: boolean;
  children?: React.ReactNode;
}

const MapCoreInner: React.FC<MapCoreProps> = ({ 
  activeTool, 
  isNavigating = false, 
  center: propsCenter,
  zoom: propsZoom,
  showLayers = true,
  readOnly = false,
  children 
}) => {
  const coordinates = useSolarStore(selectCoordinates);
  const siteLocation = useSolarStore(selectProjectSiteLocation);
  const storeZoom = useSolarStore(selectZoom);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);

  // Cadeia de Prioridade de Centro (SPEC-SITE-SYNC):
  // 1. Props (sobrescreve tudo)
  // 2. Viewport salva (project.coordinates)
  // 3. Localização do Sítio (clientData.lat/lng)
  // 4. Fallback (Manaus)
  const finalCenter: [number, number] = propsCenter 
    ? propsCenter
    : coordinates
      ? [coordinates.lat, coordinates.lng]
      : (siteLocation.lat && siteLocation.lng)
        ? [siteLocation.lat, siteLocation.lng]
        : [-3.1316, -60.0233];

  const finalZoom = propsZoom ?? Math.min(storeZoom, UI_MAX_ZOOM);

  return (
    <div className={cn(
      "w-full h-full transition-colors duration-700",
      canvasViewMode === 'BLUEPRINT' ? "bg-slate-900" : "bg-slate-950"
    )}>
      <MapContainer
        center={finalCenter}
        zoom={finalZoom}
        maxZoom={UI_MAX_ZOOM}
        minZoom={3}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {/* Exposes the map instance gobally */}
        <MapRefExposer />

        {/* Sincronização de props externas (centro/zoom via props) */}
        <MapPropSync center={propsCenter} zoom={propsZoom} />

        {/* Google Maps Layer — Oculto em modo Prancheta (CAD Mode) */}
        {canvasViewMode !== 'BLUEPRINT' && (
          <ReactLeafletGoogleLayer 
            apiKey={GOOGLE_MAPS_TOKEN || ''} 
            type="satellite"
          />
        )}

        {/* Sincronização de resize, visibilidade e viewport */}
        <MapInvalidator />
        <MapVisibilityObserver />
        <MapMinimapObserver />
        {!readOnly && <MapViewSync />}
        {!readOnly && <MapFlyToSync />}
        <MapLayout0Lock isNavigating={isNavigating} />
        
        {/* Auto-zoom ao mudar para modo Prancheta */}
        {!readOnly && <MapViewAutoFit />}

        {/* Camada de geometria solar (Opcional) */}
        {showLayers && (
          <>
            <SolarLayer activeTool={activeTool} />
            <MapMeasureTool activeTool={activeTool} />
          </>
        )}
        {children}
      </MapContainer>
    </div>
  );
};

export const MapCore = React.memo(MapCoreInner);
