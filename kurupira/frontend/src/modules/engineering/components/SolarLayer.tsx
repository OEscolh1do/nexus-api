/**
 * =============================================================================
 * SOLAR LAYER — Camada de Geometria Solar (P10: InstallationArea Freeform)
 * =============================================================================
 *
 * Renderiza sobre o mapa Leaflet:
 * - Áreas de Instalação Freeform (via InstallationAreaBlock)
 * - Módulos posicionados com coordenadas cacheadas O(1) WebGL
 * - Interação PLACE_MODULE exige clique dentro da Área (Boundary Check)
 * =============================================================================
 */

import React, { useCallback } from 'react';
import { Polygon, useMapEvents } from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';

import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { selectModulesStable } from '@/core/state/solarSelectors';
import type { LatLngTuple } from '@/core/utils/geoUtils';
import type { PlacedModule } from '@/core/state/slices/projectSlice';
import { ParametricRoofBlock, suppressNextMapClick } from './ParametricRoofBlock';

// =============================================================================
// TYPES & STYLES
// =============================================================================

interface SolarLayerProps {
  activeTool: 'SELECT' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE';
}

const MODULE_POLYGON_STYLE = {
  color: '#3b82f6',      // blue-500
  weight: 1.5,
  opacity: 0.9,
  fillColor: '#3b82f6',
  fillOpacity: 0.35,
};

const MODULE_HOVER_STYLE = {
  ...MODULE_POLYGON_STYLE,
  color: '#f59e0b',
  fillColor: '#f59e0b',
  fillOpacity: 0.5,
};

// =============================================================================
// COMPONENT
// =============================================================================

export const SolarLayer: React.FC<SolarLayerProps> = ({ activeTool }) => {
  // Area data (Freeform)
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const spawnArea = useSolarStore(s => s.spawnArea);
  const deleteArea = useSolarStore(s => s.deleteArea);
  const removePlacedModule = useSolarStore(s => s.removePlacedModule);

  // Module data
  const placedModules = useSolarStore(s => s.project.placedModules);
  const moduleSpecs = useSolarStore(selectModulesStable);

  // UI Integration
  const selectEntity = useUIStore(s => s.selectEntity);
  const toggleMultiSelection = useUIStore(s => s.toggleMultiSelection);
  const clearSelection = useUIStore(s => s.clearSelection);

  // Get active module specs for placement
  const activeModuleSpec = moduleSpecs.length > 0 ? moduleSpecs[0] : null;

  // ==========================================================================
  // KEYBOARD / GLOBAL EVENTS
  // ==========================================================================
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        clearSelection();
        useUIStore.getState().setActiveTool('SELECT');
      }
      
      // Delete / Backspace: remove selected entity
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = useUIStore.getState().selectedEntity;
        if (!sel?.id) return;
        
        if (sel.type === 'area') {
          deleteArea(sel.id);
          clearSelection();
        } else if (sel.type === 'module') {
          removePlacedModule(sel.id);
          clearSelection();
        }
      }

      // Ctrl+D: Duplicate selected area
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const sel = useUIStore.getState().selectedEntity;
        if (sel?.type === 'area' && sel.id) {
          useSolarStore.getState().duplicateArea(sel.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, deleteArea, removePlacedModule]);

  // ==========================================================================
  // MAP CLICK EVENTS (Outside Areas)
  // ==========================================================================

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    // FIX: Check suppression flag — if a polygon click just fired, skip this map click
    if (suppressNextMapClick.value) {
      suppressNextMapClick.value = false;
      return;
    }

    if (activeTool === 'SELECT') {
      clearSelection(); 
      return;
    }

    if (activeTool === 'POLYGON') {
      if (useSolarStore.getState().project.projectStatus === 'approved') {
        alert("🔒 Edição Bloqueada: Este projeto consta como 'Aprovado' na proposta comercial. Desbloqueie-o para adicionar novas áreas.");
        useUIStore.getState().setActiveTool('SELECT');
        return;
      }

      const point: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      spawnArea(point, 10, 5, 0); 
      
      useUIStore.getState().setActiveTool('SELECT');
      return;
    }

    if (activeTool === 'PLACE_MODULE') {
      alert('⚠️ Módulo deve ser posicionado dentro dos limites de uma Área de Instalação.');
      useUIStore.getState().setActiveTool('SELECT');
      return;
    }
  }, [activeTool, spawnArea, clearSelection]);

  // Register map events
  const map = useMapEvents({
    click: handleMapClick,
  });

  // Disable map dragging when using drawing tools
  React.useEffect(() => {
    if (activeTool === 'POLYGON' || activeTool === 'PLACE_MODULE') {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
    return () => { map.dragging.enable(); };
  }, [activeTool, map]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      {/* ── INSTALLATION AREAS (Freeform CSG Blocks) ── */}
      {(installationAreas || []).map(area => (
        <ParametricRoofBlock 
          key={area.id} 
          roof={area as any} 
          activeTool={activeTool}
          activeModuleSpec={activeModuleSpec}
        />
      ))}

      {/* ── PLACED MODULES (GFX-04) ── */}
      {(placedModules || []).map((mod: PlacedModule) => (
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
                suppressNextMapClick.value = true;
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
