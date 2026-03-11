import { expect, test, describe } from 'vitest';
import { calculateNPV, calculateIRR, calculatePayback, calculateLCOE } from './financialCalculations';

describe('Financial Calculations', () => {
    
    // Scenario: Investment 1000, 3 years return of 400 each. Discount rate 10%.
    const simpleFlows = [-1000, 400, 400, 400];
    const discountRate = 10;

    test('calculateNPV - Simple Scenario', () => {
        // NPV = -1000 + 400/1.1 + 400/1.21 + 400/1.331
        // NPV = -1000 + 363.63 + 330.57 + 300.52 = -5.28 (approx)
        const npv = calculateNPV(simpleFlows, discountRate);
        expect(npv).toBeCloseTo(-5.26, 1);
    });

    test('calculateIRR - Simple Scenario', () => {
        // IRR should be slighty less than 10% because NPV at 10% is negative (-5).
        // Actually, for 3 years 400 on 1000 inv:
        // 400 * 3 = 1200.
        // Exact IRR ~ 9.7%
        const irr = calculateIRR(simpleFlows);
        expect(irr).toBeCloseTo(9.7, 1);
    });
    
    test('calculatePayback - Simple', () => {
        // 1000 / 400 = 2.5 years
        const { simplePayback } = calculatePayback(simpleFlows, discountRate);
        expect(simplePayback).toBeCloseTo(2.5, 1);
    });

    test('calculateLCOE', () => {
        // Total Cost: 10000
        // Total Energy: 20000 kWh
        // LCOE = 0.5
        expect(calculateLCOE(10000, 20000)).toBe(0.5);
    });

    test('calculateNPV - Empty Flow', () => {
        expect(calculateNPV([], 10)).toBe(0);
    });
});
