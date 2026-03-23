/**
 * =============================================================================
 * USE LEAFLET SYNC — Sincroniza Câmera R3F com Viewport Leaflet (P5-1)
 * =============================================================================
 *
 * Hook interno ao <Canvas> R3F que:
 * 1. Lê coordenadas/zoom do solarStore via getState() (sem subscrição)
 * 2. Calcula os bounds em metros usando geoProjection
 * 3. Atualiza a câmera ortográfica no useFrame para alinhar com o Leaflet
 * 4. Chama invalidate() somente quando os bounds mudam
 *
 * Performance:
 * - Zero re-renders React (usa refs + useFrame)
 * - Zero subscrições reativas ao Zustand
 * - A câmera é atualizada imperativa e diretamente
 * =============================================================================
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrthographicCamera } from 'three';
import { globalLeafletMapRef } from '../components/MapCore';


/** Converte o zoom do Leaflet para uma extensão aproximada em metros */
function zoomToMetersPerPixel(lat: number, zoom: number): number {
  // Fórmula padrão Mercator: metros/pixel = C * cos(lat) / 2^(zoom+8)
  const C = 40_075_016.686; // circunferência equatorial
  return (C * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
}

export function useLeafletSync() {
  const { camera, invalidate, size } = useThree();
  const prevHashRef = useRef('');

  useFrame(() => {
    const map = globalLeafletMapRef.current;
    if (!map) return;

    // Lemos diretamente da instância Leaflet no frameloop.
    // Isso garante sincronia 60fps durante arrasto (pan) sem gargalar o Zustand.
    const center = map.getCenter();
    const zoom = map.getZoom();

    // Calcular extensão em metros baseada no zoom e tamanho do viewport
    const mpp = zoomToMetersPerPixel(center.lat, zoom);
    const halfWidth = (size.width / 2) * mpp;
    const halfHeight = (size.height / 2) * mpp;

    // Hash para evitar atualizações redundantes
    const hash = `${center.lat.toFixed(6)}_${center.lng.toFixed(6)}_${zoom}_${size.width}_${size.height}`;
    if (hash === prevHashRef.current) return;
    prevHashRef.current = hash;

    // Atualizar câmera ortográfica
    const cam = camera as OrthographicCamera;
    cam.left = -halfWidth;
    cam.right = halfWidth;
    cam.top = halfHeight;
    cam.bottom = -halfHeight;
    cam.near = -1000;
    cam.far = 1000;
    cam.position.set(0, 0, 100);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();

    invalidate();
  });
}
