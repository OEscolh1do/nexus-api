import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSolarStore } from '@/core/state/solarStore';
import { selectProjectSiteLocation } from '@/core/state/solarSelectors';
import type { SolarState } from '@/core/state/solarStore';

interface MapLayout0LockProps {
  /** Indica se o usuário já ultrapassou o estágio de âncora (pós-primeiro ponto) */
  isNavigating: boolean;
}

/**
 * MAP LAYOUT 0 LOCK (Blindado)
 * 
 * Trava o centro do mapa nas coordenadas do projeto quando:
 * 1. O bloco de 'Arranjo' está selecionado.
 * 2. Nenhuma área de instalação foi criada ainda (Layout 0).
 * 3. O usuário ainda está definindo o ponto de origem (isNavigating === false).
 */
export const MapLayout0Lock: React.FC<MapLayout0LockProps> = ({ isNavigating }) => {
  const map = useMap();
  const installationAreas = useSolarStore((s: SolarState) => s.project.installationAreas) || [];
  const siteLocation = useSolarStore(selectProjectSiteLocation);

  const isLayout0 = installationAreas.length === 0;
  const shouldLock = isLayout0 && !isNavigating;

  useEffect(() => {
    if (!shouldLock || !siteLocation.lat || !siteLocation.lng) {
      return;
    }

    const lockedCenter: [number, number] = [siteLocation.lat, siteLocation.lng];

    // 1. Configuração Inicial e Recentralização Automática
    map.setView(lockedCenter, map.getZoom(), { animate: true });

    // 2. Paredes de Chumbo (Hard Bounds)
    // Impede fisicamente que o Leaflet mova a viewport para fora de uma caixa minúscula (~10 metros)
    // Isso garante que mesmo se um evento passar pelos disables, a câmera bateria na parede
    const latLngCenter = L.latLng(lockedCenter);
    const bounds = latLngCenter.toBounds(10);
    map.setMaxBounds(bounds);

    // 3. Blindagem de Movimento (Anti-Desvio) para eventos de zoom
    const forceCenter = () => {
      if (!shouldLock) return;
      const currentCenter = map.getCenter();
      if (currentCenter.distanceTo(lockedCenter) > 0.5) {
        map.setView(lockedCenter, map.getZoom(), { animate: false });
      }
    };

    map.on('zoomend', forceCenter);

    // Cleanup
    return () => {
      map.off('zoomend', forceCenter);
      map.setMaxBounds(null as any); // Remove a parede invisível ao destravar
    };
  }, [map, shouldLock, siteLocation.lat, siteLocation.lng]);

  return null;
};
