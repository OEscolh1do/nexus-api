/**
 * =============================================================
 * ENGINEERING THRESHOLDS — Constantes Canônicas
 * =============================================================
 * Fonte única de verdade para limiares de validação elétrica.
 * Todos os componentes do Workspace devem importar daqui.
 */

// FDI (Fator de Dimensionamento do Inversor) — DC/AC Ratio
export const FDI_LOW_PERCENT = 75;   // Abaixo = Oversized AC (warning)
export const FDI_HIGH_PERCENT = 130; // Acima = Clipping Anual (error)

// Isc (Corrente de Curto-Circuito) — tolerância MPPT
// IEC 60364-7-712 §712.443 permite que a corrente de curto exceda o
// limite nominal do MPPT em até 25% antes de representar risco real.
// Abaixo deste multiplicador → warning não-bloqueante; acima → warning crítico.
export const ISC_SAFETY_MULTIPLIER = 1.25;

export type FdiStatus = 'ideal' | 'oversized' | 'clipping';

/**
 * Retorna a classificação do FDI a partir do ratio DC/AC.
 * @param dcAcRatio Ex: 1.20 (significa 120%)
 */
export const getFdiStatus = (dcAcRatio: number): FdiStatus => {
    const percent = dcAcRatio * 100;
    if (percent > FDI_HIGH_PERCENT) return 'clipping';
    if (percent < FDI_LOW_PERCENT) return 'oversized';
    return 'ideal';
};

export const FDI_STATUS_CONFIG: Record<FdiStatus, { label: string; color: string }> = {
    ideal:     { label: 'Ideal',           color: 'text-emerald-400' },
    oversized: { label: 'Oversized AC',    color: 'text-amber-400' },
    clipping:  { label: 'Clipping Anual',  color: 'text-red-400' },
};
