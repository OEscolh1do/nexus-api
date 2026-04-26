/**
 * =============================================================================
 * JOURNEY SLICE — Estado da Jornada do Integrador (Spec 02)
 * =============================================================================
 *
 * Slice enxuto responsável APENAS pelo fluxo de dados de engenharia da jornada:
 * - loadGrowthFactor: Fator de crescimento de carga (0-50%)
 * - kWpAlvo: Potência de pico alvo calculada a partir do consumo
 *
 * NÃO contém `currentStep` nem `stepStatus` — o stepper linear foi eliminado.
 * A navegação é controlada por `activeFocusedBlock` no `uiStore`.
 *
 * Fórmula de kWpAlvo:
 *   consumoMedioMensal = mean(monthlyConsumption) × (1 + loadGrowthFactor)
 *   consumoAnual = consumoMedioMensal × 12
 *   kWpAlvo = consumoAnual / (hspMedioAnual × 365 × PR)
 *
 * Referência: spec-03-potencia-minima-recomendada / NBR 16690:2019
 * =============================================================================
 */

import { StateCreator } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface JourneySlice {
  /** Fator de crescimento de carga futuro (0 a 50, em %). Default: 0 */
  loadGrowthFactor: number;

  /**
   * Potência de pico alvo calculada a partir dos dados de consumo.
   * null = dados insuficientes para calcular (sem consumo ou sem HSP).
   */
  kWpAlvo: number | null;

  /** Actions */
  setLoadGrowthFactor: (v: number) => void;
  setKWpAlvo: (v: number | null) => void;
}

// =============================================================================
// FACTORY
// =============================================================================

export const createJourneySlice: StateCreator<
  JourneySlice,
  [],
  [],
  JourneySlice
> = (set) => ({
  loadGrowthFactor: 0,
  kWpAlvo: null,

  setLoadGrowthFactor: (v) => set({ loadGrowthFactor: Math.max(-100, Math.min(10000, v)) }),
  setKWpAlvo: (v) => set({ kWpAlvo: v }),
});

// =============================================================================
// SELECTOR HELPERS (usados fora do slice — nos componentes)
// =============================================================================

/**
 * Calcula kWpAlvo a partir dos dados brutos.
 * Exportado como utilitário puro para uso no useEffect da ConsumptionCanvasView.
 *
 * @param monthlyKwh     - Array de 12 valores mensais de consumo (kWh)
 * @param monthlyHsp     - Array de 12 valores de HSP (kWh/m²/dia)
 * @param growthFactor   - Fator de crescimento em % (0-50)
 * @param pr             - Performance Ratio (0-1, default 0.80)
 * @returns kWpAlvo em kWp, ou null se dados insuficientes
 */
export function calcKWpAlvo(
  monthlyKwh: number[],
  monthlyHsp: number[],
  growthFactor: number,
  pr = 0.80
): number | null {
  if (!monthlyKwh || monthlyKwh.length === 0) return null;

  const validKwh = monthlyKwh.filter((v) => v > 0);
  const validHsp = monthlyHsp.filter((v) => v > 0);
  if (validKwh.length === 0 || validHsp.length === 0) return null;

  const mediaKwh = validKwh.reduce((a, b) => a + b, 0) / validKwh.length;
  const mediaHsp = validHsp.reduce((a, b) => a + b, 0) / validHsp.length;

  const consumoMedioAjustado = mediaKwh * (1 + growthFactor / 100);
  const consumoAnual = consumoMedioAjustado * 12;

  if (mediaHsp <= 0 || pr <= 0) return null;

  const kWpAlvo = consumoAnual / (mediaHsp * 365 * pr);
  return Math.round(kWpAlvo * 100) / 100; // Arredonda 2 casas
}
