import { useMemo } from 'react';
import { Inverter } from '../constants/inverters';
import { calculateStringMetrics, ModuleElectricalSpecs } from '../utils/electricalMath';

interface ValidationResult {
    status: 'ok' | 'warning' | 'error';
    message?: string;
    value: number; // The calculated value (e.g. Voc_Max)
    limit: number; // The limit checked against
}

interface StringValidationReport {
    vocMax: ValidationResult;
    vmpRange: ValidationResult;
    iscMax: ValidationResult;
    power: number; // kWp
    isValid: boolean;
}

/**
 * HOOK: useStringValidation
 * 
 * Responsável por validar eletricamente o arranjo fotovoltaico.
 * Implementa Correção Térmica de Tensão (NEC 690.7).
 */
export const useStringValidation = (
    moduleSpecs: ModuleElectricalSpecs & { imp: number, isc: number } | null,
    inverterSpecs: Inverter | null,
    modulesPerString: number,
    stringsInParallel: number,
    minTemp: number = 0, // °C
) => {
    return useMemo((): StringValidationReport | null => {
        if (!moduleSpecs || !inverterSpecs || modulesPerString === 0) return null;

        // 1. Calculate Core Metrics
        const { vocMax, vmpMin, vmpMax } = calculateStringMetrics(
            moduleSpecs,
            modulesPerString,
            minTemp
        );

        // 2. Validação V_MAX (Critico!)
        const vocStatus: ValidationResult = {
            status: 'ok',
            value: vocMax,
            limit: inverterSpecs.maxInputVoltage
        };

        if (vocMax > inverterSpecs.maxInputVoltage) {
            vocStatus.status = 'error';
            vocStatus.message = `Tensão Eletrolítica (${vocMax.toFixed(0)}V) excede o suportado (${inverterSpecs.maxInputVoltage}V)! Risco de dano imediato.`;
        } else if (vocMax > inverterSpecs.maxInputVoltage * 0.95) {
            vocStatus.status = 'warning';
            vocStatus.message = `Tensão (${vocMax.toFixed(0)}V) muito próxima do limite (${inverterSpecs.maxInputVoltage}V).`;
        }

        // 3. Validação MPPT Window (Vmp)
        // Check Vmp Min against Min MPPT
        // Check Vmp Max against Max MPPT
        
        // We aggregate the status into one "Range" check for UI simplicity, 
        // prioritizing the Error state.
        const vmpStatus: ValidationResult = {
            status: 'ok',
            value: vmpMin, // Show the lowest (worst case for startup) as primary value, or average? Let's show range in tooltip via message
            limit: inverterSpecs.minMpptVoltage
        };

        if (vmpMin < inverterSpecs.minMpptVoltage) {
            vmpStatus.status = 'error';
            vmpStatus.message = `Tensão mínima (${vmpMin.toFixed(0)}V @ 70°C) abaixo do MPPT (${inverterSpecs.minMpptVoltage}V).`;
        } else if (vmpMax > inverterSpecs.maxMpptVoltage) {
            // Note: Exceeding Max MPPT usually isn't fatal (clipping), but good to warn.
            vmpStatus.status = 'warning';
            vmpStatus.value = vmpMax;
            vmpStatus.limit = inverterSpecs.maxMpptVoltage;
            vmpStatus.message = `Tensão máxima (${vmpMax.toFixed(0)}V @ 0°C) acima da faixa MPPT (${inverterSpecs.maxMpptVoltage}V). Pode haver clipping.`;
        }

        // 4. Validação Corrente (Isc)
        const totalIsc = moduleSpecs.isc * stringsInParallel;
        const iscStatus: ValidationResult = {
            status: 'ok',
            value: totalIsc,
            limit: inverterSpecs.maxIscPerMppt
        };

        if (totalIsc > inverterSpecs.maxIscPerMppt) {
            iscStatus.status = 'error';
            iscStatus.message = `Corrente de curto (${totalIsc.toFixed(1)}A) excede o limite da entrada (${inverterSpecs.maxIscPerMppt}A).`;
        }
        
        return {
            vocMax: vocStatus,
            vmpRange: vmpStatus,
            iscMax: iscStatus,
            power: (moduleSpecs.imp * moduleSpecs.vmp * modulesPerString * stringsInParallel) / 1000,
            isValid: vocStatus.status !== 'error' && vmpStatus.status !== 'error' && iscStatus.status !== 'error'
        };

    }, [moduleSpecs, inverterSpecs, modulesPerString, stringsInParallel, minTemp]);
};
