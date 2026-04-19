import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useUIStore, type UIState } from '@/core/state/uiStore';
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
  const focusedBlock = useUIStore((s: UIState) => s.activeFocusedBlock);
  const installationAreas = useSolarStore((s: SolarState) => s.project.installationAreas) || [];
  const siteLocation = useSolarStore(selectProjectSiteLocation);

  const isLayout0 = focusedBlock === 'arrangement' && installationAreas.length === 0;
  const shouldLock = isLayout0 && !isNavigating;

  useEffect(() => {
    if (!shouldLock || !siteLocation.lat || !siteLocation.lng) {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      return;
    }

    const lockedCenter: [number, number] = [siteLocation.lat, siteLocation.lng];

    // 1. Configuração Inicial da Trava
    map.setView(lockedCenter, map.getZoom(), { animate: false });
    map.dragging.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable(); // Desabilita o nato para não perseguir o mouse

    // 2. Lógica de Zoom Centripetal Manual
    const handleWheel = (e: any) => {
      // Ignora se não estiver locado
      if (!shouldLock) return;
      
      // Captura o delta do scroll original
      const delta = e.originalEvent?.deltaY;
      if (delta === undefined) return;
      
      const currentZoom = map.getZoom();
      const newZoom = delta > 0 ? currentZoom - 1 : currentZoom + 1;

      // Executa o zoom forçando o centro do projeto
      map.setView(lockedCenter, newZoom, { animate: true });
    };

    // 3. Blindagem de Movimento (Anti-Desvio)
    const forceCenter = () => {
      if (shouldLock) {
        map.setView(lockedCenter, map.getZoom(), { animate: false });
      }
    };

    // Registrar Eventos
    map.on('wheel', handleWheel);
    map.on('movestart', forceCenter);
    map.on('zoomstart', forceCenter);

    // Cleanup
    return () => {
      map.off('wheel', handleWheel);
      map.off('movestart', forceCenter);
      map.off('zoomstart', forceCenter);
      
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    };
  }, [map, shouldLock, siteLocation.lat, siteLocation.lng]);

  return null;
};
