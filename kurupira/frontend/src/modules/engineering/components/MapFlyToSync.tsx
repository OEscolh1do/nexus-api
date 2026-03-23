import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { useSolarStore } from '@/core/state/solarStore';
import { useSelectedEntity } from '@/core/state/uiStore';
import { PlacedModule } from '@/core/state/slices/projectSlice';

/**
 * =============================================================================
 * MAP FLY-TO SYNC (GFX-09)
 * =============================================================================
 *
 * Componente filho do MapCore responsável por escutar o Outliner (uiStore)
 * e animar a câmera do Leaflet (flyTo) para focar na entidade selecionada.
 *
 * Performance:
 * - Não possui UI.
 * - useEffect apenas observa a string do selectedEntity.id
 * =============================================================================
 */

export const MapFlyToSync: React.FC = () => {
  const map = useMap();
  const selectedEntity = useSelectedEntity();
  const placedModules = useSolarStore(s => s.project.placedModules);
  const roofPolygon = useSolarStore(s => s.project.roofPolygon);

  useEffect(() => {
    if (!selectedEntity.id) return;

    if (selectedEntity.type === 'module') {
      // Procura o módulo posicionado para obter o centro
      const mod = placedModules.find((m: PlacedModule) => m.id === selectedEntity.id);
      if (mod) {
        // Zomm de Inspeção (aprox 21)
        map.flyTo(mod.center, 21, { duration: 0.6 });
      }
    } 
    else if (selectedEntity.type === 'polygon') {
      // Voar para o telhado inteiro
      if (roofPolygon.length >= 3) {
        const polygon = L.polygon(roofPolygon);
        const bounds = polygon.getBounds();
        map.flyToBounds(bounds, { duration: 0.6, padding: [20, 20] });
      }
    }
    // Outros tipos (string, inverter) não têm bounding box espacial direto ainda,
    // então a câmera permanece quieta.
  }, [selectedEntity.id, selectedEntity.type, map, placedModules, roofPolygon]);

  return null;
};
