import React, { useState } from 'react';
import { useMapEvents, Polyline, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { type Tool } from '@/core/state/uiStore';

/**
 * =============================================================================
 * MAP MEASURE TOOL (GFX-07)
 * =============================================================================
 *
 * Implementa a ferramenta de medição de distâncias no Leaflet.
 * Ao clicar sequencialmente, traça uma linha reta (polyline) e mostra a
 * distância acumulada ou parcial numa Tooltip.
 * Usa Vincenty formula (L.LatLng.distanceTo) encapsulado no leaflet.
 * =============================================================================
 */

interface MapMeasureToolProps {
  activeTool: Tool;
}

export const MapMeasureTool: React.FC<MapMeasureToolProps> = ({ activeTool }) => {
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [mousePos, setMousePos] = useState<L.LatLng | null>(null);

  // Zera se a tool mudar
  React.useEffect(() => {
    if (activeTool !== 'MEASURE') {
      setPoints([]);
      setMousePos(null);
    }
  }, [activeTool]);

  useMapEvents({
    click(e) {
      if (activeTool !== 'MEASURE') return;
      setPoints(prev => [...prev, e.latlng]);
    },
    mousemove(e) {
      if (activeTool !== 'MEASURE' || points.length === 0) return;
      setMousePos(e.latlng);
    },
    contextmenu(_e) { // Right click to cancel/finish
      if (activeTool !== 'MEASURE') return;
      setPoints([]);
      setMousePos(null);
    }
  });

  if (activeTool !== 'MEASURE' || (points.length === 0 && !mousePos)) return null;

  // Polyline coordinates (locked points + current mouse trailing point if active)
  const linePoints = [...points];
  if (mousePos && points.length > 0) {
    linePoints.push(mousePos);
  }

  // Calculate distance segments for tooltip
  let totalDistance = 0;
  for (let i = 1; i < linePoints.length; i++) {
    totalDistance += linePoints[i - 1].distanceTo(linePoints[i]);
  }

  const formatDistance = (meters: number) => {
    return meters > 1000 
      ? `${(meters / 1000).toFixed(2)} km` 
      : `${meters.toFixed(2)} m`;
  };

  return (
    <>
      <Polyline positions={linePoints} color="#10b981" weight={3} dashArray="5, 5" />
      
      {points.map((p, idx) => (
        <CircleMarker key={idx} center={p} radius={4} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 1 }} />
      ))}

      {linePoints.length > 1 && (
        <Tooltip
          position={linePoints[linePoints.length - 1]}
          permanent
          direction="top"
          offset={[0, -10]}
          className="bg-slate-900 border-none text-emerald-400 font-bold px-2 py-1 rounded shadow-lg text-[10px]"
        >
          {formatDistance(totalDistance)}
        </Tooltip>
      )}
    </>
  );
};
