/**
 * =============================================================================
 * DAILY GENERATION PROFILE — Spec 01
 * =============================================================================
 * Gera o perfil horário (24 pontos) de geração para um mês específico,
 * usando uma bell-curve solar quadrática normalizada pelo HSP do mês.
 * =============================================================================
 */

export const SAMPLES_PER_HOUR = 4;
export const TOTAL_SAMPLES = 24 * SAMPLES_PER_HOUR;

/**
 * Gera o perfil de geração horária para um dia típico do mês com alta resolução.
 * A integral dos pontos é consistente com (P_DC × HSP × PR).
 *
 * @param P_DC_kW - Potência de pico instalada em kW
 * @param HSP - HSP do mês (kWh/m²/dia)
 * @param PR - Performance Ratio (0-1)
 * @param withNoise - Se true, injeta intermitências realistas (nuvens, jitter)
 * @returns Array de 96 valores (densidade de 15 minutos)
 */
export const getDailyProfile = (
  P_DC_kW: number, 
  HSP: number, 
  PR: number, 
  withNoise: boolean = false
): number[] => {
  const sunriseHour = 6;
  const sunsetHour = 18;
  const peakHour = 12;

  // Gerar perfil bruto (bell-curve solar padrão)
  const rawProfile: number[] = [];
  let sumRaw = 0;

  // Estado para eventos de nuvem (persistência temporal simples)
  let cloudEventIntensity = 0;
  let cloudDuration = 0;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const h = i / SAMPLES_PER_HOUR;

    if (h <= sunriseHour || h >= sunsetHour) {
      rawProfile.push(0);
    } else {
      const dist = Math.abs(h - peakHour);
      const halfSpan = (sunsetHour - sunriseHour) / 2;
      
      // Bell curve base (Quadrática)
      const bell = Math.max(0, 1 - (dist / halfSpan) ** 2);
      
      let factor = 1;

      if (withNoise) {
        // 1. Jitter de alta frequência (±3%)
        const jitter = 1 + (Math.random() - 0.5) * 0.06;
        
        // 2. Lógica de Cloud Events (Intermitência)
        if (cloudDuration <= 0) {
          // Chance de iniciar uma nuvem (5% a cada 15 min se o sol estiver forte)
          if (bell > 0.3 && Math.random() < 0.05) {
            cloudEventIntensity = 0.4 + Math.random() * 0.4; // 40-80% de queda
            cloudDuration = Math.floor(Math.random() * 3) + 1; // 1 a 3 samples (15-45 min)
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

  // Normalizar: escalar para que a soma represente (HSP × P_DC × PR) / SAMPLES_PER_HOUR
  if (sumRaw === 0) return Array(TOTAL_SAMPLES).fill(0);

  const dailyTotal = P_DC_kW * HSP * PR;
  const scale = (dailyTotal * SAMPLES_PER_HOUR) / sumRaw;

  // Retorna o valor de kWh *gerado naquela fração de hora*
  return rawProfile.map(v => (v * scale) / SAMPLES_PER_HOUR);
};

/**
 * Retorna as horas do dia como labels formatadas (96 pontos).
 */
export const HOUR_LABELS = Array.from({ length: TOTAL_SAMPLES }, (_, i) => {
  const h = Math.floor(i / SAMPLES_PER_HOUR);
  const m = (i % SAMPLES_PER_HOUR) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});
