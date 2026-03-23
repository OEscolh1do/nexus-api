/**
 * =============================================================================
 * SOLAR LAYER — Camada de Geometria Solar (GFX-03 + GFX-04 + GFX-05)
 * =============================================================================
 *
 * Renderiza sobre o mapa Leaflet:
 * - Polígono do telhado (roofPolygon do projectSlice)
 * - Módulos posicionados (placedModules do projectSlice) — GFX-04
 * - Interação PLACE_MODULE (click → posiciona módulo) — GFX-05
 *
 * Performance:
 * - Seletores estáveis via solarSelectors.ts
 * - Eventos de mousemove via ref mutado — sem setState
 * - Apenas click/dblclick disparam commit no store
 * =============================================================================
 */

import React, { useCallback } from 'react';
import { Polygon, Polyline, CircleMarker, useMapEvents } from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';

import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import {
  selectRoofPolygon,
  selectRoofAzimuth,
  selectModulesStable,
} from '@/core/state/solarSelectors';
import type { LatLngTuple } from '@/core/utils/geoUtils';
import type { PlacedModule } from '@/core/state/slices/projectSlice';

// =============================================================================
// TYPES
// =============================================================================

interface SolarLayerProps {
  activeTool: 'SELECT' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE';
}

// =============================================================================
// STYLES
// =============================================================================

const ROOF_POLYGON_STYLE = {
  color: '#10b981',      // emerald-500
  weight: 2,
  opacity: 0.8,
  fillColor: '#10b981',
  fillOpacity: 0.15,
  dashArray: '6, 4',
};

const VERTEX_STYLE = {
  radius: 4,
  color: '#10b981',
  fillColor: '#ffffff',
  fillOpacity: 1,
  weight: 2,
};

const DRAWING_LINE_STYLE = {
  color: '#10b981',
  weight: 1.5,
  opacity: 0.6,
  dashArray: '4, 4',
};

const MODULE_POLYGON_STYLE = {
  color: '#3b82f6',      // blue-500
  weight: 1.5,
  opacity: 0.9,
  fillColor: '#3b82f6',
  fillOpacity: 0.35,
};

const ROOF_HOVER_STYLE = {
  ...ROOF_POLYGON_STYLE,
  color: '#f59e0b',      // amber-500
  fillColor: '#f59e0b',
  fillOpacity: 0.25,
};

