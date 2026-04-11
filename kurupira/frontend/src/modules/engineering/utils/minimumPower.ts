/**
 * =============================================================================
 * MINIMUM POWER CALCULATOR — Spec 03
 * =============================================================================
 * Dimensionamento reverso: dado o consumo e as condições locais,
 * calcula a potência mínima (kWp) para atingir a cobertura-alvo.
 * =============================================================================
 */

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Custo de Disponibilidade conforme ANEEL REN 1000/2021 Art. 624.
 * São os kWh mínimos que o cliente paga SEMPRE, independente da geração.
 */
export const getMinimumAvailability = (connectionType?: string): number => {
  if (connectionType === 'trifasico') return 100;
  if (connectionType === 'bifasico') return 50;
  return 30; // monofásico (default)
};

export interface MinimumPowerResult {
  /** Potência mínima exata para atingir a cobertura-alvo (kWp) */
  exactKwp: number;
  /** Arredondado para cima em múltiplos de 0.05 kWp */
  roundedKwp: number;
  /** Número estimado de módulos (se potência do módulo for fornecida) */
  estimatedModules: number | null;
  /** Geração anual por kWp instalado */
  yieldPerKwp: number;
}

/**
 * Calcula a potência mínima do sistema FV para atingir a cobertura-alvo.
 * 
 * @param monthlyConsumption - Array de 12 meses de consumo (kWh)
 * @param hspArray - Array de 12 meses de HSP (kWh/m²/dia)
 * @param pr - Performance Ratio (0-1)
 * @param targetCoverage - Percentual de cobertura desejado (1.0 = 100%)
 * @param connectionType - Tipo de conexão para custo de disponibilidade
 * @param modulePowerW - Potência do módulo selecionado em Watts (opcional)
 */
export const calculateMinimumPower = (
  monthlyConsumption: number[],
  hspArray: number[],
  pr: number,
  targetCoverage: number = 1.0,
  connectionType?: string,
  modulePowerW?: number,
): MinimumPowerResult => {
  const minAvail = getMinimumAvailability(connectionType);

  // Consumo abatível = Total - (12 × Taxa Mínima)
  // Só precisamos gerar o que excede a taxa mínima mensal
  const consumoAbativel = monthlyConsumption.map(c => Math.max(0, c - minAvail));
  const consumoAbativelAnual = consumoAbativel.reduce((a, b) => a + b, 0);

  // Geração anual por kWp instalado (Yield)
  const yieldPerKwp = hspArray.reduce((acc, hsp, i) => {
    return acc + (hsp || 0) * DAYS_IN_MONTH[i] * pr;
  }, 0);

  if (yieldPerKwp === 0) {
    return { exactKwp: 0, roundedKwp: 0, estimatedModules: null, yieldPerKwp: 0 };
  }

  const exactKwp = (consumoAbativelAnual * targetCoverage) / yieldPerKwp;
  const roundedKwp = Math.ceil(exactKwp * 20) / 20; // múltiplos de 0.05

  const estimatedModules = modulePowerW && modulePowerW > 0
    ? Math.ceil((roundedKwp * 1000) / modulePowerW)
    : null;

  return { exactKwp, roundedKwp, estimatedModules, yieldPerKwp };
};
