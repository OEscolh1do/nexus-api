/**
 * Shared number/date formatters for the engineering module.
 * Single source of truth — eliminates the ~7 local formatBRL definitions.
 */

/** R$ 1.234,56 */
export function formatBRL(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 06/05/2026 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

/** 87,3% */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}
