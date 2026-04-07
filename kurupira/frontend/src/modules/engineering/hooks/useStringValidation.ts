import { useMemo } from 'react';
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
    inverterSpecs: any | null,
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
        const maxVoltage = inverterSpecs.mppts?.[0]?.maxInputVoltage || 600;
        const vocStatus: ValidationResult = {
            status: 'ok',
            value: vocMax,
            limit: maxVoltage
        };

        if (vocMax > maxVoltage) {
            vocStatus.status = 'error';
            vocStatus.message = `Tensão Eletrolítica (${vocMax.toFixed(0)}V) excede o suportado (${maxVoltage}V)! Risco de dano imediato.`;
        } else if (vocMax > maxVoltage * 0.95) {
            vocStatus.status = 'warning';
            vocStatus.message = `Tensão (${vocMax.toFixed(0)}V) muito próxima do limite (${maxVoltage}V).`;
        }

        // 3. Validação MPPT Window (Vmp)
        // Check Vmp Min against Min MPPT
        // Check Vmp Max against Max MPPT
        
        // We aggregate the status into one "Range" check for UI simplicity, 
        // prioritizing the Error state.
        const minMppt = inverterSpecs.mppts?.[0]?.minMpptVoltage || 80;
        const maxMppt = inverterSpecs.mppts?.[0]?.maxMpptVoltage || 550;
        
        const vmpStatus: ValidationResult = {
            status: 'ok',
            value: vmpMin, // Show the lowest (worst case for startup) as primary value, or average? Let's show range in tooltip via message
            limit: minMppt
        };

        if (vmpMin < minMppt) {
            vmpStatus.status = 'error';
            vmpStatus.message = `Tensão mínima (${vmpMin.toFixed(0)}V @ 70°C) abaixo do MPPT (${minMppt}V).`;
        } else if (vmpMax > maxMppt) {
            // Note: Exceeding Max MPPT usually isn't fatal (clipping), but good to warn.
            vmpStatus.status = 'warning';
            vmpStatus.value = vmpMax;
            vmpStatus.limit = maxMppt;
            vmpStatus.message = `Tensão máxima (${vmpMax.toFixed(0)}V @ 0°C) acima da faixa MPPT (${maxMppt}V). Pode haver clipping.`;
        }

        // 4. Validação Corrente (Isc)
        const totalIsc = moduleSpecs.isc * stringsInParallel;
        const maxIsc = inverterSpecs.mppts?.[0]?.maxCurrentPerMPPT || 15;
        const iscStatus: ValidationResult = {
            status: 'ok',
            value: totalIsc,
            limit: maxIsc
        };

        /* TODO: Reimplementar lógica de Isc Alta futuramente
        if (totalIsc > maxIsc) {
            iscStatus.status = 'error';
            iscStatus.message = `Corrente de curto (${totalIsc.toFixed(1)}A) excede o limite da entrada (${maxIsc}A).`;
        }
        */
        
        return {
            vocMax: vocStatus,
            vmpRange: vmpStatus,
            iscMax: iscStatus,
            power: (moduleSpecs.imp * moduleSpecs.vmp * modulesPerString * stringsInParallel) / 1000,
            isValid: vocStatus.status !== 'error' && vmpStatus.status !== 'error' && iscStatus.status !== 'error'
        };

    }, [moduleSpecs, inverterSpecs, modulesPerString, stringsInParallel, minTemp]);
};
