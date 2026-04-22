/**
 * =============================================================================
 * PROJECTION MATH MOTOR — Versão Segregação de Base (Engenharia PV)
 * =============================================================================
 * Focado no tripé: Consumo, Geração e Decomposição de Custos (RN 1000/2021).
 * =============================================================================
 */

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface ProjectionMonthData {
  month: string;
  cons: number; // Total for backward compat if needed, but we'll use the parts
  baseCons: number;
  addedLoad: number;
  gen: number;
  excedente: number;
  deficit: number;
  economiaMes: number;
  faturaOriginal: number;
  faturaNova: number;
}

export interface FinancialWaterfallData {
  label: string;
  value: number;
  display: number;
  type: 'base' | 'reduction' | 'addition' | 'result';
}

export interface BankMonthData {
  month: string;
  saldo: number;
  deposito: number;
  saque: number;
}

export interface ROIYearData {
  year: number;
  savings: number;
  cumulative: number;
}

export interface ProjectionStats {
  barData: ProjectionMonthData[];
  bankData: BankMonthData[];
  roiData: ROIYearData[];
  waterfallData: FinancialWaterfallData[];
  totalGen: number;
  totalCons: number; // Total combined
  totalBaseCons: number; // Historical only
  totalAddedLoad: number; // Simulated only
  coverage: number;
  economiaAno: number;
  faturaNovaMedia: number;
  faturaOriginalMedia: number;
  faturaBaseMedia: number; // Fatura sem as cargas novas
}

