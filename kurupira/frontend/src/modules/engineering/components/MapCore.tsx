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
import L, { type Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';

import { useCanvasSize } from '../components/CanvasContainer';
import { useSolarStore } from '@/core/state/solarStore';
import { useCenterContent } from '../store/panelStore';
import { selectCoordinates, selectZoom, selectProjectSiteLocation } from '@/core/state/solarSelectors';
import { useUIStore, type Tool, type CanvasViewMode } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
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
    // NÍVEL 2: Modo Prancheta (BLUEPRINT) -> Bloqueio por ferramenta
    else if (canvasViewMode === 'BLUEPRINT') {
      map.scrollWheelZoom.disable(); // Forçado: sem zoom via scroll em modo técnico
      map.keyboard.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
      if (activeTool === 'PAN') {
        map.dragging.enable();
        map.doubleClickZoom.enable();
      } else {
        map.dragging.disable();
        map.doubleClickZoom.disable();
      }
    } 
    // NÍVEL 3: Modo Satélite (CONTEXT) -> Navegação Livre (Menos Scroll)
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
    if (!center || center[0] === 0 || center[1] === 0) return;

    const currentCenter = map.getCenter();
    const target = L.latLng(center[0], center[1]);
    
    // Distância considerável (> 1m) para evitar loops e jitters
    if (currentCenter.distanceTo(target) > 1) {
      map.flyTo(target, zoom ?? map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
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
  
  const canvasViewMode = forceViewMode ?? storeViewMode;

  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];

  // Cadeia de Prioridade de Centro (SPEC-SITE-SYNC):
  // 1. Props (sobrescreve tudo)
  // 2. Localização do Sítio (clientData.lat/lng) — Prioridade 1 se Áreas === 0
  // 3. Viewport salva (project.coordinates) — Só ativa após o início do projeto
  // 4. Fallback (Manaus)
  const finalCenter: [number, number] = propsCenter 
    ? propsCenter
    : (installationAreas.length === 0 && siteLocation.lat && siteLocation.lng)
      ? [siteLocation.lat, siteLocation.lng]
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

        {/* Monitora quando os tiles terminam de renderizar → clearAppLoading() */}
        <MapReadyObserver />

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
        <MapInteractionOrchestrator activeTool={activeTool} isNavigating={isNavigating} variant={variant} />
        {!readOnly && <MapViewSync />}
        {!readOnly && <MapFlyToSync />}
        
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
