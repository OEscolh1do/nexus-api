/**
 * ELECTRICAL MATH UTILS
 * 
 * Pure functions for PV String Sizing and Voltage Temperature Corrections.
 * Based on NEC 690.7 logic.
 */

// Std Temperature Conditions (STC)
const REF_TEMP = 25; 

export interface ModuleElectricalSpecs {
    voc: number;
    vmp: number;
    isc: number;
    tempCoeffVoc: number; // %/°C (e.g. -0.29)
    tempCoeffPmax?: number;
}

/**
 * Calculates voltage corrected for temperature.
 * Formula: V_new = V_ref * (1 + (T_new - T_ref) * (Coeff / 100))
 * 
 * @param nominalVoltage Voltage at STC (V)
 * @param tempCoeff Temperature Coefficient (%/°C) - usually negative
 * @param targetTemp Target Cell Temperature (°C)
 */
export const calculateCorrectedVoltage = (
    nominalVoltage: number,
    tempCoeff: number,
    targetTemp: number
): number => {
    const deltaT = targetTemp - REF_TEMP;
    const coeffDecimal = tempCoeff / 100;
    const factor = 1 + (deltaT * coeffDecimal);
    
    // Safety clamp (prevent negative voltage or wild multiplication in bad data)
    // 0.5x to 1.5x range is reasonable for realistic PV physics
    const safeFactor = Math.max(0.5, Math.min(1.5, factor));
    
    return nominalVoltage * safeFactor;
};

/**
 * Calculates the full string metrics including extreme temperature scenarios.
 */
export const calculateStringMetrics = (
    specs: ModuleElectricalSpecs,
    modulesPerString: number,
    minAmbientTemp: number = 0, // Coldest day (affects Voc Max)
    maxCellTemp: number = 70    // Hot operating cell (affects Vmp Min)
) => {
    if (modulesPerString <= 0) {
        return {
            vocMax: 0,
            vmpMin: 0,
            vmpMax: 0,
            vmpNominal: 0
        };
    }

    // 1. Voc Max (Coldest Temperature) - CRITICAL SAFETY
    const vocMax = calculateCorrectedVoltage(specs.voc, specs.tempCoeffVoc, minAmbientTemp) * modulesPerString;

    // 2. Vmp Min (Hottest Temperature) - MPPT Window start
    // Note: If tempCoeffPmax is available, sometimes better proxy for Vmp drift, 
    // but usually Vmp follows Voc coeff roughly or has its own. 
    // Fallback to Voc coeff if Vmp coeff missing (conservative approx).
    const vmpCoeff = specs.tempCoeffVoc; 
    const vmpMin = calculateCorrectedVoltage(specs.vmp, vmpCoeff, maxCellTemp) * modulesPerString;

    // 3. Vmp Max (Coldest Temperature) - MPPT Window end
    const vmpMax = calculateCorrectedVoltage(specs.vmp, vmpCoeff, minAmbientTemp) * modulesPerString;

    // 4. Nominal
    const vmpNominal = specs.vmp * modulesPerString;

    return {
        vocMax,
        vmpMin,
        vmpMax,
        vmpNominal
    };
};

// ──────────────────────────────────────────────────
// System-Level Validation (T1 · P6-2)
// ──────────────────────────────────────────────────

export type ValidationStatus = 'ok' | 'warning' | 'error';

export interface MPPTValidationEntry {
    inverterId: string;
    mpptId: number;
    status: ValidationStatus;
    vocMax: number;
    vmpMin: number;
    iscTotal: number;
    messages: string[];
}

export interface SystemValidationReport {
    isValid: boolean;
    globalStatus: ValidationStatus;
    entries: MPPTValidationEntry[];
    summary: {
        totalMPPTs: number;
        errors: number;
        warnings: number;
    };
}

export interface MPPTInput {
    inverterId: string;
    mpptId: number;
    modulesPerString: number;
    stringsCount: number;
    /** From inverter catalog spec */
    maxInputVoltage: number;
    minMpptVoltage: number;
    maxMpptVoltage: number;
    maxCurrentPerMPPT: number;
    /** [NEW] NBR 16690: Bos parameters */
    cableLength?: number; // meters (one way)
    cableSection?: number; // mm2 (default 4)
}

/**
 * Calculates DC Voltage Drop percentage.
 * Formula: deltaV = (2 * L * I) / (sigma * A)
 * @param length One-way length (m)
 * @param current Operating current (A)
 * @param section Cable section (mm2)
 * @param voltage Operating voltage (V)
 */
export const calculateVoltageDrop = (
    length: number,
    current: number,
    section: number,
    voltage: number
): { volts: number; percent: number } => {
    if (voltage === 0 || section === 0) return { volts: 0, percent: 0 };
    const SIGMA_CU = 56; // Copper conductivity
    const dropV = (2 * length * current) / (SIGMA_CU * section);
    const dropPercent = (dropV / voltage) * 100;
    return { volts: dropV, percent: dropPercent };
};

