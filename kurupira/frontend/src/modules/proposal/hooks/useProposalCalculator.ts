import { useMemo } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { EngineeringSettings } from '@/core/types';
import { PricingService, CostBreakdown } from '../services/PricingService';
import { ProposalCalculations } from '../types';

// ─── Funções Financeiras Padrão ───────────────────────────────────────────────

/** Calcula o Valor Presente Líquido (NPV) de uma série de fluxos de caixa */
function calcNPV(rate: number, cashFlows: number[]): number {
    return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + rate, t + 1), 0);
}

/**
 * Calcula a Taxa Interna de Retorno (IRR) via bisseção numérica.
 * Retorna 0 se não convergir ou se o investimento inicial for zero.
 */
function calcIRR(cashFlows: number[], maxIterations = 100, tolerance = 1e-6): number {
    if (!cashFlows.length || cashFlows[0] >= 0) return 0;
    let low = -0.999;
    let high = 10.0;
    for (let i = 0; i < maxIterations; i++) {
        const mid = (low + high) / 2;
        const npv = cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + mid, t), 0);
        if (Math.abs(npv) < tolerance) return mid;
        if (npv > 0) low = mid; else high = mid;
    }
    return (low + high) / 2;
}

/** Retorna o payback simples em anos (sem desconto) */
function calcPayback(initialInvestment: number, annualSavings: number): number {
    if (annualSavings <= 0) return 0;
    return initialInvestment / annualSavings;
}

export interface KitBreakdown {
    modules: number;
    inverters: number;
    structure: number;
    bos: number;
    isHybrid: boolean;
}

