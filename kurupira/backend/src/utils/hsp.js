// HSP médio anual por estado brasileiro (kWh/m²/dia)
// Fonte: Atlas Solarimétrico do Brasil (INPE/LABSOLAR) — valores conservadores
const STATE_CENTROIDS = [
  ['AC', -9.0,  -70.5, 4.9],
  ['AL', -9.7,  -36.5, 5.3],
  ['AP',  1.4,  -51.7, 4.7],
  ['AM', -3.4,  -65.0, 4.8],
  ['BA',-12.0,  -42.0, 5.5],
  ['CE', -5.5,  -39.5, 5.5],
  ['DF',-15.8,  -47.9, 5.4],
  ['ES',-19.5,  -40.5, 5.0],
  ['GO',-16.0,  -49.5, 5.3],
  ['MA', -5.0,  -45.0, 5.4],
  ['MT',-12.5,  -55.5, 5.1],
  ['MS',-20.5,  -54.5, 5.0],
  ['MG',-18.5,  -44.5, 5.3],
  ['PA', -3.5,  -52.0, 5.0],
  ['PB', -7.2,  -36.8, 5.5],
  ['PR',-24.5,  -51.5, 4.5],
  ['PE', -8.5,  -37.5, 5.4],
  ['PI', -7.7,  -42.8, 5.7],
  ['RJ',-22.5,  -43.0, 4.9],
  ['RN', -5.8,  -36.5, 5.6],
  ['RS',-30.0,  -53.5, 4.2],
  ['RO',-11.0,  -63.0, 5.0],
  ['RR',  2.0,  -61.5, 5.2],
  ['SC',-27.5,  -50.5, 4.3],
  ['SP',-22.0,  -48.5, 4.7],
  ['SE',-10.5,  -37.5, 5.2],
  ['TO',-10.2,  -48.3, 5.4],
];

const HSP_FALLBACK = 4.5;

// Bounding box aproximada do Brasil para validar se coordenadas são relevantes
const BRAZIL_BOUNDS = { latMin: -33.8, latMax: 5.3, lngMin: -73.9, lngMax: -28.6 };

function getHspByCoordinates(lat, lng) {
  if (lat == null || lng == null) return HSP_FALLBACK;

  const inBrazil =
    lat >= BRAZIL_BOUNDS.latMin && lat <= BRAZIL_BOUNDS.latMax &&
    lng >= BRAZIL_BOUNDS.lngMin && lng <= BRAZIL_BOUNDS.lngMax;

  if (!inBrazil) return HSP_FALLBACK;

  let minDist = Infinity;
  let hsp = HSP_FALLBACK;

  for (const [, cLat, cLng, stateHsp] of STATE_CENTROIDS) {
    const dist = (lat - cLat) ** 2 + (lng - cLng) ** 2;
    if (dist < minDist) {
      minDist = dist;
      hsp = stateHsp;
    }
  }

  return hsp;
}

module.exports = { getHspByCoordinates, HSP_FALLBACK };
