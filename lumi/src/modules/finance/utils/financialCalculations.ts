import { FinanceParams, FinanceResults, initialFinanceResults } from '../store/financeSchema';

/**
 * Calculates the Net Present Value (NPV / VPL)
 * @param cashFlows Array of cash flows (year 0 is usually negative CAPEX)
 * @param discountRate Annual discount rate in percentage (e.g., 10 for 10%)
 */
export const calculateNPV = (cashFlows: number[], discountRate: number): number => {
  const r = discountRate / 100;
  return cashFlows.reduce((acc, val, t) => acc + val / Math.pow(1 + r, t), 0);
};

/**
 * Calculates the Internal Rate of Return (IRR / TIR) using Newton-Raphson approximation
 * @param cashFlows Array of cash flows
 * @param guess Initial guess for IRR (default 0.1)
 */
export const calculateIRR = (cashFlows: number[], guess = 0.1): number => {
  const maxIterations = 100;
  const tolerance = 0.00001;
  let r = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0; // Derivative of NPV with respect to r

    for (let t = 0; t < cashFlows.length; t++) {
      const term = Math.pow(1 + r, t);
      npv += cashFlows[t] / term;
      if (t > 0) {
        derivative -= (t * cashFlows[t]) / (term * (1 + r));
      }
    }

    if (Math.abs(npv) < tolerance) {
      return r * 100; // Return as percentage
    }

    if (derivative === 0) return 0; // Avoid division by zero
    const newR = r - npv / derivative;

    // Safety break for divergence
    if (Math.abs(newR - r) < tolerance) return newR * 100;

    r = newR;
  }

  return r * 100; // Return best guess if no convergence
};

/**
 * Calculates Simple and Discounted Payback Period
 * @param cashFlows Array of cash flows
 * @param discountRate Annual discount rate in percentage for discounted payback
 * @returns Object with simple and discounted payback in years
 */
export const calculatePayback = (cashFlows: number[], discountRate: number) => {
  let cumulativeSimple = 0;
  let cumulativeDiscounted = 0;
  let simplePayback = 0;
  let discountedPayback = 0;
  const r = discountRate / 100;

  // Assume cashFlows[0] is initial investment (negative)

  // Simple Payback
  for (let t = 0; t < cashFlows.length; t++) {
    cumulativeSimple += cashFlows[t];
    if (cumulativeSimple >= 0) {
      // Linear interpolation for fractional year
      const prevCumulative = cumulativeSimple - cashFlows[t];
      simplePayback = (t - 1) + (Math.abs(prevCumulative) / cashFlows[t]);
      break;
    }
  }

  // Discounted Payback
  for (let t = 0; t < cashFlows.length; t++) {
    const discountedFlow = cashFlows[t] / Math.pow(1 + r, t);
    cumulativeDiscounted += discountedFlow;
    if (cumulativeDiscounted >= 0) {
      const prevCumulative = cumulativeDiscounted - discountedFlow;
      discountedPayback = (t - 1) + (Math.abs(prevCumulative) / discountedFlow);
      break;
    }
  }

  return { simplePayback, discountedPayback };
};

/**
 * Calculates Levelized Cost of Energy (LCOE)
 * @param totalLifecycleCost NPV of all costs (CAPEX + O&M discounted)
 * @param totalLifecycleEnergy NPV of all energy generated
 */
export const calculateLCOE = (totalLifecycleCost: number, totalLifecycleEnergy: number): number => {
  if (totalLifecycleEnergy === 0) return 0;
  return totalLifecycleCost / totalLifecycleEnergy;
};

/**
 * Calculates financial metrics based on inputs and generation.
 * @param params Finance parameters (CAPEX, rates, etc.)
 * @param annualGeneration First year energy generation in kWh
 * @returns FinanceResults object
 */
/**
 * Calculates the payment for a loan based on constant payments and a constant interest rate (Price Table).
 * @param rate Monthly interest rate (decimal, e.g. 0.015 for 1.5%)
 * @param nper Total number of payments (months)
 * @param pv Present value (Loan Amount)
 */
export const calculatePMT = (rate: number, nper: number, pv: number): number => {
  if (rate === 0) return pv / nper;
  const pmt = (pv * rate) / (1 - Math.pow(1 + rate, -nper));
  return pmt;
};

/**
 * Calculates financial metrics based on inputs and generation.
 * @param params Finance parameters (CAPEX, rates, etc.)
 * @param annualGeneration First year energy generation in kWh
 * @returns FinanceResults object
 */