/**
 * Validates all MPPT configurations of a system against inverter limits.
 * Pure function — no React deps — importable from Worker.
 *
 * @param mpptInputs  One entry per configured MPPT
 * @param moduleSpecs Electrical specs of the PV module used
 * @param minAmbientTemp Coldest historical ambient temp (°C)
 * @param maxCellTemp Maximum cell temp for Vmp derating (°C)
 */
export const validateSystemStrings = (
    mpptInputs: MPPTInput[],
    moduleSpecs: ModuleElectricalSpecs & { isc: number; vmp: number },
    minAmbientTemp: number = 0,
    maxCellTemp: number = 70
): SystemValidationReport => {
    if (mpptInputs.length === 0) {
        return {
            isValid: true,
            globalStatus: 'ok',
            entries: [],
            summary: { totalMPPTs: 0, errors: 0, warnings: 0 }
        };
    }

    const entries: MPPTValidationEntry[] = mpptInputs.map(input => {
        const messages: string[] = [];
        let status: ValidationStatus = 'ok';

        // Skip empty MPPTs
        if (input.modulesPerString <= 0 || input.stringsCount <= 0) {
            return {
                inverterId: input.inverterId,
                mpptId: input.mpptId,
                status: 'ok' as ValidationStatus,
                vocMax: 0,
                vmpMin: 0,
                iscTotal: 0,
                messages: []
            };
        }

        const metrics = calculateStringMetrics(
            moduleSpecs,
            input.modulesPerString,
            minAmbientTemp,
            maxCellTemp
        );

        // 1. Voc Max vs Max Input Voltage (CRITICAL SAFETY — NEC 690.7)
        if (metrics.vocMax > input.maxInputVoltage) {
            status = 'error';
            messages.push(
                `Voc(${metrics.vocMax.toFixed(0)}V) > limite(${input.maxInputVoltage}V). Risco de dano!`
            );
        } else if (metrics.vocMax > input.maxInputVoltage * 0.95) {
            status = 'warning';
            messages.push(
                `Voc(${metrics.vocMax.toFixed(0)}V) próximo do limite(${input.maxInputVoltage}V).`
            );
        }

        // 2. Vmp Min vs Min MPPT Voltage
        if (metrics.vmpMin < input.minMpptVoltage) {
            status = 'error';
            messages.push(
                `Vmp min(${metrics.vmpMin.toFixed(0)}V) < MPPT mín(${input.minMpptVoltage}V).`
            );
        }

        // 3. Vmp Max vs Max MPPT Voltage (warning only — clipping)
        if (metrics.vmpMax > input.maxMpptVoltage && status !== 'error') {
            status = 'warning';
            messages.push(
                `Vmp max(${metrics.vmpMax.toFixed(0)}V) > MPPT máx(${input.maxMpptVoltage}V). Clipping possível.`
            );
        }

        // 4. Isc Total vs Max Current Per MPPT (IEC 60364-7-712 §712.443)
        const iscTotal = moduleSpecs.isc * input.stringsCount;
        const ISC_TOLERANCE = 1.25;
        const iscLimit = input.maxCurrentPerMPPT * ISC_TOLERANCE;
        if (iscTotal > iscLimit) {
            if (status !== 'error') status = 'warning';
            messages.push(
                `Isc(${iscTotal.toFixed(1)}A) > ${ISC_TOLERANCE}× limite MPPT(${(iscLimit).toFixed(1)}A). Verifique o datasheet do inversor.`
            );
        }

        // 5. [NEW] NBR 16690: Fusíveis de String
        // Obrigatório se strings em paralelo >= 3.
        if (input.stringsCount >= 3) {
            if (status !== 'error') status = 'warning';
            messages.push(
                `Aviso: ${input.stringsCount} strings em paralelo. Fusíveis CC obrigatórios (NBR 16690).`
            );
        }

        // 6. [NEW] Queda de Tensão CC
        if (input.cableLength && input.cableSection) {
            const drop = calculateVoltageDrop(
                input.cableLength,
                moduleSpecs.isc * 0.9, // Imp estimativo (Isc * 0.9)
                input.cableSection,
                metrics.vmpNominal
            );
            if (drop.percent > 2.0) {
                status = 'error';
                messages.push(`Queda de tensão CC excessiva: ${drop.percent.toFixed(2)}% (Limite 2%).`);
            } else if (drop.percent > 1.0) {
                if (status !== 'error') status = 'warning';
                messages.push(`Queda de tensão CC elevada: ${drop.percent.toFixed(2)}% (Recomendado < 1%).`);
            }
        }

        return {
            inverterId: input.inverterId,
            mpptId: input.mpptId,
            status,
            vocMax: metrics.vocMax,
            vmpMin: metrics.vmpMin,
            iscTotal,
            messages
        };
    });

    const errors = entries.filter(e => e.status === 'error').length;
    const warnings = entries.filter(e => e.status === 'warning').length;

    let globalStatus: ValidationStatus = 'ok';
    if (errors > 0) globalStatus = 'error';
    else if (warnings > 0) globalStatus = 'warning';

    return {
        isValid: errors === 0,
        globalStatus,
        entries,
        summary: {
            totalMPPTs: entries.length,
            errors,
            warnings
        }
    };
};
