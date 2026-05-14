/**
 * =============================================================================
 * useThermalPremises — Fonte Única de Verdade para Premissas Térmicas
 * =============================================================================
 *
 * Centraliza a resolução de Tmin / Tmax / Tcell_max para evitar duplicidade
 * entre ElectricalCanvasView e useElectricalValidation, que antes calculavam
 * tcell_max de forma independente e podiam divergir silenciosamente.
 *
 * Precedência:
 *   Tmin:    manualTmin > TMIN_POR_UF[uf] > 10°C (fallback genérico)
 *   Tmax:    manualTmax > 35°C (tropical) | 30°C (temperado)
 *   Tcell:   Tamb_max + (NOCT - 20) × (1000/800)  [NBR 16690 / IEC 61215]
 *
 * Norma: NBR 16690:2019, §4.3.1.2
 * =============================================================================
 */

import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { ENGINEERING_CONSTANTS } from '../constants/engineeringConstants';

// ─────────────────────────────────────────────────────────────────────────────
// TABELAS DE REFERÊNCIA (fonte única — não duplicar em outros módulos)
// ─────────────────────────────────────────────────────────────────────────────

/** Estados com clima tropical úmido / semiárido quente (base para Tmax padrão = 35°C) */
export const ESTADOS_TROPICAIS = new Set([
  'AM', 'PA', 'RR', 'AP', 'AC', 'RO', 'TO',
  'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA',
]);

/**
 * Temperatura mínima histórica por UF (°C) — pior caso Q5 (percentil 5).
 * Base: série histórica INMET/CRESESB.
 */
export const TMIN_POR_UF: Record<string, number> = {
  RS: 0,  SC: 2,  PR: 5,
  SP: 8,  MG: 8,  RJ: 12, ES: 12,
  MS: 8,  GO: 10, DF: 8,  MT: 15,
  BA: 15, SE: 18, AL: 18, PE: 18, PB: 18, RN: 18,
  CE: 20, PI: 20, MA: 22, TO: 20,
  PA: 22, AM: 22, AC: 20, RO: 20, RR: 22, AP: 22,
};

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ThermalPremises {
  /** Temperatura ambiente mínima histórica (°C) — usada para Voc máx (frio extremo) */
  tmin: number;
  /** Temperatura ambiente máxima (°C) — usada para Tcell_max */
  tambMax: number;
  /**
   * Temperatura máxima da célula (°C).
   * Fórmula: Tamb_max + (NOCT − 20) × (1000/800)
   * NBR 16690:2019, §4.3.1.2
   */
  tcellMax: number;
  /** NOCT do módulo representativo (°C) */
  noct: number;
  /** UF do projeto (vazio se não informado) */
  uf: string;
  /** true quando o clima enquadra região tropical brasileira */
  isTropical: boolean;
  /** true se Tmin está usando fallback (UF ou genérico) — exibir aviso na UI */
  usingFallbackTmin: boolean;
  /** true se Tmax está usando fallback (padrão regional) — exibir aviso na UI */
  usingFallbackTmax: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export const useThermalPremises = (): ThermalPremises => {
  const settings   = useSolarStore(state => state.settings);
  const clientData = useSolarStore(state => state.clientData);
  const modules    = useSolarStore(selectModules);

  // Extraímos primitivos para evitar re-renders por referência de objeto
  const manualTmin = (settings as any)?.manualTmin as number | undefined;
  const manualTmax = (settings as any)?.manualTmax as number | undefined;
  const uf         = (clientData as any)?.state as string ?? '';
  const noct       = (modules[0] as any)?.noct as number | undefined;

  return useMemo((): ThermalPremises => {
    const isTropical = ESTADOS_TROPICAIS.has(uf);

    const usingFallbackTmin = manualTmin == null;
    const tmin = manualTmin ?? TMIN_POR_UF[uf] ?? 10;

    const usingFallbackTmax = manualTmax == null;
    const tambMax = manualTmax ?? (isTropical ? 35 : 30);

    const resolvedNoct = noct ?? ENGINEERING_CONSTANTS.DEFAULT_NOCT;

    // Fórmula NBR 16690:2019 §4.3.1.2 — fator 1000/800 converte base NOCT (800 W/m²) para STC (1000 W/m²)
    const tcellMax = tambMax + (resolvedNoct - 20) * (1000 / 800);

    return {
      tmin,
      tambMax,
      tcellMax,
      noct: resolvedNoct,
      uf,
      isTropical,
      usingFallbackTmin,
      usingFallbackTmax,
    };
  }, [manualTmin, manualTmax, uf, noct]);
};
