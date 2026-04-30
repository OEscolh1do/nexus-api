import { ModuleElectricalSpecs, calculateCorrectedVoltage } from './electricalMath';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';

export type InverterCompatibilityStatus = 'RECOMMENDED' | 'ACCEPTABLE' | 'WARNING' | 'INCOMPATIBLE';

export interface CompatibilityAlert {
    code: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface InverterCompatibilityResult {
    isCompatible: boolean;
    status: InverterCompatibilityStatus;
    fdi: number;
    requiredMppts: number;
    nSerieMin: number;
    nSerieMax: number;
    nSerieOtimo: number;
    alerts: CompatibilityAlert[];
}

/**
 * Motor de Auto-Sizing Preliminar
 * Analisa um modelo de inversor contra o array PV desejado antes mesmo da inserção.
 */
export const calculateCompatibilityMetrics = (
    moduleSpecs: ModuleElectricalSpecs & { power: number },
    totalModulesCount: number,
    tmin: number,
    tamb_max: number,
    inverter: InverterCatalogItem
): InverterCompatibilityResult => {
    const alerts: CompatibilityAlert[] = [];
    
    // 1. Oversizing (FDI)
    const totalPowerKwp = (moduleSpecs.power * totalModulesCount) / 1000;
    const invPowerKw = inverter.nominalPowerW ? inverter.nominalPowerW / 1000 : 0;
    const fdi = invPowerKw > 0 ? totalPowerKwp / invPowerKw : 0;
    
    // 2. Limites de Tensão e Temperatura
    const NOCT = 45; // Assumido padrão se não vier
    const tCellMax = tamb_max + (NOCT - 20) * 1.25; // Pior caso de calor da célula
    
    // Tensão unitária corrigida
    const vocFrioUnit = calculateCorrectedVoltage(moduleSpecs.voc, moduleSpecs.tempCoeffVoc, tmin);
    const vmpQuenteUnit = calculateCorrectedVoltage(moduleSpecs.vmp, moduleSpecs.tempCoeffVoc, tCellMax);

    // Extrair limites do primeiro MPPT como proxy, ou fallback para globais
    const mppts = Array.isArray(inverter.mppts) ? inverter.mppts : [];
    const proxyMppt = mppts[0] || {};
    
    const maxInputVoltage = inverter.maxInputVoltage || proxyMppt.maxInputVoltage || 600;
    const minMpptVoltage = proxyMppt.minMpptVoltage || 40;
    const maxCurrentMppt = proxyMppt.maxCurrentPerMPPT || 15;
    
    // Bounds de Strings
    // O Voc total no frio não pode exceder 95% do limite do Inversor (fator segurança NBR)
    const nSerieMax = Math.floor((maxInputVoltage * 0.95) / vocFrioUnit);
    // O Vmp total no calor não pode cair abaixo do start de MPPT
    const nSerieMin = Math.ceil(minMpptVoltage / vmpQuenteUnit);
    
    // 3. Match de Tensão
    const hasVoltageMatch = nSerieMax >= nSerieMin && nSerieMax > 0;
    if (!hasVoltageMatch) {
        alerts.push({
            code: 'VOLTAGE_MISMATCH',
            message: `Impossível formar string válida. Limite frio (Máx ${nSerieMax}) < Limite calor (Mín ${nSerieMin}).`,
            severity: 'error'
        });
    }

    // 4. Corrente de Curto e MPPTs Necessários
    const iscSeguro = moduleSpecs.isc * 1.25; // NBR 16690 margin
    const canFitInMppt = maxCurrentMppt >= iscSeguro;
    
    if (!canFitInMppt) {
        alerts.push({
            code: 'CURRENT_EXCEEDED',
            message: `Corrente do módulo (${iscSeguro.toFixed(1)}A c/ margem) excede limite do MPPT (${maxCurrentMppt}A).`,
            severity: 'error'
        });
    }

    // Calcular quantas strings em paralelo precisaremos baseadas na contagem de módulos e N_série_ótimo
    // O N ótimo seria perto do nominalVDC, mas na ausência dele, pegamos o N médio seguro.
    const nSerieOtimo = Math.floor((nSerieMax + nSerieMin) / 2);
    let requiredStrings = 0;
    if (nSerieOtimo > 0) {
        requiredStrings = Math.ceil(totalModulesCount / nSerieOtimo);
    }
    
    // Tem MPPTs suficientes?
    const availableMppts = mppts.length || 1;
    if (requiredStrings > availableMppts && !canFitInMppt) {
        // Se a corrente do módulo é mt alta, não dá pra paralelizar no mesmo tracker. Então falta tracker.
         alerts.push({
            code: 'INSUFFICIENT_TRACKERS',
            message: `O arranjo exigirá ~${requiredStrings} strings. Inversor só tem ${availableMppts} MPPTs.`,
            severity: 'warning'
        });
    }

    // Oversizing Alerts
    if (fdi > 1.50) {
        alerts.push({
            code: 'HIGH_OVERSIZING',
            message: `FDI excessivo (${(fdi*100).toFixed(0)}%). Ocorrerá clipping térmico.`,
            severity: 'warning'
        });
    } else if (fdi < 1.0) {
        alerts.push({
            code: 'UNDERSIZING',
            message: `Subdimensionamento (${(fdi*100).toFixed(0)}%). Inversor subutilizado.`,
            severity: 'warning'
        });
    }

    // Avaliação Final (Incompatível apenas se a tensão for impossível ou Isc não couber nada)
    const isCompatible = hasVoltageMatch && canFitInMppt;
    
    let status: InverterCompatibilityStatus = 'RECOMMENDED';
    if (!isCompatible) {
        status = 'INCOMPATIBLE';
    } else if (alerts.some(a => a.severity === 'error')) {
        status = 'INCOMPATIBLE';
    } else if (alerts.some(a => a.severity === 'warning')) {
        status = 'WARNING';
    } else if (fdi >= 1.15 && fdi <= 1.35) {
        status = 'RECOMMENDED'; // Ponto doce do Brasil
    } else {
        status = 'ACCEPTABLE';
    }

    return {
        isCompatible,
        status,
        fdi,
        requiredMppts: requiredStrings,
        nSerieMin,
        nSerieMax,
        nSerieOtimo,
        alerts
    };
};