export function calculateProjectionStats(params: {
  totalPowerKw: number;
  hsp: number[];
  monthlyConsumption: number[];
  additionalLoadsMonthly?: number[]; // [Jan...Dez] em kWh
  prDecimal: number;
  connectionType?: string;
  tariffRate: number;
  cosip: number;
}): ProjectionStats {
  const { 
    totalPowerKw, hsp, monthlyConsumption, additionalLoadsMonthly,
    prDecimal, connectionType, tariffRate, cosip 
  } = params;

  function getMinAvailability(conn: string | undefined): number {
    if (conn === 'trifasico') return 100;
    if (conn === 'bifasico')  return 50;
    return 30; // Monofásico
  }

  const minChargeKwh = getMinAvailability(connectionType);
  let sumCons = 0, sumGen = 0, sumEconomia = 0, sumFaturaNova = 0, sumFaturaOriginal = 0;
  let sumBaseCons = 0, sumAddedLoad = 0, sumFaturaBase = 0;

  const barData = MONTHS.map((month, i) => {
    const baseCons = monthlyConsumption[i] || 0;
    const addedLoad = additionalLoadsMonthly ? (additionalLoadsMonthly[i] || 0) : 0;
    const cons = +(baseCons + addedLoad).toFixed(2);

    const days = DAYS_IN_MONTH[i];
    const gen = +(totalPowerKw * (hsp[i] || 0) * prDecimal * days).toFixed(2);
    
    const excedente = +Math.max(0, gen - cons).toFixed(2);
    const deficit = +Math.max(0, cons - gen).toFixed(2);
    
    // Economia Real: O que o sistema abate respeitando o piso da fatura
    const savingsKwh = Math.min(gen, Math.max(0, cons - minChargeKwh));
    const economiaMes = +(savingsKwh * tariffRate).toFixed(2);

    // Fatura Original: (Base + Adicional) * Tarifa + COSIP
    const faturaOriginal = +(cons * tariffRate + cosip).toFixed(2);
    
    // Fatura Base: Apenas o que ele paga HOJE
    const faturaBase = +(baseCons * tariffRate + cosip).toFixed(2);
    
    // Fatura Nova: (Max(MinCharge, Cons - Gen) * Tarifa) + COSIP
    const faturaNova = +(Math.max(minChargeKwh, cons - gen) * tariffRate + cosip).toFixed(2);

    sumCons += cons;
    sumBaseCons += baseCons;
    sumAddedLoad += addedLoad;
    sumGen += gen;
    sumEconomia += economiaMes;
    sumFaturaOriginal += faturaOriginal;
    sumFaturaBase += faturaBase;
    sumFaturaNova += faturaNova;

    return { 
      month, 
      cons, 
      baseCons, 
      addedLoad, 
      gen, 
      excedente, 
      deficit, 
      economiaMes, 
      faturaOriginal, 
      faturaNova 
    };
  });

  // Banco de créditos ANEEL
  let saldoAcum = 0;
  const bankData = barData.map((d) => {
    const net = d.gen - d.cons;
    const deposito = Math.max(0, net);
    const saque = Math.max(0, -net);
    
    saldoAcum = +Math.max(0, saldoAcum + net).toFixed(2);
    return { month: d.month, saldo: saldoAcum, deposito, saque };
  });

  // --- LÓGICA DO WATERFALL DE SEGREGAÇÃO (Rigor Técnico) ---
  const avgGen = sumGen / 12;
  const avgCons = sumCons / 12;
  const avgFaturaNova = sumFaturaNova / 12;

  // 1. Custo Disponibilidade (Piso ineliminável pela Geração)
  const availabilityCost = minChargeKwh * tariffRate;
  
  // 2. Energia Compensável (A parcela do consumo que o solar PODE abater)
  const compensableEnergy = Math.max(0, avgCons - minChargeKwh) * tariffRate;

  // 3. Economia Solar Efetiva (Atua estritamente sobre a energia compensável)
  const effectiveSolarSavings = Math.min(avgGen, Math.max(0, avgCons - minChargeKwh)) * tariffRate;

  const waterfallData: FinancialWaterfallData[] = [
    { label: 'Fatura Atual', value: sumFaturaBase / 12, display: sumFaturaBase / 12, type: 'base' },
    { label: 'Custo Novas Cargas', value: (sumFaturaOriginal - sumFaturaBase) / 12, display: (sumFaturaOriginal - sumFaturaBase) / 12, type: 'addition' },
    { label: 'Custo Disponibilidade', value: availabilityCost, display: availabilityCost, type: 'base' },
    { label: 'Energia Compensável', value: compensableEnergy, display: compensableEnergy, type: 'addition' },
    { label: 'Economia Solar', value: -effectiveSolarSavings, display: effectiveSolarSavings, type: 'reduction' },
    { label: 'Iluminação Pública', value: cosip, display: cosip, type: 'addition' },
    { label: 'Nova Fatura', value: avgFaturaNova, display: avgFaturaNova, type: 'result' },
  ];

  const coverage = sumCons > 0 ? +(sumGen / sumCons * 100).toFixed(1) : 0;

  // ROI 25 anos
  const roiData: ROIYearData[] = [];
  let cumulative = 0;
  const DEGRADATION = 0.005, INFLATION = 0.05;

  for (let year = 1; year <= 25; year++) {
    let savingsYear = 0;
    const tariffYear = tariffRate * Math.pow(1 + INFLATION, year - 1);
    const degradationFactor = Math.pow(1 - DEGRADATION, year - 1);

    barData.forEach((d) => {
      const genMonth = d.gen * degradationFactor;
      const cappedSavingsKwh = Math.max(0, Math.min(genMonth, d.cons - minChargeKwh));
      savingsYear += cappedSavingsKwh * tariffYear;
    });

    cumulative = +(cumulative + savingsYear).toFixed(2);
    roiData.push({ year, savings: +savingsYear.toFixed(2), cumulative });
  }

  return {
    barData,
    bankData,
    roiData,
    waterfallData,
    totalGen: +sumGen.toFixed(0),
    totalCons: +sumCons.toFixed(0),
    totalBaseCons: +sumBaseCons.toFixed(0),
    totalAddedLoad: +sumAddedLoad.toFixed(0),
    coverage,
    economiaAno: +sumEconomia.toFixed(2),
    faturaNovaMedia: +avgFaturaNova.toFixed(2),
    faturaOriginalMedia: +(sumFaturaOriginal / 12).toFixed(2),
    faturaBaseMedia: +(sumFaturaBase / 12).toFixed(2),
  };
}
