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
import L, { type Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
import { useCenterContent } from '../store/panelStore';
import { selectCoordinates, selectZoom, selectProjectSiteLocation } from '@/core/state/solarSelectors';
import { useUIStore, type Tool, type CanvasViewMode } from '@/core/state/uiStore';
import { SolarLayer } from './SolarLayer';
import { MapMeasureTool } from './MapMeasureTool';
import { MapFlyToSync } from './MapFlyToSync';
import { MapLayout0Lock } from './MapLayout0Lock';
import { MapZoomSlider } from './MapZoomSlider';

// =============================================================================
// TILE CONFIG
// =============================================================================

const GOOGLE_MAPS_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const UI_MAX_ZOOM = 24;

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * MapReadyObserver — Monitora o evento nativo `load` do Leaflet para saber
 * exatamente quando os tiles visíveis terminaram de renderizar.
 *
 * Conectado ao uiStore via setAppLoading / clearAppLoading para garantir
 * que apenas UM loader por vez seja exibido (sem race conditions).
 *
 * Fallback de 3s cobre: modo Blueprint (sem tiles), API key ausente, modo offline.
 */
const MapReadyObserver: React.FC = () => {
  const map = useMap();
  const setAppLoading = useUIStore(s => s.setAppLoading);
  const clearAppLoading = useUIStore(s => s.clearAppLoading);

  useEffect(() => {
    setAppLoading('map-tiles', 'Carregando mapa...');

    const handleLoad = () => clearAppLoading();
    map.once('load', handleLoad);

    // Fallback: tiles podem não disparar 'load' em modo Blueprint ou sem API key
    const fallback = setTimeout(() => clearAppLoading(), 3000);

    return () => {
      map.off('load', handleLoad);
      clearTimeout(fallback);
      // Garante limpeza se o componente desmontar antes do evento
      clearAppLoading();
    };
  }, [map, setAppLoading, clearAppLoading]);

  return null;
};

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
 * MapInteractionOrchestrator — Gerencia hierarquicamente as permissões de 
 * navegação do Leaflet (Pan/Zoom) com base no contexto e ferramenta.
 */
const MapInteractionOrchestrator: React.FC<{ 
  activeTool: Tool; 
  isNavigating?: boolean;
  variant?: 'TECHNICAL' | 'EXPLORATION';
}> = ({ 
  activeTool, 
  isNavigating = false,
  variant = 'TECHNICAL'
}) => {
  const map = useMap();
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];
  const centerContent = useCenterContent();
  const isMinimap = centerContent !== 'map';

  // REGRA DE OURO: Enquanto não houver áreas, o mapa está ancorado (Layout 0).
  const isLayout0 = installationAreas.length === 0;
  const isAnchorLocked = isLayout0 && !isNavigating;

  useEffect(() => {
    let timer: any;

    // PERFIL: EXPLORAÇÃO (Livre)
    if (variant === 'EXPLORATION') {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    }
    // PERFIL: TÉCNICO (Travado)
    // NÍVEL 1: Sidebar (minimapa) ou Trava de Âncora (Layout 0) -> Bloqueio Absoluto
    else if (isMinimap || isAnchorLocked) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
    }
    // NÍVEL 2: Modo Arranjo (CONTEXT) -> Navegação Livre (Menos Scroll)
    else {
      map.dragging.enable();
      map.scrollWheelZoom.disable(); // Forçado: consistência de UX
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoom.enable();
      map.boxZoom.enable();
    }

    // Invalida o tamanho após mudança de estado para evitar tiles fantasmagóricos
    timer = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [map, isMinimap, isAnchorLocked, canvasViewMode, activeTool, variant]);

  // Ctrl+Scroll zoom (Figma/Miro pattern)
  useEffect(() => {
    // Only active when in NÍVEL 2 (not minimap, not anchor-locked)
    if (isMinimap || isAnchorLocked || variant === 'EXPLORATION') return;

    const container = map.getContainer();
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // Without Ctrl: let page scroll pass through
      e.preventDefault();
      e.stopPropagation();
      // Scale zoom by scroll intensity, capped at ±1 per tick
      const delta = e.deltaY;
      const zoomDelta = Math.min(Math.abs(delta) / 120, 1) * (delta < 0 ? 1 : -1);
      const currentZoom = map.getZoom();
      map.setZoom(currentZoom + zoomDelta * 0.8, { animate: true });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [map, isMinimap, isAnchorLocked, variant]);

  return null;
};

/**
 * MapViewSync — Sincroniza o zoom/center do mapa com o projectSlice.
 * moveend e zoomend disparam commit no store.
 */
const MapViewSync: React.FC = () => {
  const setZoom = useSolarStore(s => s.setZoom);
  const setCoordinates = useSolarStore(s => s.setCoordinates);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];

  useMapEvents({
    moveend: (e) => {
      // REGRA DE BLINDAGEM: Não salvar coordenadas se estivermos na Camada 0.
      // Isso impede que um arrasto "suje" a referência original do endereço.
      if (installationAreas.length === 0) return;

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
    if (!center) return;

    const lat = Number(center[0]);
    const lng = Number(center[1]);

    // Blindagem rigorosa contra coordenadas inválidas
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    try {
      const currentCenter = map.getCenter();
      const target = L.latLng(lat, lng);

      const currentZoom = map.getZoom();
      const targetZoom = (zoom !== undefined && zoom !== null && !isNaN(zoom)) ? Number(zoom) : currentZoom;

      // Só executa se houver deslocamento real ou mudança de zoom significativa
      if (currentCenter.distanceTo(target) > 0.5 || Math.abs(currentZoom - targetZoom) > 0.1) {
        map.flyTo(target, targetZoom, { duration: 1.2 });
      }
    } catch (err) {
      console.warn('MapPropSync: Abortando flyTo por segurança', { lat, lng, zoom }, err);
    }
  }, [center, zoom, map]);
  return null;
};

/**
 * GeocodingBridge — Escuta mudanças em project.coordinates (geocoding via SearchIsland)
 * e executa flyTo quando o usuário seleciona um resultado de busca.
 *
 * IMPORTANTE: Só voa se as coordenadas mudarem significativamente (>100m),
 * evitando conflito com MapViewSync que salva moveend.
 */
const GeocodingBridge: React.FC = () => {
  const map = useMap();
  const coordinates = useSolarStore(selectCoordinates);

  useEffect(() => {
    if (!coordinates) return;

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    // Blindagem rigorosa contra coordenadas inválidas
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;

    try {
      const currentCenter = map.getCenter();
      const target = L.latLng(lat, lng);

      // Só voa se houver deslocamento > 100m (evita loop com MapViewSync)
      const distance = currentCenter.distanceTo(target);
      if (distance > 100) {
        const mapSize = map.getSize();
        if (mapSize.x > 0 && mapSize.y > 0) {
          map.flyTo(target, 18, { duration: 1.2 });
        } else {
          map.setView(target, 18);
        }
      }
    } catch (err) {
      console.warn('GeocodingBridge: Erro no flyTo', { lat, lng }, err);
      try {
        map.setView(L.latLng(lat, lng), 18);
      } catch (e) {
        // Ignora erro do fallback
      }
    }
  }, [coordinates?.lat, coordinates?.lng, map]);

  return null;
};

/**
 * L0-B: MapFitBoundsOnAreas — Auto-fit bounds ao adicionar primeira área
 * Observa installationAreas e executa fitBounds quando a primeira área é criada.
 */
const MapFitBoundsOnAreas: React.FC = () => {
  const map = useMap();
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const prevCountRef = React.useRef(0);

  useEffect(() => {
    const currentCount = installationAreas.length;

    if (currentCount === 0) {
      prevCountRef.current = 0;
      return;
    }

    // Primeira área adicionada
    if (prevCountRef.current === 0 && currentCount === 1) {
      const area = installationAreas[0];
      if (area.polygon.length >= 3) {
        const bounds = L.latLngBounds(area.polygon as any);
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
    // Nova área adicionada a projeto já com áreas
    else if (currentCount > prevCountRef.current) {
      const newArea = installationAreas[installationAreas.length - 1];
      if (newArea.polygon.length >= 3) {
        const bounds = L.latLngBounds(newArea.polygon as any);
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.0 });
      }
    }

    prevCountRef.current = currentCount;
  }, [installationAreas, map]);

  return null;
};

/** 
 * Pilha de instâncias do Leaflet. Garante que se um modal com mapa for fechado,
 * a referência global volte para o mapa do workspace principal.
 */
const mapStack: LeafletMap[] = [];

/** 
 * Referência global mutável para a instância ATIVA do Leaflet.
 * Permite que o R3F (useLeafletSync) e scripts de captura (captureViewport)
 * acessem o mapa sem re-renders no React.
 */
export const globalLeafletMapRef: { current: LeafletMap | null } = { current: null };

/**
 * MapRefExposer -- Extrai a instância real do Leaflet via contexto
 * e injeta na nossa ref global usando um sistema de pilha para evitar colisões.
 */
const MapRefExposer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    // Adiciona esta instância ao topo da pilha
    mapStack.push(map);
    globalLeafletMapRef.current = map;

    return () => {
      // Remove esta instância da pilha
      const index = mapStack.indexOf(map);
      if (index !== -1) {
        mapStack.splice(index, 1);
      }
      // Restaura a referência para o mapa anterior na pilha (se houver)
      globalLeafletMapRef.current = mapStack.length > 0 
        ? mapStack[mapStack.length - 1] 
        : null;
    };
  }, [map]);
  return null;
};

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
  /** Força um modo de visualização específico (ex: CONTEXT para modais) */
  forceViewMode?: CanvasViewMode;
  /** Variante de comportamento: TÉCNICA (Arranjo) ou EXPLORAÇÃO (Projeto/Sítio) */
  variant?: 'TECHNICAL' | 'EXPLORATION';
  children?: React.ReactNode;
}

