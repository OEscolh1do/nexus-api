const Decimal = require('decimal.js');

/**
 * Domain Service for Solar Financial Calculations.
 * Encapsulates all math logic using high-precision decimal arithmetic.
 */
class SolarCalculator {
  /**
   * Calculates financial projections for a solar system.
   * All inputs must be validated before calling this method.
   * 
   * @param {Object} params
   * @param {number} params.systemSize - System size in kWp (Required, > 0)
   * @param {number} params.tariffRate - Energy tariff in R$/kWh (Required, >= 0)
   * @param {number} [params.irradiation=4.5] - Daily irradiation (kWh/m2/day)
   * @param {number} [params.performanceRatio=0.80] - Performance ratio (0-1)
   * @param {number} [params.costPerKwp=3500] - Cost per kWp in R$
   * @returns {Object} { totalInvestment, monthlyGeneration, monthlySavings, paybackYears }
   * @throws {Error} If critical parameters are invalid
   */
  static calculate({ 
    systemSize, 
    tariffRate, 
    irradiation = 4.5, 
    performanceRatio = 0.80, 
    costPerKwp = 3500 
  }) {
    // --- 1. Defensive Validation ---
    if (typeof systemSize !== 'number' || systemSize <= 0) {
      throw new Error("SolarCalculator: 'systemSize' must be a positive number.");
    }
    if (typeof tariffRate !== 'number' || tariffRate < 0) {
      throw new Error("SolarCalculator: 'tariffRate' must be a non-negative number.");
    }
    
    // --- 2. Floating Point Safety (Decimal Pattern) ---
    const size = new Decimal(systemSize);
    const tariff = new Decimal(tariffRate);
    const irrad = new Decimal(irradiation);
    const pr = new Decimal(performanceRatio);
    const costUnit = new Decimal(costPerKwp);

    // --- 3. Pure Business Logic ---
    
    // Investment = Size * Cost/kWp
    const totalInvestment = size.mul(costUnit);

    // Generation (Monthly) = Size * Irrad * 30 days * PR
    // Standard industry formula: E = P * H * PR
    const monthlyGeneration = size.mul(irrad).mul(30).mul(pr);

    // Savings = Generation * Tariff
    const monthlySavings = monthlyGeneration.mul(tariff);

    // Payback = Investment / (Savings * 12 months)
    let paybackYears;
    const yearlySavings = monthlySavings.mul(12);

    if (yearlySavings.gt(0)) {
        paybackYears = totalInvestment.div(yearlySavings);
    } else {
        // If no savings, payback is infinite. 
        // We return a specific large number or Infinity based on requirement.
        // Using built-in Infinity for mathematical correctness.
        paybackYears = new Decimal(Infinity);
    }

    // --- 4. Result Shaping (round to 2 decimals) ---
    return {
      totalInvestment: totalInvestment.toDecimalPlaces(2).toNumber(),
      monthlyGeneration: monthlyGeneration.toDecimalPlaces(2).toNumber(),
      monthlySavings: monthlySavings.toDecimalPlaces(2).toNumber(),
      // Payback rounded to 1 decimal place (e.g. 3.5 years)
      paybackYears: paybackYears.isFinite() ? paybackYears.toDecimalPlaces(1).toNumber() : null
    };
  }
}

module.exports = SolarCalculator;
