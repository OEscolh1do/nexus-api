import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { useSolarStore } from '@/core/state/solarStore';
import { useSelectedEntity } from '@/core/state/uiStore';
import { PlacedModule } from '@/core/state/slices/projectSlice';


/**
 * =============================================================================
 * MAP FLY-TO SYNC (P10: InstallationArea)
 * =============================================================================
 *
 * Componente filho do MapCore responsável por escutar o Outliner (uiStore)
 * e animar a câmera do Leaflet (flyTo) para focar na entidade selecionada.
 * =============================================================================
 */

export const MapFlyToSync: React.FC = () => {
  const map = useMap();
  const selectedEntity = useSelectedEntity();
  const placedModules = useSolarStore(s => s.project.placedModules) || [];
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];

  useEffect(() => {
    if (!selectedEntity.id) return;

    if (selectedEntity.type === 'site') {
      const siteLat = useSolarStore.getState().clientData.lat;
      const siteLng = useSolarStore.getState().clientData.lng;
      if (siteLat && siteLng) {
        map.flyTo([siteLat, siteLng], 18, { duration: 1.2 });
      }
    }
    else if (selectedEntity.type === 'module') {
      const mod = placedModules.find((m: PlacedModule) => m.id === selectedEntity.id);
      if (mod) {
        map.flyTo(mod.center, 21, { duration: 0.6 });
      }
    } 
    else if (selectedEntity.type === 'area' || selectedEntity.type === 'polygon') {
      // Voar para a Área de Instalação
      const area = installationAreas.find(a => a.id === selectedEntity.id);
      if (area) {
        // Usar os vértices locais para calcular o bounds
        const earthRadius = 6378137;
        const latRads = area.center[0] * (Math.PI / 180);
        const angleRad = area.azimuth * (Math.PI / 180);

        const geoPoints = area.localVertices.map(v => {
          const rx = v.x * Math.cos(angleRad) - v.y * Math.sin(angleRad);
          const ry = v.x * Math.sin(angleRad) + v.y * Math.cos(angleRad);
          const dLat = (ry / earthRadius) * (180 / Math.PI);
          const dLng = (rx / (earthRadius * Math.cos(latRads))) * (180 / Math.PI);
          return [area.center[0] + dLat, area.center[1] + dLng] as [number, number];
        });

        const polygon = L.polygon(geoPoints);
        const bounds = polygon.getBounds();
        map.flyToBounds(bounds, { duration: 0.6, padding: [20, 20] });
      }
    }
  }, [selectedEntity.id, selectedEntity.type, map, placedModules, installationAreas]);

  return null;
};