const MapCoreInner: React.FC<MapCoreProps> = ({
  activeTool,
  isNavigating = false,
  center: propsCenter,
  zoom: propsZoom,
  showLayers = true,
  readOnly = false,
  forceViewMode,
  variant = 'TECHNICAL',
  children
}) => {
  const coordinates = useSolarStore(selectCoordinates);
  const siteLocation = useSolarStore(selectProjectSiteLocation);
  const storeZoom = useSolarStore(selectZoom);
  const storeViewMode = useUIStore(s => s.canvasViewMode);
  const mapStyle = useUIStore(s => s.mapStyle);

  const canvasViewMode = forceViewMode ?? storeViewMode;

  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];

  // Cadeia de Prioridade de Centro (SPEC-SITE-SYNC):
  // 1. Props (sobrescreve tudo)
  // 2. Localização do Sítio (clientData.lat/lng) — Prioridade 1 se Áreas === 0
  // 3. Viewport salva (project.coordinates) — Só ativa após o início do projeto
  // 4. Fallback (Manaus)
  const finalCenter: [number, number] = propsCenter 
    ? propsCenter
    : (installationAreas.length === 0 && Number.isFinite(siteLocation.lat) && Number.isFinite(siteLocation.lng) && (siteLocation.lat !== 0 || siteLocation.lng !== 0))
      ? [siteLocation.lat, siteLocation.lng]
      : (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng))
        ? [coordinates.lat, coordinates.lng]
        : (Number.isFinite(siteLocation.lat) && Number.isFinite(siteLocation.lng) && (siteLocation.lat !== 0 || siteLocation.lng !== 0))
          ? [siteLocation.lat, siteLocation.lng]
          : [-3.1316, -60.0233];

  const finalZoom = propsZoom ?? Math.min(storeZoom, UI_MAX_ZOOM);

  return (
    <div className="w-full h-full bg-slate-950">
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

        {/* Monitora quando os tiles terminam de renderizar → clearAppLoading() */}
        <MapReadyObserver />

        {/* Sincronização de props externas (centro/zoom via props) */}
        <MapPropSync center={propsCenter} zoom={propsZoom} />

        {/* L0-C: Tile Layer with fallback to OSM when no API key */}
        {(canvasViewMode !== 'DIAGRAM' && canvasViewMode !== 'UNIFILAR') && (
          GOOGLE_MAPS_TOKEN ? (
            <ReactLeafletGoogleLayer
              apiKey={GOOGLE_MAPS_TOKEN}
              type={mapStyle}
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
          )
        )}

        {/* Sincronização de resize, visibilidade e viewport */}
        <MapInvalidator />
        <MapVisibilityObserver />
        <MapInteractionOrchestrator activeTool={activeTool} isNavigating={isNavigating} variant={variant} />
        {!readOnly && <MapViewSync />}
        {!readOnly && <MapFlyToSync />}
        {!readOnly && <GeocodingBridge />}
        {!readOnly && <MapFitBoundsOnAreas />}
        
        {/* Componentes Específicos do Perfil TÉCNICO */}
        {variant === 'TECHNICAL' && (
          <>
            <MapLayout0Lock isNavigating={isNavigating} />
            {!readOnly && <MapZoomSlider />}
          </>
        )}

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