const MODULE_HOVER_STYLE = {
  ...MODULE_POLYGON_STYLE,
  color: '#f59e0b',
  fillColor: '#f59e0b',
  fillOpacity: 0.5,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Derive approximate width/height from area (m²) and dimensions string.
 * ModuleSpecs has `area` (e.g. 2.26) and `dimensions` (e.g. "2094x1038x35mm").
 * Falls back to standard 60-cell panel (≈1.7m x 1.0m) if parsing fails.
 */
function parseModuleDimensions(area: number, dimensions: string): { widthM: number; heightM: number } {
  // Try parsing "WxHx..." format (mm)
  const match = dimensions.match(/(\d+)\s*x\s*(\d+)/i);
  if (match) {
    const w = parseInt(match[1], 10) / 1000; // mm → m
    const h = parseInt(match[2], 10) / 1000;
    return { widthM: Math.max(w, h), heightM: Math.min(w, h) };
  }

  // Fallback: derive from area with 2:1 aspect ratio
  const height = Math.sqrt(area / 2);
  return { widthM: height * 2, heightM: height };
}

// =============================================================================
// COMPONENT
// =============================================================================

export const SolarLayer: React.FC<SolarLayerProps> = ({ activeTool }) => {
  // Roof data
  const roofPolygon = useSolarStore(selectRoofPolygon);
  const roofAzimuth = useSolarStore(selectRoofAzimuth);
  const addRoofVertex = useSolarStore(s => s.addRoofVertex);
  const closeRoofPolygon = useSolarStore(s => s.closeRoofPolygon);

  // Module data
  const placedModules = useSolarStore(s => s.project.placedModules);
  const placeModule = useSolarStore(s => s.placeModule);
  const moduleSpecs = useSolarStore(selectModulesStable);

  // UI Integration
  const selectEntity = useUIStore(s => s.selectEntity);
  const toggleMultiSelection = useUIStore(s => s.toggleMultiSelection);
  const clearSelection = useUIStore(s => s.clearSelection);

  // Derived state
  const isClosed = roofAzimuth !== null;
  const isDrawingPolygon = activeTool === 'POLYGON' && !isClosed;

  // Get first module spec for dimensions (the active model for placement)
  const activeModuleSpec = moduleSpecs.length > 0 ? moduleSpecs[0] : null;

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    if (activeTool === 'SELECT') {
      clearSelection(); // Clicked on empty space
      return;
    }

    if (activeTool === 'POLYGON') {
      if (isClosed) return;
      const point: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      addRoofVertex(point);
      return;
    }

    if (activeTool === 'PLACE_MODULE') {
      if (!activeModuleSpec) return; // Sem módulo selecionado

      const center: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      const { widthM, heightM } = parseModuleDimensions(
        activeModuleSpec.area,
        activeModuleSpec.dimensions,
      );

      placeModule(center, activeModuleSpec.id, widthM, heightM);
      return;
    }
  }, [activeTool, isClosed, addRoofVertex, activeModuleSpec, placeModule]);

  const handleMapDblClick = useCallback(() => {
    if (activeTool !== 'POLYGON') return;
    if (roofPolygon.length < 3) return;
    closeRoofPolygon();
  }, [activeTool, roofPolygon.length, closeRoofPolygon]);

  // Register map events
  useMapEvents({
    click: handleMapClick,
    dblclick: handleMapDblClick,
  });

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      {/* ── ROOF POLYGON ── */}
      {/* Closed polygon */}
      {isClosed && roofPolygon.length >= 3 && (
        <Polygon
          positions={roofPolygon}
          pathOptions={ROOF_POLYGON_STYLE}
          eventHandlers={{
            mouseover: (e) => {
              if (activeTool === 'SELECT') e.target.setStyle(ROOF_HOVER_STYLE);
            },
            mouseout: (e) => {
              e.target.setStyle(ROOF_POLYGON_STYLE);
            },
            click: (e) => {
              if (activeTool === 'SELECT') {
                L.DomEvent.stopPropagation(e.originalEvent);
                selectEntity('polygon', 'roof', 'Telhado Principal');
              }
            }
          }}
        />
      )}

      {/* Drawing line (while in POLYGON mode) */}
      {isDrawingPolygon && roofPolygon.length >= 2 && (
        <Polyline
          positions={roofPolygon}
          pathOptions={DRAWING_LINE_STYLE}
        />
      )}

      {/* Roof vertices */}
      {roofPolygon.length > 0 && roofPolygon.map((point, idx) => (
        <CircleMarker
          key={`rv-${idx}`}
          center={point}
          pathOptions={VERTEX_STYLE}
        />
      ))}

      {/* ── PLACED MODULES (GFX-04) ── */}
      {placedModules.map((mod: PlacedModule) => (
        <Polygon
          key={mod.id}
          positions={mod.polygon}
          pathOptions={MODULE_POLYGON_STYLE}
          eventHandlers={{
            mouseover: (e) => {
              if (activeTool === 'SELECT') e.target.setStyle(MODULE_HOVER_STYLE);
            },
            mouseout: (e) => {
              e.target.setStyle(MODULE_POLYGON_STYLE);
            },
            click: (e) => {
              if (activeTool === 'SELECT') {
                L.DomEvent.stopPropagation(e.originalEvent);
                if (e.originalEvent.shiftKey) {
                  toggleMultiSelection(mod.id, 'Painéis');
                } else {
                  selectEntity('module', mod.id, `Painel ${mod.id.substring(0, 4)}`);
                }
              }
            }
          }}
        />
      ))}
    </>
  );
};
