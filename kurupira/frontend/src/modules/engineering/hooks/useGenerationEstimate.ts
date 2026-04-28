import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface GenerationEstimate {
  /** Geração mensal estimada (12 valores em kWh) */
  monthlyGeneration: number[];
  /** Consumo total mensal (12 valores em kWh, agregado de todas as UCs + cargas simuladas) */
  monthlyConsumption: number[];
  /** Total anual de geração em kWh */
  totalAnnualGeneration: number;
  /** Total anual de consumo em kWh */
  totalAnnualConsumption: number;
  /** Média mensal de geração em kWh */
  avgMonthlyGeneration: number;
  /** Média mensal de consumo em kWh */
  avgMonthlyConsumption: number;
  /** Cobertura: geração_anual / consumo_anual × 100 (%) */
  coveragePercent: number;
  /** Dados formatados para recharts */
  chartData: Array<{
    mes: string;
    geracao: number;
    consumo: number;
  }>;
  /** Se há dados suficientes para renderizar o gráfico */
  hasData: boolean;
}

/**
 * Calcula a geração mensal estimada do sistema FV e compara com o consumo.
 * 
 * Fórmula por mês: Geração_i = (totalDcKwp × HSP_i × 30 × PR)
 * onde:
 *   - totalDcKwp = soma da potência de todos os módulos selecionados (em kWp)
 *   - HSP_i = irradiação solar média do mês i (kWh/m²/dia)
 *   - PR = Performance Ratio (adicionado, já inclui perdas do sistema)
 */
export const useGenerationEstimate = (): GenerationEstimate => {
  const clientData = useSolarStore(s => s.clientData);
  const modules = useSolarStore(selectModules);
  const simulatedItems = useSolarStore(s => s.simulatedItems);
  const { getAdditivePerformanceRatio } = useTechStore();

  return useMemo(() => {
    // ── Potência DC total ──
    const totalDcKwp = modules.reduce((sum, m) => sum + m.power, 0) / 1000;

    // ── Performance Ratio ──
    const pr = getAdditivePerformanceRatio();

    // ── HSP mensal (fonte: weather API ou dados manuais) ──
    const hspMonthly = clientData.monthlyIrradiation?.length === 12
      ? clientData.monthlyIrradiation
      : Array(12).fill(4.5); // Fallback conservador

    // ── Geração mensal estimada ──
    const monthlyGeneration = hspMonthly.map(hsp => totalDcKwp * hsp * 30 * pr);

    // ── Consumo mensal (agregado de todas as UCs) ──
    const invoices = clientData.invoices || [];
    const baseConsumption = Array(12).fill(0);
    invoices.forEach(inv => {
      const history = inv.monthlyHistory?.length === 12 ? inv.monthlyHistory : Array(12).fill(0);
      for (let i = 0; i < 12; i++) {
        baseConsumption[i] += history[i];
      }
    });

    // ── Cargas simuladas (uniformes por mês) ──
    const simulatedMonthly = Object.values(simulatedItems.entities).reduce((sum, item) => {
      const duty = item.dutyCycle ?? 1;
      return sum + ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
    }, 0);

    const monthlyConsumption = baseConsumption.map(val => val + simulatedMonthly);

    // ── Métricas agregadas ──
    const totalAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
    const totalAnnualConsumption = monthlyConsumption.reduce((a, b) => a + b, 0);
    const avgMonthlyGeneration = totalAnnualGeneration / 12;
    const avgMonthlyConsumption = totalAnnualConsumption / 12;
    const coveragePercent = totalAnnualConsumption > 0
      ? (totalAnnualGeneration / totalAnnualConsumption) * 100
      : 0;

    // ── Chart data para recharts ──
    const chartData = MESES.map((mes, i) => ({
      mes,
      geracao: monthlyGeneration[i],
      consumo: monthlyConsumption[i],
    }));

    const hasData = totalDcKwp > 0 && monthlyConsumption.some(v => v > 0);

    return {
      monthlyGeneration,
      monthlyConsumption,
      totalAnnualGeneration,
      totalAnnualConsumption,
      avgMonthlyGeneration,
      avgMonthlyConsumption,
      coveragePercent,
      chartData,
      hasData,
    };
  }, [modules, clientData, simulatedItems, getAdditivePerformanceRatio]);
};
