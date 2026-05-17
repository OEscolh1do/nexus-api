/**
 * =============================================================================
 * DAILY GENERATION PROFILE — Spec 01 (rev. 2 — Solar Position Engine)
 * =============================================================================
 * Gera o perfil horário (96 pontos × 15 min) de geração para um dia típico.
 *
 * MODO ASTRONÔMICO (padrão quando `solarDayInfo` é fornecido):
 *   Usa a irradiância real calculada pelo solarPosition.ts (sin(elevação)).
 *   Sunrise/Sunset/SolarNoon são os valores astronômicos corretos para a
 *   latitude e longitude do projeto.
 *
 * MODO FALLBACK (sem `solarDayInfo`):
 *   Bell-curve quadrática hardcoded (sunrise=6h, sunset=18h, peak=12h).
 *   Mantém compatibilidade total com todos os consumidores existentes.
 *
 * Em ambos os modos, a integral é normalizada para (P_DC × HSP × PR).
 * =============================================================================
 */

import type { SolarDayInfo } from './solarPosition';

export const SAMPLES_PER_HOUR = 4;
export const TOTAL_SAMPLES    = 24 * SAMPLES_PER_HOUR; // 96 amostras

/**
 * Gera o perfil de geração horária para um dia típico do mês.
 * A integral dos pontos é consistente com (P_DC × HSP × PR).
 *
 * @param P_DC_kW    - Potência de pico instalada em kW
 * @param HSP        - Irradiação diária do mês (kWh/m²/dia)
 * @param PR         - Performance Ratio (0–1)
 * @param withNoise  - Injeta intermitências realistas (nuvens, jitter)
 * @param solarDayInfo - (Opcional) Dados astronômicos de solarPosition.ts.
 *                     Quando fornecido, usa irradiância real em vez da bell-curve.
 * @returns Array de 96 valores de kWh gerado por intervalo de 15 min.
 */
export const getDailyProfile = (
  P_DC_kW: number,
  HSP: number,
  PR: number,
  withNoise: boolean = false,
  solarDayInfo?: SolarDayInfo
): number[] => {

  const rawProfile: number[] = [];
  let sumRaw = 0;

  // ── MODO ASTRONÔMICO: usa irradiância real do solarPosition engine ──────────
  if (solarDayInfo) {
    // Estado de nuvem (idêntico ao modo fallback para consistência)
    let cloudEventIntensity = 0;
    let cloudDuration = 0;

    for (let i = 0; i < TOTAL_SAMPLES; i++) {
      const irr = solarDayInfo.points[i]?.irradiance ?? 0; // 0–1, sin(elevation)

      let factor = 1;

      if (withNoise && irr > 0) {
        const jitter = 1 + (Math.random() - 0.5) * 0.06;
        if (cloudDuration <= 0) {
          if (irr > 0.2 && Math.random() < 0.05) {
            cloudEventIntensity = 0.4 + Math.random() * 0.4;
            cloudDuration = Math.floor(Math.random() * 3) + 1;
          } else {
            cloudEventIntensity = 0;
          }
        } else {
          cloudDuration--;
        }
        factor = jitter * (1 - cloudEventIntensity);
      }

      const val = irr * factor;
      rawProfile.push(val);
      sumRaw += val;
    }
  }

  // ── MODO FALLBACK: bell-curve quadrática (comportamento original) ───────────
  else {
    const sunriseHour = 6;
    const sunsetHour  = 18;
    const peakHour    = 12;

    let cloudEventIntensity = 0;
    let cloudDuration = 0;

    for (let i = 0; i < TOTAL_SAMPLES; i++) {
      const h = i / SAMPLES_PER_HOUR;

      if (h <= sunriseHour || h >= sunsetHour) {
        rawProfile.push(0);
        continue;
      }

      const dist     = Math.abs(h - peakHour);
      const halfSpan = (sunsetHour - sunriseHour) / 2;
      const bell     = Math.max(0, 1 - (dist / halfSpan) ** 2);

      let factor = 1;

      if (withNoise) {
        const jitter = 1 + (Math.random() - 0.5) * 0.06;
        if (cloudDuration <= 0) {
          if (bell > 0.3 && Math.random() < 0.05) {
            cloudEventIntensity = 0.4 + Math.random() * 0.4;
            cloudDuration = Math.floor(Math.random() * 3) + 1;
          } else {
            cloudEventIntensity = 0;
          }
        } else {
          cloudDuration--;
        }
        factor = jitter * (1 - cloudEventIntensity);
      }

      const val = bell * factor;
      rawProfile.push(val);
      sumRaw += val;
    }
  }

  // ── NORMALIZAÇÃO (idêntica em ambos os modos) ─────────────────────────────
  if (sumRaw === 0) return Array(TOTAL_SAMPLES).fill(0);

  const dailyTotal = P_DC_kW * HSP * PR;
  const scale      = (dailyTotal * SAMPLES_PER_HOUR) / sumRaw;

  return rawProfile.map(v => (v * scale) / SAMPLES_PER_HOUR);
};

/**
 * Labels formatadas para os 96 pontos de 15 min (00:00 → 23:45).
 */
export const HOUR_LABELS = Array.from({ length: TOTAL_SAMPLES }, (_, i) => {
  const h = Math.floor(i / SAMPLES_PER_HOUR);
  const m = (i % SAMPLES_PER_HOUR) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

// ─── RE-EXPORT para consumidores que importam SolarDayInfo daqui ──────────────
export type { SolarDayInfo };
