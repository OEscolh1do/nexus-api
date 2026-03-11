import { useMemo, useEffect } from 'react';
import { useSolarStore, selectModules, selectFinanceResults } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { EngineeringSettings } from '@/core/types';
import { PricingService, CostBreakdown } from '../services/PricingService';
import { ProposalCalculations } from '../types';

export interface KitBreakdown {
    modules: number;
    inverters: number;
    structure: number;
    bos: number;
    isHybrid: boolean;
}

export const useProposalCalculator = (): ProposalCalculations & { settings: EngineeringSettings, kitBreakdown: KitBreakdown } => {
    const modules = useSolarStore(selectModules);
    const financeResults = useSolarStore(selectFinanceResults);
    const updateFinanceParams = useSolarStore(state => state.updateFinanceParams);
    const { inverters } = useTechStore();

    // Load settings from global store (reactive)
    const settings = useSolarStore(state => state.settings);

    const calculations = useMemo(() => {
        // 1. QUANTITIES (CORRECTED)
        const totalModules = modules.reduce((acc, m) => acc + m.quantity, 0);
        const totalInverters = inverters.reduce((acc, i) => acc + i.quantity, 0); // Fixed: Sum quantity, not length
        
        const totalPowerW = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0);
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
        const avgHsp = 4.5; // Should ideally come from EngineeringSlice (Irradiation)
        const performanceRatio = settings.performanceRatio || 0.75;
        const estimatedMonthlyGenKwh = totalPowerkWp * avgHsp * 30 * performanceRatio;
        
        const avgTariff = 0.95; // Should come from ClientSlice (EnergyBill)
        const monthlySavings = estimatedMonthlyGenKwh * avgTariff;

        return {
            metrics: {
                totalPowerkWp,
                totalModules,
                totalInverters
            },
            costs: {
                kit: costs.kitHardware,
                labor: costs.labor, // Total labor
                laborBase: costLaborModules, // Roof modules labor
                laborStructure: costLaborStructure, // Structure assembly labor
                laborElectrical: costLaborInverter, // Electrical labor
                project: costs.project,
                admin: costs.admin,
                materials: costs.extras, // Mapping extras to materials for display
                total: pricingResult.technicalCost
            },
            kitBreakdown: {
                modules: 0, // Not tracked individually anymore
                inverters: 0,
                structure: 0, // Integrado ao kit.
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
                ...financeResults,
                estimatedMonthlyGenKwh,
                monthlySavings,
                paybackYears: financeResults.payback || 0,
                roi: financeResults.roi || 0,
                npv: financeResults.npv || 0,
                irr: financeResults.irr || 0
            }
        };

    }, [modules, inverters, settings, financeResults]);

    // SYNC SIDE-EFFECT: Update Capex in Finance Slice
    useEffect(() => {
        const price = Math.round(calculations.pricing.finalPrice);
        if (price > 0) {
            updateFinanceParams({ capex: price });
        }
    }, [calculations.pricing.finalPrice, updateFinanceParams]);

    return { ...calculations, settings };
};
