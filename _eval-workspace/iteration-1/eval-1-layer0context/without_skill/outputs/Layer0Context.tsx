// Layer0Context.tsx — implementação sem guia de skill
// Versão genérica: nomes e padrões sem referência à spec do Kurupira

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type MapMode = 'satellite' | 'blueprint';

export interface MapContextValue {
  map: unknown | null;
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  zoom: number;
}

const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
  lat: number | null;
  lng: number | null;
  onMissingLocation?: () => void;
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({
  lat,
  lng,
  onMissingLocation,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [mode, setMode] = useState<MapMode>('satellite');
  const [zoom, setZoom] = useState(18);

  useEffect(() => {
    if (!containerRef.current || lat === null || lng === null) return;
    if (mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 18,
        minZoom: 15,
        maxZoom: 22,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
      }).addTo(map);

      map.on('zoomend', () => setZoom(map.getZoom()));
      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  // Apply visual mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mode === 'blueprint') {
      container.style.filter = 'brightness(0.5) grayscale(1)';
    } else {
      container.style.filter = '';
    }
  }, [mode]);

  if (lat === null || lng === null) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e293b',
          color: '#94a3b8',
          gap: '16px',
        }}
      >
        <p>Location not set</p>
        {onMissingLocation && (
          <button onClick={onMissingLocation} style={{ padding: '8px 16px' }}>
            Set Location
          </button>
        )}
      </div>
    );
  }

  return (
    <MapContext.Provider value={{ map: mapRef.current, mode, setMode, zoom }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />
      {children}
    </MapContext.Provider>
  );
};

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapContext must be used inside MapProvider');
  return ctx;
}
