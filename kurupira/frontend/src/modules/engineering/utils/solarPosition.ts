/**
 * =============================================================================
 * SOLAR POSITION ENGINE — Algoritmo PSA / NOAA
 * =============================================================================
 * Calcula a posição do sol (elevação + azimute) para uma localização e
 * instante de tempo específicos, sem dependências externas.
 *
 * Algoritmo: Spencer (1971) + PSA (Blanco-Muriel et al., 2001)
 * Precisão:  ±0.01° em elevação/azimute
 * Fonte:     NOAA Solar Calculator, PVGIS validation
 *
 * Convenção de azimute: 0° = Norte, 90° = Leste, 180° = Sul, 270° = Oeste
 * Hemisfério: Funciona em ambos (lat negativo = Sul)
 * =============================================================================
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── TIPOS EXPORTADOS ─────────────────────────────────────────────────────────

export interface SolarPoint {
  /** Hora local decimal (0–24, resolução de 15 min) */
  hour: number;
  /** Ângulo de elevação solar em graus (0 = horizonte, 90 = zênite) */
  elevation: number;
  /** Azimute solar em graus (0=N, 90=L, 180=S, 270=O) */
  azimuth: number;
  /** Irradiância normalizada estimada [0–1] = max(0, sin(elevation)) */
  irradiance: number;
}

export interface SolarDayInfo {
  /** Hora local decimal do nascer do sol (com refração atmosférica) */
  sunrise: number;
  /** Hora local decimal do pôr do sol */
  sunset: number;
  /** Hora local decimal do meio-dia solar verdadeiro */
  solarNoon: number;
  /** Duração do dia em horas */
  daylength: number;
  /** Declinação solar em graus */
  declination: number;
  /** 96 pontos de posição solar ao longo do dia (resolução de 15 min) */
  points: SolarPoint[];
}

