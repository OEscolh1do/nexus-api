import { useMemo } from 'react';

interface AutoSizingResult {
    suggestedQty: number;
    requiredKwp: number;
    estimatedGeneration: number;
    coveragePercentage: number;
    missingData?: 'consumption' | 'hsp' | 'module' | null;
}

const CONSTANTS = {
    PR: 0.75, // Performance Ratio Padrão
    DAYS: 30  // Dias considerados no mês
};

/**
 * useAutoSizing
 * 
 * Hook matemático puro para dimensionamento fotovoltaico.
 * 
 * @param targetKwh Consumo mensal alvo (kWh)
 * @param hsp Irradiação Solar (HSP - Horas de Sol Pleno)
 * @param moduleWatts Potência do módulo (W)
 * @param performanceRatio Performance Ratio (Decimal, e.g. 0.75)
 */
export const useAutoSizing = (
    targetKwh: number, 
    hsp: number, 
    moduleWatts: number,
    performanceRatio: number
): AutoSizingResult => {

    const results = useMemo(() => {
        // Diagnóstico de Debug (Desenvolvimento)
        // console.log(`AutoSizing: Target=${targetKwh}, HSP=${hsp}, Power=${moduleWatts}, PR=${performanceRatio}`);

        // Validação Explícita - Retorna Motivo da Falha
        if (!targetKwh || targetKwh <= 0) {
            return { suggestedQty: 0, requiredKwp: 0, estimatedGeneration: 0, coveragePercentage: 0, missingData: 'consumption' as const };
        }
        if (!hsp || hsp <= 0) {
            return { suggestedQty: 0, requiredKwp: 0, estimatedGeneration: 0, coveragePercentage: 0, missingData: 'hsp' as const };
        }
        if (!moduleWatts || moduleWatts <= 0) {
            return { suggestedQty: 0, requiredKwp: 0, estimatedGeneration: 0, coveragePercentage: 0, missingData: 'module' as const };
        }

        // 1. Energia Diária Necessária
        const dailyEnergyNeeded = targetKwh / CONSTANTS.DAYS;

        // 2. Potência Pico Necessária (kWp)
        // Fórmula: E = P * HSP * PR  =>  P = E / (HSP * PR)
        // PROTEÇÃO CONTRA DIVISÃO POR ZERO
        const effectivePR = performanceRatio > 0 ? performanceRatio : 0.75;
        const requiredKwp = dailyEnergyNeeded / (hsp * effectivePR);

        // 3. Quantidade de Módulos
        // Convertendo kWp para Wp para dividir pela potência do módulo
        const requiredWp = requiredKwp * 1000;
        const suggestedQty = Math.ceil(requiredWp / moduleWatts);

        // 4. Geração Estimada (kWh/mês) com a quantidade SUGERIDA (inteira)
        // Fórmula: P_Total(kW) * HSP * 30 * PR
        const installedPowerKw = (suggestedQty * moduleWatts) / 1000;
        const estimatedGeneration = installedPowerKw * hsp * CONSTANTS.DAYS * performanceRatio;

        // 5. Porcentagem de Cobertura
        const coveragePercentage = (estimatedGeneration / targetKwh) * 100;

        return {
            suggestedQty,
            requiredKwp,
            estimatedGeneration,
            coveragePercentage,
            missingData: null
        };

    }, [targetKwh, hsp, moduleWatts]);

    return results;
};
