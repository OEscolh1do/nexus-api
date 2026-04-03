import { InMemoryEquipmentRepo } from "./adapters/InMemoryEquipmentRepo";
import { CresesbIrradiationProvider } from "./adapters/CresesbIrradiationProvider";
import { 
  InputData, 
  ProposalData, 
  ModuleSpecs, 
  EngineeringSettings, 
  SolarOutput, 
  InstallmentOption, 
  ServiceItem 
} from "../core/types";
import { InputDataSchema, EngineeringSettingsSchema } from "../core/schemas";
import pino from "pino";

const logger = pino();

// @deprecated P8: Mantido para compatibilidade do solar.worker.ts. Use useCatalogStore para dados atualizados.
export const equipmentRepo = new InMemoryEquipmentRepo();
export const irradiationProvider = new CresesbIrradiationProvider();

// P6-3: Web Worker Singleton for off-main-thread calculation
let solarWorker: Worker | null = null;
let currentCalculationId = 0;

function getWorker(): Worker {
  if (!solarWorker) {
    solarWorker = new Worker(new URL('../core/workers/solar.worker.ts', import.meta.url), { type: 'module' });
  }
  return solarWorker;
}

function calculateViaWorker(data: InputData, settings: EngineeringSettings): Promise<SolarOutput> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    const id = `calc_${++currentCalculationId}`;
    
    const handler = (e: MessageEvent) => {
      const response = e.data;
      if (response.id === id) {
        worker.removeEventListener('message', handler);
        if (response.status === 'success') {
          resolve(response.result);
        } else {
          reject(new Error(response.error));
        }
      }
    };
    
    worker.addEventListener('message', handler);
    
    worker.postMessage({
      id,
      type: 'CALCULATE_PROPOSAL',
      payload: { data, settings }
    });
  });
}

export async function calculateProposal(
  data: InputData,
  settings: EngineeringSettings,
): Promise<ProposalData> {
  // Validate Inputs
  const validatedInput = InputDataSchema.parse(data);
  const validatedSettings = EngineeringSettingsSchema.parse(settings);

  logger.info({ event: 'proposal.calculation.start_worker' });

  // Execute Calculation off-main-thread (P6-3)
  const result: SolarOutput = await calculateViaWorker(validatedInput, validatedSettings);

  // Adapt to ProposalData
  const proposal: ProposalData = {
    clientName: validatedInput.clientName,
    city: validatedInput.city,
    state: validatedInput.state,
    street: validatedInput.street,
    neighborhood: validatedInput.neighborhood,
    number: validatedInput.number,
    complement: validatedInput.complement,
    lat: validatedInput.lat,
    lng: validatedInput.lng,
    tariffRate: validatedInput.tariffRate,
    availableArea: validatedInput.availableArea,
    mapImage: validatedInput.mapImage,
    
    installationNumber: validatedInput.invoices[0].installationNumber,
    connectionType: validatedInput.invoices[0].connectionType,
    concessionaire: validatedInput.invoices[0].concessionaire,
    rateGroup: validatedInput.invoices[0].rateGroup,
    voltage: validatedInput.invoices[0].voltage,
    breakerCurrent: validatedInput.invoices[0].breakerCurrent,
    monthlyConsumption: validatedInput.invoices[0].monthlyHistory,
    
    engineerName: validatedSettings.engineerName,
    creaNumber: validatedSettings.creaNumber,
    inverterWarranty: "7 Anos",

    systemSize: result.systemSizeKwp,
    panelCount: result.moduleCount,
    moduleManufacturer: result.moduleBrand,
    panelPower: 0, 
    
    roofArea: result.moduleCount * 2,
    
    inverters: result.inverters, // Using result.inverters from interface
    modules: result.modules, // Using result.modules which we added to SolarOutput interface presumably?
    
    monthlyGeneration: result.monthlyGeneration,
    annualSavings: result.monthlySavings * 12,
    totalInvestment: result.totalInvestment,
    kitPrice: result.totalInvestment - (result.serviceComposition.reduce((a: number, b: ServiceItem) => a + b.total, 0)),
    servicePrice: result.serviceComposition.reduce((a: number, b: ServiceItem) => a + b.total, 0),
    paybackYears: result.paybackYears,
    co2Savings: result.co2Savings,
    chartData: result.chartData,
    peakMonthConsumption: result.peakMonthConsumption,
    peakMonthGeneration: result.peakMonthGeneration,
    currentMonthlyCost: result.currentMonthlyCost,
    newMonthlyCost: result.newMonthlyCost,
    irradiationLocal: result.irradiationLocal,
    avgMonthlyGeneration: result.avgMonthlyGeneration,
    serviceSchedule: result.serviceSchedule,
    installments: result.installments,
    serviceComposition: result.serviceComposition,
    resumo_financeiro: {
        total_hardware_estimado: result.totalInvestment - (result.serviceComposition.reduce((a: number, b: ServiceItem) => a + b.total, 0)),
        total_servicos_contratados: result.serviceComposition.reduce((a: number, b: ServiceItem) => a + b.total, 0),
        investimento_total_referencia: result.totalInvestment,
        payback_estimado_anos: result.paybackYears,
        roi_25_anos: result.roi
    }
  };
  
  return proposal;
}

