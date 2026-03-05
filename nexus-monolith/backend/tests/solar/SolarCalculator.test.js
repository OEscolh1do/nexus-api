const SolarCalculator = require('../../src/modules/solar/domain/SolarCalculator');

describe('SolarCalculator Domain Service', () => {

  // 1. Cenário "Tarifa Zero"
  test('Should handle Zero Tariff elegantly (Infinite Payback)', () => {
    const result = SolarCalculator.calculate({
        systemSize: 5,
        tariffRate: 0, // Free energy?
        costPerKwp: 3000
    });
    
    expect(result.monthlySavings).toBe(0);
    // Since infinite payback is represented as null (JSON safe) in logic
    expect(result.paybackYears).toBeNull(); 
  });

  // 2. Cenário "Arredondamento Monetário"
  test('Should return precise monetary values (2 decimal places)', () => {
    // Math Check:
    // Investment: 5.33 * 3500 = 18655.00
    // Generation: 5.33 * 4.5 * 30 * 0.8 = 575.64
    // Savings: 575.64 * 0.95 = 546.858 -> Rounded to 2 decimals = 546.86
    
    const result = SolarCalculator.calculate({
        systemSize: 5.33,
        tariffRate: 0.95,
        irradiation: 4.5,
        performanceRatio: 0.8,
        costPerKwp: 3500
    });

    expect(result.totalInvestment).toBe(18655.00);
    expect(result.monthlyGeneration).toBe(575.64);
    expect(result.monthlySavings).toBe(546.86); 
  });

  // 3. Cenário "Irradiação Baixa"
  test('Should calculate correct ROI for low irradiation locations', () => {
    const result = SolarCalculator.calculate({
        systemSize: 4,
        tariffRate: 0.8,
        irradiation: 2.0, // Low sun
        costPerKwp: 4000
    });

    // Reference Calc:
    // Gen: 4 * 2 * 30 * 0.8 = 192 kWh
    // Sav: 192 * 0.8 = 153.60 R$
    // Inv: 4 * 4000 = 16000 R$
    // Annual Sav: 153.6 * 12 = 1843.2
    // Payback: 16000 / 1843.2 = 8.6805... -> Rounded 1 decimal = 8.7
    
    expect(result.paybackYears).toBe(8.7);
  });

  // 4. Cenário "Sistema Negativo / Inválido"
  test('Should throw error for negative system size', () => {
    expect(() => {
        SolarCalculator.calculate({ systemSize: -5, tariffRate: 0.9 });
    }).toThrow("SolarCalculator: 'systemSize' must be a positive number");
  });
    
  test('Should throw error for negative tariff', () => {
    expect(() => {
        SolarCalculator.calculate({ systemSize: 5, tariffRate: -0.1 });
    }).toThrow("SolarCalculator: 'tariffRate' must be a non-negative number");
  });

  // 5. Cenário "Concorrência de Preço" (Input override)
  test('Should prioritize provided costPerKwp over default', () => {
    // Ensuring magic numbers aren't forcing 3500
    const customCost = 5000;
    const result = SolarCalculator.calculate({
        systemSize: 10,
        tariffRate: 1.0,
        costPerKwp: customCost
    });
    
    expect(result.totalInvestment).toBe(50000); // 10 * 5000
  });

});
