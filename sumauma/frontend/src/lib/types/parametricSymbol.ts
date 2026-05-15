/**
 * parametricSymbol.ts — Tipos compartilhados do Parametric Symbol Builder
 * 
 * Este arquivo espelha os tipos definidos em:
 * kurupira/frontend/src/core/schemas/inverterSchema.ts
 *
 * Fonte da verdade: Kurupira frontend (Zod schema).
 * Este arquivo: definição TS pura para uso no Sumaúma frontend (sem Zod).
 */

/** Chave tipada de porta: `mppt_N_pos`, `mppt_N_neg`, ou `ac_out` */
export type PortKey = `mppt_${number}_${'pos' | 'neg'}` | 'ac_out';

export interface ParametricPort {
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;       // 0–1 ao longo do lado
  label: string;
  polarity: 'positive' | 'negative' | 'ac-out';
  mpptIndex?: number;   // undefined apenas para 'ac_out'
}

export interface ParametricSymbolConfig {
  type: 'parametric-block';
  dimensions: { width: number; height: number };
  ports: Record<string, ParametricPort>;
}