// --- Ported Logic for Recalculation ---

export const calculateInstallments = (valorAVista: number): InstallmentOption[] => {
  const options: InstallmentOption[] = [];
  const steps = [1, 6, 12, 18, 24, 36];
  const FATOR_BASE = 0.95;
  const TAXA_JUROS = 0.01;
  const CARENCIA = 6;
  const valorBase = valorAVista / FATOR_BASE;

  steps.forEach(n => {
    let valorTotal = valorBase;
    if (n > CARENCIA) {
      const mesesComJuros = n - CARENCIA;
      valorTotal = valorBase * Math.pow(1 + TAXA_JUROS, mesesComJuros);
    }
    options.push({
      parcelas: n,
      valorParcela: valorTotal / n,
      valorTotal: valorTotal,
      jurosTotal: valorTotal - valorAVista
    });
  });
  return options;
};

// Dead code removed: recalculateWithOverrides, recalculateProposal, updateProposalInverters

export const recalculateProposalWithServicePrice = (current: ProposalData, newServicePrice: number): ProposalData => {
    const diff = newServicePrice - current.servicePrice;
    
    // Adjust "Margem de Lucro" to absorb the difference
    const newComposition = current.serviceComposition.map(item => {
        if (item.description === "Margem de Lucro") {
            return {
                ...item,
                total: item.total + diff,
                quantity: "Ajuste Manual"
            };
        }
        return item;
    });

    const newTotalInvestment = current.kitPrice + newServicePrice;
    
    // Simple Payback Re-calc (Stub logic for now to avoid complexity)
    const annualSavings = current.annualSavings || 1;
    const newPayback = newTotalInvestment / annualSavings;

    return {
        ...current,
        servicePrice: newServicePrice,
        serviceComposition: newComposition,
        totalInvestment: newTotalInvestment,
        paybackYears: Number(newPayback.toFixed(1)),
        resumo_financeiro: {
            ...current.resumo_financeiro,
            total_servicos_contratados: newServicePrice,
            investimento_total_referencia: newTotalInvestment,
            payback_estimado_anos: Number(newPayback.toFixed(1))
        }
    };
};

export const calculateSimpleGeneration = (modules: ModuleSpecs[], hspMonthly: number[], performanceRatio: number = 0.75): number[] => {
    const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Se não tiver HSP mensal (ex: fallback), usa média 5.0
    const irrad = hspMonthly && hspMonthly.length === 12 ? hspMonthly : Array(12).fill(5.0);

    return irrad.map((dailyHsp, i) => {
        return totalPowerKwp * dailyHsp * daysInMonth[i] * performanceRatio;
    });
};
