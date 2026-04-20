import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
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
    // Forçamos o centro no marcador sempre que houver mudança de estado ou zoom
    map.setView(lockedCenter, map.getZoom(), { animate: true });

    // 2. Blindagem de Movimento (Anti-Desvio)
    const forceCenter = () => {
      if (!shouldLock) return;

      const currentCenter = map.getCenter();
      // Threshold de 0.5 metros para evitar flutuações de ponto flutuante e recursão
      if (currentCenter.distanceTo(lockedCenter) > 0.5) {
        map.setView(lockedCenter, map.getZoom(), { animate: false });
      }
    };

    // Registrar Eventos de Estabilização
    // REMOVIDO: 'movestart' causa recursão infinita ao chamar setView dentro do handler.
    // O bloqueio de arrasto já é feito pelo MapInteractionOrchestrator.
    map.on('zoomend', forceCenter);

    // Cleanup
    return () => {
      map.off('zoomend', forceCenter);
    };
  }, [map, shouldLock, siteLocation.lat, siteLocation.lng]);

  return null;
};
