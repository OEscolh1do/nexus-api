/**
 * =============================================================================
 * GEO PROJECTION — Conversão Lat/Lng ↔ Metros Locais (P5-1)
 * =============================================================================
 *
 * Funções puras para converter coordenadas geográficas (lat/lng) em
 * coordenadas locais (metros XY) relativas a um ponto central.
 * Usa projeção Mercator simplificada (válida para áreas < 10km²).
 *
 * Estas funções são a ponte entre o mundo Leaflet (lat/lng) e o
 * mundo Three.js (metros XY no plano ortográfico).
 * =============================================================================
 */

/** Metros por grau de latitude (constante na Terra) */
const METERS_PER_DEG_LAT = 111_320;

/** Metros por grau de longitude (varia com latitude) */
const metersPerDegLng = (lat: number) =>
  METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/**
 * Converte um ponto lat/lng para coordenadas locais XY
 * relativas a um centro de referência.
 *
 * @returns {{ x: number; y: number }} — x = leste(+)/oeste(-), y = norte(+)/sul(-)
 */
export function latLngToLocal(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number }
): { x: number; y: number } {
  const x = (point.lng - center.lng) * metersPerDegLng(center.lat);
  const y = (point.lat - center.lat) * METERS_PER_DEG_LAT;
  return { x, y };
}

/**
 * Converte coordenadas locais XY de volta para lat/lng.
 */
export function localToLatLng(
  center: { lat: number; lng: number },
  x: number,
  y: number
): { lat: number; lng: number } {
  const lat = center.lat + y / METERS_PER_DEG_LAT;
  const lng = center.lng + x / metersPerDegLng(center.lat);
  return { lat, lng };
}

/**
 * Calcula a extensão em metros de um bounding box Leaflet
 * relativa a seu centro.
 */
export function boundsToLocalExtent(
  center: { lat: number; lng: number },
  sw: { lat: number; lng: number },
  ne: { lat: number; lng: number }
): { halfWidth: number; halfHeight: number } {
  const left = latLngToLocal(center, { lat: center.lat, lng: sw.lng });
  const right = latLngToLocal(center, { lat: center.lat, lng: ne.lng });
  const bottom = latLngToLocal(center, { lat: sw.lat, lng: center.lng });
  const top = latLngToLocal(center, { lat: ne.lat, lng: center.lng });

  return {
    halfWidth: (right.x - left.x) / 2,
    halfHeight: (top.y - bottom.y) / 2,
  };
}