export const useProposalCalculator = (): ProposalCalculations & { settings: EngineeringSettings, kitBreakdown: KitBreakdown } => {
    const modules = useSolarStore(selectModules);
    const { inverters } = useTechStore();
    const settings = useSolarStore(state => state.settings);
    const clientData = useSolarStore(selectClientData);
    const weatherData = useSolarStore(state => state.weatherData);

    const calculations = useMemo(() => {
        // 1. QUANTITIES (CORRECTED)
        const totalModules = modules.length;
        const invertersArray = toArray(inverters);
        const totalInverters = invertersArray.reduce((acc, i) => acc + i.quantity, 0); // Fixed: Sum quantity, not length
        
        const totalPowerW = modules.reduce((acc, m) => acc + (m.power), 0);
        const totalPowerkWp = totalPowerW / 1000;
        
        // 2. COST AGGREGATION (Inputs for PricingService)
        
        // Hardware Costs
        const costKit = totalPowerkWp * settings.referenceKitPricePerKwp;
        // O custo de estrutura metálica (Hard) já compõe o 'costKit'
        // Portanto, a estrutura como "hard cost isolado" é nula nesta arquitetura.
        const bosCost = totalPowerkWp * (settings.bosPricePerKwp || 0);

        // Service Costs (Labor)
        const costLaborModules = totalModules * settings.serviceUnitModule;
        
        // Montagem de Estrutura: A quantidade é metade das placas arredondando para cima
        const qtyStructures = Math.ceil(totalModules / 2);
        const costLaborStructure = qtyStructures * (settings.serviceUnitStructure || 0);

        const costLaborInverter = totalInverters * settings.serviceUnitInverter;
        
        const totalLabor = costLaborModules + costLaborStructure + costLaborInverter;

        // Soft Costs
        const costProject = settings.serviceProjectBase + (totalPowerkWp * 1000 * (settings.serviceProjectPercent/100));
        const costAdmin = settings.serviceAdminBase + (totalPowerkWp * 1000 * (settings.serviceAdminPercent/100)); // Be careful with Wp vs kWp. Input usually R$/Wp. keeping consistent.

        // Extras
        const costInfra = settings.infrastructureUpgradeCost || 0;
        const costExtras = settings.extraMaterialsCost || 0;

        // Prepare Payload for Service
        const costs: CostBreakdown = {
            kitHardware: costKit,
            bos: bosCost,
            structure: 0, // Hardware structure is embedded in the Kit price as per business rule
            labor: totalLabor,
            project: costProject,
            admin: costAdmin,
            infra: costInfra,
            extras: costExtras
        };

        // 3. EXECUTE PRICING STRATEGY
        const pricingResult = PricingService.calculate(costs, settings);

        // 4. FINANCIALS ESTIMATION
        const performanceRatio = settings.performanceRatio || 0.75;

        // HSP: weatherData.hsp_monthly (média) → clientData.monthlyIrradiation → fallback 4.5
        let avgHsp = 4.5;
        if (weatherData?.hsp_monthly?.length === 12) {
            avgHsp = weatherData.hsp_monthly.reduce((a: number, b: number) => a + b, 0) / 12;
        } else if (clientData?.monthlyIrradiation?.some((v: number) => v > 0)) {
            const validValues = clientData.monthlyIrradiation.filter((v: number) => v > 0);
            avgHsp = validValues.reduce((a: number, b: number) => a + b, 0) / validValues.length;
        }

        const estimatedMonthlyGenKwh = totalPowerkWp * avgHsp * 30 * performanceRatio;

        // Tarifa: clientData.tariffRate → fallback 0.92
        const avgTariff = (clientData?.tariffRate && clientData.tariffRate > 0)
            ? clientData.tariffRate
            : 0.92;

        const monthlySavings = estimatedMonthlyGenKwh * avgTariff;
        const annualSavings = monthlySavings * 12;
        const investment = pricingResult.finalPrice;

        // Fluxo de caixa: ano 0 = -investimento, anos 1-25 = economia anual
        // (degradação simples: 0.5%/ano, inflação tarifária: 5%/ano)
        const DEGRADATION = 0.005;
        const TARIFF_INFLATION = 0.05;
        const DISCOUNT_RATE = 0.08; // 8% a.a. (custo de oportunidade SELIC)
        const cashFlows: number[] = [-investment];
        for (let year = 1; year <= 25; year++) {
            const genFactor = Math.pow(1 - DEGRADATION, year - 1);
            const tarifFactor = Math.pow(1 + TARIFF_INFLATION, year - 1);
            cashFlows.push(annualSavings * genFactor * tarifFactor);
        }

        const npv = calcNPV(DISCOUNT_RATE, cashFlows.slice(1)) - investment;
        const irr = calcIRR(cashFlows);
        const paybackYears = calcPayback(investment, annualSavings);
        const roi = investment > 0 ? (annualSavings * 25 - investment) / investment : 0;

        return {
            metrics: { totalPowerkWp, totalModules, totalInverters },
            costs: {
                kit: costs.kitHardware,
                labor: costs.labor,
                laborBase: costLaborModules,
                laborStructure: costLaborStructure,
                laborElectrical: costLaborInverter,
                project: costs.project,
                admin: costs.admin,
                materials: costs.extras,
                total: pricingResult.technicalCost
            },
            kitBreakdown: {
                modules: 0,
                inverters: 0,
                structure: 0,
                bos: bosCost,
                isHybrid: false
            },
            pricing: {
                finalPrice: pricingResult.finalPrice,
                kitPrice: pricingResult.kitPrice,
                servicePrice: pricingResult.servicePrice,
                marginValue: pricingResult.grossMargin,
                commissionValue: pricingResult.commission,
                taxValue: pricingResult.taxes,
                pricePerWp: totalPowerW > 0 ? pricingResult.finalPrice / totalPowerW : 0
            },
            financials: {
                estimatedMonthlyGenKwh,
                monthlySavings,
                paybackYears,
                roi,
                npv,
                irr,
                cashFlows,
                avgHsp,
                avgTariff
            }
        };

    }, [modules, inverters, settings, clientData, weatherData]);

    return { ...calculations, settings };
};
