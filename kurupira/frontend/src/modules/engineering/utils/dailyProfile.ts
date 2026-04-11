/**
 * =============================================================================
 * DAILY GENERATION PROFILE — Spec 01
 * =============================================================================
 * Gera o perfil horário (24 pontos) de geração para um mês específico,
 * usando uma bell-curve solar quadrática normalizada pelo HSP do mês.
 * =============================================================================
 */

/**
 * Gera o perfil de geração horária para um dia típico do mês.
 * A integral dos 24 pontos é consistente com (P_DC × HSP × PR).
 *
 * @param P_DC_kW - Potência de pico instalada em kW
 * @param HSP - HSP do mês (kWh/m²/dia)
 * @param PR - Performance Ratio (0-1)
 * @returns Array de 24 valores (kWh por hora)
 */
export const getDailyProfile = (P_DC_kW: number, HSP: number, PR: number): number[] => {
  const sunriseHour = 6;
  const sunsetHour = 18;
  const peakHour = 12;

  // Gerar perfil bruto (bell-curve quadrática)
  const rawProfile: number[] = [];
  let sumRaw = 0;

  for (let h = 0; h < 24; h++) {
    if (h <= sunriseHour || h >= sunsetHour) {
      rawProfile.push(0);
    } else {
      const dist = Math.abs(h - peakHour);
      const halfSpan = (sunsetHour - sunriseHour) / 2;
      const raw = Math.max(0, 1 - (dist / halfSpan) ** 2);
      rawProfile.push(raw);
      sumRaw += raw;
    }
  }

  // Normalizar: escalar para que a soma represente HSP × P_DC × PR
  if (sumRaw === 0) return Array(24).fill(0);

  const dailyTotal = P_DC_kW * HSP * PR;
  const scale = dailyTotal / sumRaw;

  return rawProfile.map(v => v * scale);
};

/**
 * Retorna as horas do dia como labels formatadas.
 */
export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`);
