import React from 'react';
import { Polygon } from 'react-leaflet';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

/**
 * BLUEPRINT MASK (PGFX-04)
 * 
 * Implementa o efeito de "Máscara do Illustrator" utilizando um polígono invertido.
 * Cria um overlay opaco sobre o mundo inteiro com um "furo" (hole) exatamente
 * no formato e posição da área de instalação selecionada.
 */
export const BlueprintMask: React.FC = () => {
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const selectedEntity = useUIStore(s => s.selectedEntity);
  const areas = useSolarStore(s => s.project.installationAreas) || [];

  // Só renderiza se estiver no modo BLUEPRINT
  if (canvasViewMode !== 'BLUEPRINT') return null;

  // Encontra a área ativa para usar como máscara
  // Se não houver seleção, tentamos o primeiro bloco do arrangement
  const activeArea = selectedEntity.type === 'area' 
    ? areas.find(a => a.id === selectedEntity.id)
    : areas[0];

  if (!activeArea || !activeArea.polygon || activeArea.polygon.length < 3) return null;

  // Caixa "infinita" para o overlay (coordenadas geográficas limites)
  const outerRing: [number, number][] = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
    [-90, -180]
  ];

  // Leaflet Polygon suporta múltiplos rings (o primeiro é o exterior, os seguintes são furos)
  const maskPositions: [number, number][][] = [
    outerRing,
    activeArea.polygon
  ];

  return (
    <Polygon
      positions={maskPositions}
      pathOptions={{
        fillColor: '#020617', // slate-950 (fundo técnico profundo)
        fillOpacity: 1,
        color: 'transparent',
        weight: 0,
        interactive: false,
        pane: 'overlayPane'
      }}
    />
  );
};
