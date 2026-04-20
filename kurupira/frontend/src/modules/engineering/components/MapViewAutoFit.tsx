import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

/**
 * MAP VIEW AUTO FIT (PGFX-04)
 * 
 * Escuta mudanças no canvasViewMode e ajusta o enquadramento do mapa
 * automaticamente para focar na área de projeto ao entrar no modo Prancheta.
 */
export const MapViewAutoFit: React.FC = () => {
  const map = useMap();
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const selectedEntity = useUIStore(s => s.selectedEntity);
  const areas = useSolarStore(s => s.project.installationAreas) || [];

  useEffect(() => {
    if (canvasViewMode === 'BLUEPRINT') {
      // Prioridade: área selecionada > primeira área disponível
      const activeArea = selectedEntity.type === 'area' 
        ? areas.find(a => a.id === selectedEntity.id)
        : areas[0];

      if (activeArea && activeArea.polygon && activeArea.polygon.length >= 3) {
        const bounds = L.latLngBounds(activeArea.polygon);
        
        // Ajusta o zoom com um pequeno padding para não ficar colado nas bordas
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 21, // Limite para não ficar surrealmente perto
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [canvasViewMode, map, selectedEntity.id, areas.length]);

  return null;
};
