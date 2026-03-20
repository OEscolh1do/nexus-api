import { EngineeringSettings } from '@/core/types';

/**
 * Interface para os custos detalhados (Input do serviço)
 */
export interface CostBreakdown {
    kitHardware: number;      // Kit Gerador (Módulos + Inv + Estrutura Hard)
    bos: number;              // Balance of System (Cabos, String Box)
    structure: number;        // Estrutura (Extra/Civil)
    labor: number;            // Mão de Obra
    project: number;          // Engenharia/Homologação
    admin: number;            // Custo Administrativo
    infra: number;            // Obras Civis/Padrão
    extras: number;           // Materiais Extras Manuais
}

/**
 * Interface para o resultado da precificação (Output)
 */
export interface PricingResult {
    finalPrice: number;
    kitPrice: number;
    servicePrice: number;
    grossMargin: number;
    commission: number;
    taxes: number;
    technicalCost: number; // Custo Total (ST)
}

export class PricingService {
    
    /**
     * Calcula o preço de venda com base no modelo selecionado (Strategy)
     */
    static calculate(costs: CostBreakdown, settings: EngineeringSettings): PricingResult {
        // 1. Normalização de Inputs (Evitar NaN)
        const safeCosts = this.sanitizeCosts(costs);
        
        // 2. Base Operacional (Custos Diretos de Serviço + Administrativo)
        const operationalBase = safeCosts.labor + safeCosts.project + safeCosts.admin + safeCosts.infra + safeCosts.bos;
        
        // Removemos o cálculo de Materiais de Serviço (Consumíveis) conforme regra de negócio solicitada pelo usuário.
        // O Custo Técnico agora é puramente o Somatório da Base Operacional + Extras Manuais (se houver).
        const totalTechnicalCost = safeCosts.kitHardware + operationalBase + safeCosts.extras;

        // 3. Seleção de Estratégia
        switch (settings.pricingModel) {
            case 'fixed_kit':
                return this.calculateFixedKit(safeCosts, operationalBase, settings);
            case 'cost_plus':
                return this.calculateCostPlus(safeCosts, operationalBase, settings);
            case 'margin':
            default:
                return this.calculateGlobalMargin(totalTechnicalCost, safeCosts.kitHardware, settings);
        }
    }

    /**
     * ESTRATÉGIA 1: MARGEM GLOBAL (Padrão)
     * Preço = Custo Total * (1 + Margem%) + Comissão Fixa
     * Nota: A comissão variável (se houver) é calculada sobre o Custo ou Venda?
     * Assumimos aqui: Margem sobre Custo, Comissão Flat + Variável sobre Custo.
     */
    private static calculateGlobalMargin(totalCost: number, kitCost: number, settings: EngineeringSettings): PricingResult {
        const marginValue = totalCost * (settings.marginPercentage || 0);
        
        // Comissão
        const fixedComm = settings.serviceCommissionFixed || 0;
        const varComm = totalCost * (settings.commissionPercentage || 0);
        const totalCommission = fixedComm + varComm;

        const finalPrice = totalCost + marginValue + totalCommission;
        
        // Split (Proporcional ao Custo)
        const kitRatio = totalCost > 0 ? kitCost / totalCost : 0;
        const kitPrice = finalPrice * kitRatio;
        const servicePrice = finalPrice - kitPrice;

        return {
            finalPrice,
            kitPrice,
            servicePrice,
            grossMargin: marginValue,
            commission: totalCommission,
            taxes: finalPrice * (settings.taxPercentage || 0.06),
            technicalCost: totalCost
        };
    }

    /**
     * ESTRATÉGIA 2: KIT FIXO (Orçamento de Fornecedor)
     * Kit é repasse (Pass-through). Lucro apenas sobre serviços.
     */
    private static calculateFixedKit(
        costs: CostBreakdown, 
        opBase: number, 
        settings: EngineeringSettings
    ): PricingResult {
        const kitPrice = costs.kitHardware; // Sem margem no kit

        // Custo Serviço = Base Operacional + Extras Manuais
        const costService = opBase + costs.extras + costs.structure; // Structure is now part of service cost for fixed_kit
        
        // Margem sobre Serviço
        const marginValue = costService * (settings.serviceMarkup || 0.23);
        
        // Comissão (Geralmente fixa neste modelo)
        const commission = settings.serviceCommissionFixed || 0;

        const servicePrice = costService + marginValue + commission;
        const finalPrice = kitPrice + servicePrice;

        return {
            finalPrice,
            kitPrice,
            servicePrice,
            grossMargin: marginValue,
            commission,
            taxes: finalPrice * (settings.taxPercentage || 0.06),
            technicalCost: costs.kitHardware + costService
        };
    }

    /**
     * ESTRATÉGIA 3: COST PLUS (Detalhado)
     * Margem específica para Kit e para Serviços.
     */
    private static calculateCostPlus(
        costs: CostBreakdown, 
        opBase: number, 
        settings: EngineeringSettings
    ): PricingResult {
        // 1. Kit
        // Normalmente Cost Plus aplica markup sobre tudo.
        // Vamos usar marginPercentage para o Kit e serviceMarkup para Serviços.
        const marginKit = costs.kitHardware * (settings.marginPercentage || 0.10);
        const kitPrice = costs.kitHardware + marginKit;

        // 2. Serviço
        const costService = opBase + costs.extras + costs.structure; // Structure is now part of service cost for cost_plus
        const marginService = costService * (settings.serviceMarkup || 0.30);
        const commission = settings.serviceCommissionFixed || 0;

        const servicePrice = costService + marginService + commission;
        const finalPrice = kitPrice + servicePrice;

        return {
            finalPrice,
            kitPrice,
            servicePrice,
            grossMargin: marginKit + marginService,
            commission,
            taxes: finalPrice * (settings.taxPercentage || 0.06),
            technicalCost: costs.kitHardware + costService
        };
    }

    private static sanitizeCosts(costs: CostBreakdown): CostBreakdown {
        return {
            kitHardware: Math.max(0, costs.kitHardware || 0),
            bos: Math.max(0, costs.bos || 0),
            structure: Math.max(0, costs.structure || 0),
            labor: Math.max(0, costs.labor || 0),
            project: Math.max(0, costs.project || 0),
            admin: Math.max(0, costs.admin || 0),
            infra: Math.max(0, costs.infra || 0),
            extras: Math.max(0, costs.extras || 0),
        };
    }
}
