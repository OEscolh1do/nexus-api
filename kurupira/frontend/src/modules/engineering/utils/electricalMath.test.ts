import { describe, it, expect } from 'vitest';
import {
    calculateCorrectedVoltage,
    calculateStringMetrics,
    validateSystemStrings,
    type MPPTInput,
    type ModuleElectricalSpecs,
} from './electricalMath';

// ─── Fixtures ──────────────────────────────────────

/** Typical 550W half-cell module */
const MODULE_SPECS: ModuleElectricalSpecs & { isc: number } = {
    voc: 49.8,
    vmp: 41.7,
    isc: 14.0,
    tempCoeffVoc: -0.28, // %/°C
};

/** Builds an MPPT input with sensible inverter defaults */
const makeMPPT = (overrides: Partial<MPPTInput> = {}): MPPTInput => ({
    inverterId: 'inv-1',
    mpptId: 1,
    modulesPerString: 12,
    stringsCount: 2,
    maxInputVoltage: 800,
    minMpptVoltage: 200,
    maxMpptVoltage: 600,
    maxCurrentPerMPPT: 30,
    ...overrides,
});

// ─── Unit: calculateCorrectedVoltage ───────────────

describe('calculateCorrectedVoltage', () => {
    it('returns nominal voltage at STC (25°C)', () => {
        expect(calculateCorrectedVoltage(49.8, -0.28, 25)).toBeCloseTo(49.8, 1);
    });

    it('increases voltage at cold temperatures', () => {
        // At -10°C: factor = 1 + (-0.28/100)*(−10−25) = 1 + 0.098 = 1.098
        const v = calculateCorrectedVoltage(49.8, -0.28, -10);
        expect(v).toBeGreaterThan(49.8);
        expect(v).toBeCloseTo(49.8 * 1.098, 1);
    });

    it('decreases voltage at hot temperatures', () => {
        const v = calculateCorrectedVoltage(49.8, -0.28, 70);
        expect(v).toBeLessThan(49.8);
    });

    it('clamps factor between 0.5 and 1.5', () => {
        // Extreme cold with wild coefficient
        const vCold = calculateCorrectedVoltage(100, -5, -200);
        expect(vCold).toBe(100 * 1.5);

        const vHot = calculateCorrectedVoltage(100, -5, 200);
        expect(vHot).toBe(100 * 0.5);
    });
});

// ─── Unit: calculateStringMetrics ──────────────────

describe('calculateStringMetrics', () => {
    it('returns zeros for 0 modules', () => {
        const m = calculateStringMetrics(MODULE_SPECS, 0);
        expect(m.vocMax).toBe(0);
        expect(m.vmpMin).toBe(0);
    });

    it('scales linearly with module count', () => {
        const m1 = calculateStringMetrics(MODULE_SPECS, 1, 0);
        const m10 = calculateStringMetrics(MODULE_SPECS, 10, 0);
        expect(m10.vocMax).toBeCloseTo(m1.vocMax * 10, 0);
    });

    it('vocMax > vmpNominal for cold conditions', () => {
        const m = calculateStringMetrics(MODULE_SPECS, 12, -10);
        expect(m.vocMax).toBeGreaterThan(m.vmpNominal);
    });
});

// ─── Unit: validateSystemStrings ───────────────────

describe('validateSystemStrings', () => {
    it('returns valid report for empty array', () => {
        const report = validateSystemStrings([], MODULE_SPECS);
        expect(report.isValid).toBe(true);
        expect(report.globalStatus).toBe('ok');
        expect(report.entries).toHaveLength(0);
        expect(report.summary.totalMPPTs).toBe(0);
    });

    it('validates a well-sized system as OK', () => {
        const mppt = makeMPPT({ modulesPerString: 10, stringsCount: 1 });
        const report = validateSystemStrings([mppt], MODULE_SPECS, 0);
        expect(report.isValid).toBe(true);
        expect(report.globalStatus).toBe('ok');
        expect(report.entries[0].messages).toHaveLength(0);
    });

    it('detects Voc exceeding max input voltage', () => {
        // 20 modules × ~55V corrected ≈ 1100V >> 800V limit
        const mppt = makeMPPT({ modulesPerString: 20 });
        const report = validateSystemStrings([mppt], MODULE_SPECS, -10);
        expect(report.isValid).toBe(false);
        expect(report.globalStatus).toBe('error');
        expect(report.entries[0].status).toBe('error');
        expect(report.entries[0].messages[0]).toContain('Voc');
    });

    it('warns when Voc is within 5% of limit', () => {
        // We need vocMax to be between 760 (95%) and 800
        // At 0°C: vocPerModule = 49.8 * 1.07 ≈ 53.29
        // 15 modules: 53.29 * 15 ≈ 799 (just under 800)
        const mppt = makeMPPT({ modulesPerString: 15, maxInputVoltage: 800 });
        const report = validateSystemStrings([mppt], MODULE_SPECS, 0);
        // vocMax ≈ 799V which is > 760 (0.95 × 800) → warning
        expect(report.entries[0].status).toBe('warning');
        expect(report.isValid).toBe(true); // warnings don't invalidate
    });

    it('detects Isc exceeding max current per MPPT', () => {
        // 4 strings × 14A = 56A >> 30A limit
        const mppt = makeMPPT({ stringsCount: 4 });
        const report = validateSystemStrings([mppt], MODULE_SPECS, 0);
        expect(report.isValid).toBe(false);
        expect(report.entries[0].messages.some(m => m.includes('Isc'))).toBe(true);
    });

    it('detects Vmp below MPPT minimum', () => {
        // 3 modules at 70°C: vmpMin ≈ 3 × 41.7 × 0.874 ≈ 109V < 200V min
        const mppt = makeMPPT({ modulesPerString: 3, minMpptVoltage: 200 });
        const report = validateSystemStrings([mppt], MODULE_SPECS, 0, 70);
        expect(report.isValid).toBe(false);
        expect(report.entries[0].messages.some(m => m.includes('Vmp min'))).toBe(true);
    });

    it('handles multiple MPPTs with mixed results', () => {
        const ok = makeMPPT({ mpptId: 1, modulesPerString: 10, stringsCount: 1 });
        const bad = makeMPPT({ mpptId: 2, modulesPerString: 20, stringsCount: 1 });
        const report = validateSystemStrings([ok, bad], MODULE_SPECS, -10);

        expect(report.isValid).toBe(false);
        expect(report.summary.totalMPPTs).toBe(2);
        expect(report.summary.errors).toBe(1);
        expect(report.entries[0].status).toBe('ok');
        expect(report.entries[1].status).toBe('error');
    });

    it('skips empty MPPTs (0 modules)', () => {
        const empty = makeMPPT({ modulesPerString: 0, stringsCount: 0 });
        const report = validateSystemStrings([empty], MODULE_SPECS);
        expect(report.isValid).toBe(true);
        expect(report.entries[0].vocMax).toBe(0);
    });
});