export const calculateFinancialMetrics = (
  params: FinanceParams,
  annualGeneration: number
): FinanceResults => {
  if (params.capex <= 0) return initialFinanceResults;

  // --- FINANCING LOGIC ---
  const isFinanced = params.financingMode === 'financed';
  const downPayment = params.downPayment || 0;
  const loanAmount = Math.max(0, params.capex - downPayment);
  const monthlyRate = (params.loanInterestRate || 0) / 100;
  const totalMonths = params.loanTerm || 60;
  // gracePeriod is currently unused in simple PMT logic

  const monthlyInstallment = isFinanced ? calculatePMT(monthlyRate, totalMonths, loanAmount) : 0;
  const totalLoanCost = monthlyInstallment * totalMonths;
  const totalLoanInterest = isFinanced ? totalLoanCost - loanAmount : 0;

  // --- CASH FLOW SETUP ---
  const projectYears = 25;
  // Year 0: Down Payment (Financed) OR CAPEX (Cash)
  const initialOutflow = isFinanced ? downPayment : params.capex;

  const cashFlows: number[] = [-initialOutflow];
  const cumulativeCashFlows: number[] = [-initialOutflow];

  // Neonorte Taxation Schedule (Law 14.300)
  const fioBTaxSchedule = [0.45, 0.60, 0.75, 0.90, 1.00];

  let currentGeneration = annualGeneration;
  let currentTariff = params.energyTariff;
  let currentFioB = params.fioB_Tariff || 0;
  let currentOmCost = params.omCost;

  // LCOE Accumulators (Project View - Unleveraged)
  let totalLifecycleCost = params.capex; // Start with Full CAPEX
  let totalLifecycleEnergy = 0;
  let monthlySavings = 0;
  const r = params.discountRate / 100;

  for (let t = 1; t <= projectYears; t++) {
    // 1. Inflation
    const yearInflation = t <= 5
      ? (params.inflationRateShortTerm || params.tariffInflation || 6)
      : (params.inflationRateLongTerm || params.tariffInflation || 6);

    // 2. Taxation (Fio B)
    const taxIndex = t - 1;
    const taxRate = taxIndex < fioBTaxSchedule.length ? fioBTaxSchedule[taxIndex] : 1.00;
    const wireCost = currentGeneration * currentFioB * taxRate;

    // 3. Revenues & O&M
    const grossRevenue = currentGeneration * currentTariff;
    const effectiveSavings = grossRevenue - wireCost;

    // 4. Loan Payment (Annualized for this year)
    let annualLoanPayment = 0;
    if (isFinanced) {
      const startMonth = (t - 1) * 12 + 1;
      const endMonth = t * 12;
      const overlapStart = Math.max(startMonth, 1); // Simple logic: starts month 1
      const overlapEnd = Math.min(endMonth, totalMonths);

      if (overlapEnd >= overlapStart) {
        const monthsToPay = overlapEnd - overlapStart + 1;
        annualLoanPayment = monthsToPay * monthlyInstallment;
      }
    }

    // 5. Net Cash Flow (User View)
    const netFlow = effectiveSavings - currentOmCost - annualLoanPayment;
    cashFlows.push(netFlow);
    cumulativeCashFlows.push(cumulativeCashFlows[t - 1] + netFlow);

    // Capture Year 1 Monthly Savings
    if (t === 1) {
      monthlySavings = effectiveSavings / 12;
    }

    // 6. LCOE Accumulation (Project View)
    // Discounted Costs (O&M + FioB) and Energy
    const discountFactor = Math.pow(1 + r, t);
    const yearlyProjectCost = currentOmCost + wireCost;

    totalLifecycleCost += yearlyProjectCost / discountFactor;
    totalLifecycleEnergy += currentGeneration / discountFactor;

    // 7. Degradation & Inflation for next loop
    currentGeneration *= (1 - (params.annualDegradation / 100));
    const inflationFactor = 1 + (yearInflation / 100);
    currentTariff *= inflationFactor;
    currentFioB *= inflationFactor;
    currentOmCost *= (1 + (params.inflationRate / 100));
  }

  // Metrics Calculation
  const npv = calculateNPV(cashFlows, params.discountRate);
  const irr = calculateIRR(cashFlows);
  const { simplePayback, discountedPayback } = calculatePayback(cashFlows, params.discountRate);
  const lcoe = calculateLCOE(totalLifecycleCost, totalLifecycleEnergy);

  const totalSavings = cumulativeCashFlows[projectYears];
  const roi = ((totalSavings - initialOutflow) / initialOutflow) * 100;

  return {
    npv,
    irr,
    payback: simplePayback,
    discountedPayback,
    lcoe,
    roi,
    totalSavings,
    cashFlows,
    cumulativeCashFlows,
    monthlyInstallment,
    totalLoanInterest,
    monthlySavings
  };
};