export interface AzimuthLossResult {
  /** Azimute ótimo para esta latitude (0° no hemisfério Sul, 180° no Norte) */
  optimalAzimuth: number;
  /** Perda percentual de geração por orientação subótima [0–100] */
  lossPct: number;
  /** true se o desvio do ótimo for ≤ 30° */
  isOptimal: boolean;
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

/** Ângulo do dia B (graus) — base para fórmulas de Spencer */
function dayAngle(dayOfYear: number): number {
  return (360 / 365) * (dayOfYear - 81);
}

/** Declinação solar em graus — Spencer (1971), erro < 0.5° */
function solarDeclination(B_deg: number): number {
  return 23.45 * Math.sin(B_deg * DEG);
}

/**
 * Equação do Tempo em minutos.
 * Compensa excentricidade da órbita e inclinação do eixo terrestre.
 */
function equationOfTime(B_deg: number): number {
  const B = B_deg * DEG;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** Clamp seguro para evitar erros de domínio em asin/acos */
function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Infere o offset UTC a partir da longitude (convenção de meridiano central).
 * Exemplo: lng -48.5° (Belém) → UTC-3
 */
export function inferTimezone(lng: number): number {
  return Math.round(lng / 15);
}

/**
 * Converte mês (1–12) para o dia do ano representativo (médio do mês).
 * Usado para calcular o Sun Path Diagram mensal.
 */
export function monthToDayOfYear(month: number): number {
  const middays = [15, 45, 74, 105, 135, 162, 198, 228, 258, 288, 318, 344];
  return middays[Math.max(0, Math.min(11, month - 1))];
}

/**
 * Calcula a posição solar completa para um dia e localização específicos.
 *
 * @param lat        Latitude em graus decimais (negativo = Sul)
 * @param lng        Longitude em graus decimais (negativo = Oeste)
 * @param dayOfYear  Dia do ano (1–365)
 * @param timezone   Offset UTC em horas (padrão: inferido pela longitude)
 * @param samples    Pontos por dia (padrão: 96 = resolução de 15 min)
 */
export function calculateSolarDay(
  lat: number,
  lng: number,
  dayOfYear: number,
  timezone: number = inferTimezone(lng),
  samples: number = 96
): SolarDayInfo {
  // ── 1. Parâmetros fixos do dia ─────────────────────────────────────────────
  const B    = dayAngle(dayOfYear);
  const decl = solarDeclination(B);
  const EoT  = equationOfTime(B);

  // Correção de tempo (min): diferença entre lng real e meridiano padrão do fuso
  const stdMeridian = timezone * 15;
  const TC = 4 * (lng - stdMeridian) + EoT;

  // Meio-dia solar em hora local (quando ângulo horário HA = 0)
  const solarNoon = 12 - TC / 60;

  // ── 2. Sunrise / Sunset ────────────────────────────────────────────────────
  // Inclui −0.833° de refração atmosférica (limbo superior no horizonte)
  const sinElev0 = Math.sin(-0.833 * DEG);
  const cosHA_sr = (sinElev0 - Math.sin(lat * DEG) * Math.sin(decl * DEG))
                 / (Math.cos(lat * DEG) * Math.cos(decl * DEG));

  let sunrise: number;
  let sunset: number;
  let daylength: number;

  if (cosHA_sr < -1) {
    // Dia polar: sol não se põe
    sunrise = 0; sunset = 24; daylength = 24;
  } else if (cosHA_sr > 1) {
    // Noite polar: sol não nasce
    sunrise = 12; sunset = 12; daylength = 0;
  } else {
    const HA_sr = Math.acos(cosHA_sr) * RAD;
    sunrise  = solarNoon - HA_sr / 15;
    sunset   = solarNoon + HA_sr / 15;
    daylength = sunset - sunrise;
  }

  // ── 3. Array de 96 pontos (resolução 15 min) ───────────────────────────────
  const step = 24 / samples;
  const points: SolarPoint[] = [];

  for (let i = 0; i < samples; i++) {
    const hourLocal = i * step;

    // Hora Solar Verdadeira (LST) e ângulo horário
    const LST = hourLocal + TC / 60;
    const HA  = 15 * (LST - 12); // graus; 0 = meio-dia solar

    // Elevação solar
    const sinElev =
      Math.sin(lat * DEG) * Math.sin(decl * DEG) +
      Math.cos(lat * DEG) * Math.cos(decl * DEG) * Math.cos(HA * DEG);
    const elevation = Math.asin(clamp(sinElev)) * RAD;

    // Azimute solar (0=N, crescente horário)
    let azimuth = 180; // fallback: Sul
    const cosElev = Math.cos(elevation * DEG);
    const cosLat  = Math.cos(lat * DEG);

    if (Math.abs(cosElev) > 1e-6 && Math.abs(cosLat) > 1e-6) {
      const cosAz =
        (Math.sin(decl * DEG) - Math.sin(elevation * DEG) * Math.sin(lat * DEG)) /
        (cosElev * cosLat);
      azimuth = Math.acos(clamp(cosAz)) * RAD;
      if (HA > 0) azimuth = 360 - azimuth; // tarde: sol a Oeste
    }

    // Irradiância normalizada = max(0, sin(elevation))
    const irradiance = elevation > 0 ? Math.max(0, sinElev) : 0;

    points.push({
      hour:       +hourLocal.toFixed(4),
      elevation:  +elevation.toFixed(2),
      azimuth:    +azimuth.toFixed(2),
      irradiance: +irradiance.toFixed(4),
    });
  }

  return {
    sunrise:     +sunrise.toFixed(4),
    sunset:      +sunset.toFixed(4),
    solarNoon:   +solarNoon.toFixed(4),
    daylength:   +daylength.toFixed(4),
    declination: +decl.toFixed(2),
    points,
  };
}

/**
 * Calcula os dados solares para os 12 meses do ano (dia médio de cada mês).
 * Usado pelo Sun Path Diagram para desenhar os arcos anuais.
 */
export function calculateSolarYear(
  lat: number,
  lng: number,
  timezone: number = inferTimezone(lng)
): SolarDayInfo[] {
  return Array.from({ length: 12 }, (_, i) =>
    calculateSolarDay(lat, lng, monthToDayOfYear(i + 1), timezone)
  );
}

/**
 * Projeta os pontos de um dia solar para coordenadas SVG em projeção gnômica polar.
 *
 * Mapeamento:
 *   - Centro (cx, cy) = zênite (elevation 90°)
 *   - Borda do círculo = horizonte (elevation 0°)
 *   - Azimute 0° (Norte) = topo; 90° (Leste) = direita
 *
 * @param points  Array de SolarPoint (filtrado para elevation >= 0)
 * @param cx      Centro X do SVG
 * @param cy      Centro Y do SVG
 * @param r       Raio do círculo de horizonte
 */
export function solarPointsToSVG(
  points: SolarPoint[],
  cx: number,
  cy: number,
  r: number
): Array<{ x: number; y: number; elevation: number; azimuth: number; irradiance: number; hour: number }> {
  return points
    .filter(p => p.elevation >= 0)
    .map(p => {
      const dist   = r * (1 - p.elevation / 90);
      const az_rad = p.azimuth * DEG;
      return {
        x:          +(cx + dist * Math.sin(az_rad)).toFixed(2),
        y:          +(cy - dist * Math.cos(az_rad)).toFixed(2),
        elevation:  p.elevation,
        azimuth:    p.azimuth,
        irradiance: p.irradiance,
        hour:       p.hour,
      };
    });
}

/**
 * Calcula a perda de geração por orientação subótima do painel.
 *
 * Aproximação: gainFactor = max(0, cos(deviation))
 * onde deviation é o ângulo entre o azimute real e o ótimo.
 *
 * Zona ótima: ±30° do Norte (hemisfério Sul) ou Sul (hemisfério Norte).
 *
 * @param panelAzimuth  Azimute do painel (0=N, 90=L, 180=S, 270=O)
 * @param lat           Latitude do projeto em graus decimais
 */
export function calculateAzimuthLoss(
  panelAzimuth: number,
  lat: number
): AzimuthLossResult {
  // Norte (0°) = ótimo para hemisfério Sul; Sul (180°) = ótimo para hemisfério Norte
  const optimalAzimuth = lat <= 0 ? 0 : 180;

  // Desvio angular mínimo (0–180°)
  let deviation = Math.abs(panelAzimuth - optimalAzimuth);
  if (deviation > 180) deviation = 360 - deviation;

  const gainFactor = Math.max(0, Math.cos(deviation * DEG));
  const lossPct    = +((1 - gainFactor) * 100).toFixed(1);

  return {
    optimalAzimuth,
    lossPct,
    isOptimal: deviation <= 30,
  };
}
