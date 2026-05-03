const { getHspByCoordinates, HSP_FALLBACK } = require('../utils/hsp');

describe('getHspByCoordinates', () => {
  test('retorna fallback quando lat/lng são nulos', () => {
    expect(getHspByCoordinates(null, null)).toBe(HSP_FALLBACK);
    expect(getHspByCoordinates(null, -43)).toBe(HSP_FALLBACK);
    expect(getHspByCoordinates(-15, null)).toBe(HSP_FALLBACK);
  });

  test('retorna fallback para coordenadas fora do Brasil', () => {
    expect(getHspByCoordinates(51.5, -0.1)).toBe(HSP_FALLBACK); // Londres
    expect(getHspByCoordinates(40.7, -74.0)).toBe(HSP_FALLBACK); // Nova York
    expect(getHspByCoordinates(-35.0, 18.5)).toBe(HSP_FALLBACK); // Cidade do Cabo
  });

  test('retorna HSP correto para capitais brasileiras', () => {
    // Brasília — DF — HSP 5.4
    expect(getHspByCoordinates(-15.8, -47.9)).toBe(5.4);
    // Rio de Janeiro — RJ — HSP 4.9
    expect(getHspByCoordinates(-22.9, -43.2)).toBe(4.9);
    // Porto Alegre — RS — HSP 4.2
    expect(getHspByCoordinates(-30.0, -51.2)).toBe(4.2);
  });

  test('retorna o estado mais próximo para ponto entre dois estados', () => {
    // Ponto muito próximo ao centroide de SP (-22.0, -48.5)
    const hsp = getHspByCoordinates(-22.1, -48.4);
    expect(hsp).toBe(4.7); // SP
  });

  test('retorna fallback para coordenada zero (sem dados)', () => {
    // Lat/lng = 0 ficam fora do bounding box do Brasil
    expect(getHspByCoordinates(0, 0)).toBe(HSP_FALLBACK);
  });
});
