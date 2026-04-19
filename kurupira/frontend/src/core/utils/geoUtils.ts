/**
 * =============================================================================
 * GEO UTILS — Funções Puras de Geometria Solar (PGFX-02)
 * =============================================================================
 *
 * Utilitários para cálculos geográficos usados pelo projectSlice e SolarLayer.
 * Todas as funções são puras — sem dependências de store ou side-effects.
 *
 * Referências:
 * - Haversine simplificado (válido para distâncias < 1km)
 * - Matriz de rotação 2D para alinhamento de módulos
 * =============================================================================
 */

/** Tupla de coordenada geográfica [latitude, longitude] */
export type LatLngTuple = [number, number];

/**
 * Calcula o azimute (graus, 0=Norte, 90=Leste) da aresta mais longa
 * do polígono. Usado para alinhar o grid de módulos ao telhado.
 *
 * @param polygon - Array de vértices [lat, lng]
 * @returns Azimute em graus (0–360)
 */
export function calcRoofAzimuth(polygon: LatLngTuple[]): number {
  if (polygon.length < 2) return 0;

  let maxLen = 0;
  let azimuth = 0;

  for (let i = 0; i < polygon.length; i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[(i + 1) % polygon.length];

    // Comprimento aproximado em metros (Haversine simplificado)
    const dLat = (lat2 - lat1) * 111320;
    const dLng = (lng2 - lng1) * 111320 * Math.cos(lat1 * Math.PI / 180);
    const len = Math.sqrt(dLat * dLat + dLng * dLng);

    if (len > maxLen) {
      maxLen = len;
      // atan2 retorna ângulo do eixo X; converter para azimute (0=Norte)
      azimuth = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
    }
  }

  return azimuth;
}

/**
 * Calcula os 4 vértices de um módulo solar posicionado no mapa,
 * rotacionado pelo axisAngle (alinhamento ao telhado).
 *
 * @param center - Ponto central do módulo [lat, lng]
 * @param widthM - Largura do módulo em metros
 * @param heightM - Altura do módulo em metros
 * @param axisAngle - Ângulo de rotação em graus (roofAzimuth ou override)
 * @returns Array de 4 vértices [lat, lng] (TL, TR, BR, BL)
 */
export function calcModulePolygon(
  center: LatLngTuple,
  widthM: number,
  heightM: number,
  axisAngle: number,
): LatLngTuple[] {
  const [lat, lng] = center;
  const rad = axisAngle * Math.PI / 180;

  // 1 grau de latitude ≈ 111320m; longitude depende da latitude
  const mPerLat = 111320;
  const mPerLng = 111320 * Math.cos(lat * Math.PI / 180);

  const hw = widthM / 2 / mPerLng; // half-width em graus
  const hh = heightM / 2 / mPerLat; // half-height em graus

  // Cantos antes da rotação (ordem: TL, TR, BR, BL)
  const corners: [number, number][] = [
    [-hh, -hw], [-hh, hw], [hh, hw], [hh, -hw],
  ];

  // Rotacionar cada canto pelo axisAngle
  return corners.map(([dy, dx]) => [
    lat + dy * Math.cos(rad) - dx * Math.sin(rad),
    lng + dy * Math.sin(rad) + dx * Math.cos(rad),
  ]) as LatLngTuple[];
}

/**
 * Calcula a área de um polígono em metros quadrados usando a fórmula de Shoelace (Cadarço).
 * Assume que os vértices estão em um sistema de coordenadas métricas locais (X, Y).
 * 
 * @param vertices - Array de vértices locais {x, y}
 * @returns Área em m²
 */
export function calcPolygonAreaM2(vertices: { x: number; y: number }[]): number {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const { x: x1, y: y1 } = vertices[i];
    const { x: x2, y: y2 } = vertices[(i + 1) % vertices.length];
    
    area += (x1 * y2) - (x2 * y1);
  }
  
  return Math.abs(area) / 2;
}
