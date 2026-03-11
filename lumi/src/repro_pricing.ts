import { PricingService, CostBreakdown } from './modules/proposal/services/PricingService';
import { EngineeringSettings } from './core/types';

// Inputs do Utilizador
const inputs = {
    modules: 15,
    structure: 8,
    inverters: 1,
    unitModule: 131.25,
    unitStructure: 99.15,
    unitInverter: 500.32,
    infra: 1080.92,
    eng: 600.00,
    adm: 1542.36,
    markup: 0.22, // 22%
    tax: 0.06, // 6%
    commission: 500.00
};

// Cálculo Manual do Custo (Utilizador)
const labor = (inputs.modules * inputs.unitModule) + (inputs.structure * inputs.unitStructure) + (inputs.inverters * inputs.unitInverter);
const soft = inputs.eng + inputs.adm + inputs.infra;
const totalCostUser = labor + soft;
console.log(`Custo Base Calculado (User): ${totalCostUser.toFixed(2)}`); // Esperado: ~6485.55

// Configuração para o Service (Tentando reproduzir o setup do Lumi)
// Assumindo Potência Média de 550W por módulo para calcular kWp (usado no custo de kit)
const powerPerModuleW = 575; // Exemplo moderno
const totalPowerkWp = (inputs.modules * powerPerModuleW) / 1000;
const referenceKitPrice = 2200; // R$/kWp (Chute razoável de mercado)
const kitHardwareCost = totalPowerkWp * referenceKitPrice;

const settings: EngineeringSettings = {
    // Defaults irrelevantes
    performanceRatio: 0.75, cableLoss: 0.02, structureType: 'Telhado',
    orientationFactors: { norte: 1, leste: 1, oeste: 1, sul: 1 },
    monthlyInterestRate: 0, marginPercentage: 0.15, commissionPercentage: 0, taxPercentage: 0.06,
    engineerName: '', creaNumber: '', companyCnpj: '', co2Factor: 0,
    energyInflationRate: 0,
    minHistoricalTemp: 0, vocTempCoefficient: 0, soilingLoss: 0, mismatchLoss: 0, inverterEfficiency: 0,
    orientationLoss: 0, inclinationLoss: 0, shadingLoss: 0, horizonLoss: 0, cableDCLoss: 0, cableACLoss: 0, thermalLoss: 0, targetOversizing: 0, minPerformanceRatio: 0,

    // Inputs Relevantes
    serviceUnitModule: inputs.unitModule,
    serviceUnitStructure: inputs.unitStructure,
    serviceUnitInverter: inputs.unitInverter,

    serviceProjectBase: inputs.eng,
    serviceProjectPercent: 0,

    serviceAdminBase: inputs.adm,
    serviceAdminPercent: 0,

    infrastructureUpgradeCost: inputs.infra,
    extraMaterialsCost: 0, // Utilizador não mencionou extras manuais

    // Fator Oculto?
    serviceMaterialsPercent: 0.20, // Padrão do sistema é 20%

    // Estratégia
    pricingModel: 'fixed_kit', // Tentando isolar serviço primeiro
    serviceMarkup: inputs.markup,
    serviceCommissionFixed: inputs.commission,

    // Hardware Reference
    referenceKitPricePerKwp: referenceKitPrice,
    structurePricePerModule: 0,
    bosPricePerKwp: 0
};

const costs: CostBreakdown = {
    kitHardware: kitHardwareCost,
    bos: 0,
    structure: 0, // Hardware structure (assumindo 0 ou incluso no kit)
    labor: labor,
    project: inputs.eng,
    admin: inputs.adm,
    infra: inputs.infra,
    extras: 0
};

console.log("--- SIMULAÇÃO: PricingService ---");
console.log("Input Costs:", costs);

console.log("\n1. Modelo: FIXED_KIT (Esperado para verviço isolado)");
const resFixed = PricingService.calculate(costs, { ...settings, pricingModel: 'fixed_kit' });
console.log("Final Price:", resFixed.finalPrice.toFixed(2));
console.log("Service Price:", resFixed.servicePrice.toFixed(2));
console.log("Kit Price:", resFixed.kitPrice.toFixed(2));
console.log("Technical Cost:", resFixed.technicalCost.toFixed(2));

console.log("\n2. Modelo: MARGIN (Global - Padrão do Sistema)");
// Margin usa 'marginPercentage' global, não serviceMarkup. Vamos ajustar para testar.
const resMargin = PricingService.calculate(costs, { ...settings, pricingModel: 'margin', marginPercentage: 0.22 });
console.log("Final Price:", resMargin.finalPrice.toFixed(2));
console.log("Service Price:", resMargin.servicePrice.toFixed(2));
console.log("Kit Price:", resMargin.kitPrice.toFixed(2));

console.log("\n--- DIAGNÓSTICO ---");
console.log(`Diferença User vs Fixed Service: ${(resFixed.servicePrice - 8477.21).toFixed(2)}`);
console.log(`Impacto Materiais 20%: ${(resFixed.technicalCost - costs.kitHardware - totalCostUser).toFixed(2)}`);
