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
