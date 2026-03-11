import pino from "pino";
import { InputData, EngineeringSettings, SolarOutput, ServiceItem } from "../types";
import { IIrradiationProvider } from "../ports/IIrradiationProvider";
import { IEquipmentRepository } from "../ports/IEquipmentRepository";

const logger = pino();

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const GRID_COST_KWH: Record<string, number> = {
  'monofasico': 30,
  'bifasico': 50,
  'trifasico': 100
};

export class SolarCalculator {
  constructor(
    private irradiationProvider: IIrradiationProvider,
    private equipmentRepository: IEquipmentRepository
  ) {}

  async calculate(input: InputData, settings: EngineeringSettings): Promise<SolarOutput> {
    const avgConsumption = input.invoices[0].monthlyHistory.reduce((a: number, b: number) => a + b, 0) / 12;

    logger.info({
      event: "solar.calculation.started",
      input: {
        city: input.city,
        state: input.state,
        consumption: avgConsumption
      },
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Get Irradiation
      const irradiation = await this.irradiationProvider.getByCity(input.city, input.state);
      const hspAvg = irradiation.monthly.reduce((a, b) => a + b, 0) / 12;
      
      // 2. Get Equipment
      const availableModules = await this.equipmentRepository.getModules();
      const availableInverters = await this.equipmentRepository.getInverters();
      
      if (availableModules.length === 0 || availableInverters.length === 0) {
        throw new Error("No equipment available in repository");
      }

      // 3. Auto-Sizing Logic
      // Target Generation = Consumption (Net Metering optimal point often matches consumption)
      // Power (kWp) = AnnualGeneration / (AvgHSP * 365 * PR) roughly
      // Or MonthlyGeneration = Power * HSP * 30 * PR
      // Target Power = AvgConsumption / (AvgHSP * 30 * PR)
      
      // V2.1.0: orientation agora é opcional em InputData (migração para EngineeringSlice)
      // Fallback para 'Norte' se não definido
      const orientationKey = (input.orientation || 'Norte').toLowerCase() as keyof typeof settings.orientationFactors;
      const orientationFactor = settings.orientationFactors[orientationKey] || 1.0;
      const effectivePR = settings.performanceRatio * orientationFactor;

      const targetSystemSizeKwp = avgConsumption / (hspAvg * 30.4 * effectivePR);
      
      // Select module (simple logic: pick highest power or first)
      const selectedModule = availableModules.sort((a, b) => b.power - a.power)[0]; // Highest power
      const modulesNeeded = Math.ceil((targetSystemSizeKwp * 1000) / selectedModule.power);
      
      const actualSystemSizeKwp = (modulesNeeded * selectedModule.power) / 1000;
      
      // Select inverter (match DC/AC ratio ~ 1.2 or similar, simplified here to match power)
      // Pick inverter with nominalPower closest to systemSize but >= size/1.3
      const selectedInverter = availableInverters.find(i => i.nominalPower >= actualSystemSizeKwp * 0.75) || availableInverters[0];
      const invertersNeeded = Math.ceil(actualSystemSizeKwp / selectedInverter.nominalPower);

      // 4. Calculate Generation
      const monthlyGeneration = irradiation.monthly.map((hsp, i) => {
         return actualSystemSizeKwp * hsp * DAYS_IN_MONTH[i] * effectivePR;
      });
      const annualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);

      // 5. Calculate Financials
      // Kit Price
      const kitPrice = actualSystemSizeKwp * settings.referenceKitPricePerKwp;
      
      // Service Price (Composition)
      const serviceComposition = this.calculateServiceComposition(modulesNeeded, invertersNeeded, settings);
      const servicePrice = serviceComposition.reduce((acc, item) => acc + item.total, 0);
      
      const totalInvestment = kitPrice + servicePrice;
      
      // Savings
      // Grid Availability Cost deduction
      const connectionType = input.invoices[0].connectionType;
      const minKwhToPay = GRID_COST_KWH[connectionType] || 100; // Default to 3-phase if unknown
      
      // Savings = (Billable Consumption replaced) * Tariff
      // Billable Replaced = min(Generation, Consumption - MinKwh)
      // But usually simply: annual savings = (AvgConsumption - MinKwh) * Tariff * 12
      // assuming Generation covers it. If Generation < Consumption, it's Generation * Tariff.
      
      // Let's take the lesser of Generation vs (Consumption - MinKwh)
      const usableGeneration = Math.min(this.avgMonthlyGeneration(monthlyGeneration), avgConsumption - minKwhToPay);
      const monthlySavingsBRL = Math.max(0, usableGeneration * input.tariffRate);
      const annualSavings = monthlySavingsBRL * 12; // Simplified
      
      // Payback & ROI
      // Using inflation logic similar to original but simplified/robust
      let paybackYears = 0;
      let cumulative = -totalInvestment;
      let found = false;
      let totalLifecycleSavings = 0;
      
      for (let y = 1; y <= 30; y++) {
         const inflation = Math.pow(1 + (settings.energyInflationRate || 0.045), y - 1);
         const yearSavings = annualSavings * inflation;
         cumulative += yearSavings;
         totalLifecycleSavings += yearSavings;
         
         if (!found && cumulative >= 0) {
             const prev = cumulative - yearSavings;
             paybackYears = (y - 1) + (Math.abs(prev) / yearSavings);
             found = true;
         }
      }
      
      if (!found) paybackYears = 30;
      const roi = totalLifecycleSavings - totalInvestment;

      const co2Savings = (annualGeneration * settings.co2Factor) / 1000;
      
      const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartData = MONTHS.map((m, i) => ({
        month: m,
        consumption: Math.round(input.invoices[0].monthlyHistory[i]),
        generation: Math.round(monthlyGeneration[i]),
      }));

      // Installments Logic (Simplified)
      const options = [1, 12, 24, 36, 48, 60];
      const installments = options.map(n => {
          // Simple interest logic or compound? Original used compound.
          // Using simplified standard logic for now as recreating exact banking logic without exact params is guess work.
          // Original: valorTotal = valorBase * (1 + TAXA)^meses
          const rate = settings.monthlyInterestRate || 0.01;
          const total = totalInvestment * Math.pow(1 + rate, n);
          return {
              parcelas: n,
              valorParcela: total / n,
              valorTotal: total,
              jurosTotal: total - totalInvestment
          };
      });

      const output: SolarOutput = {
        systemSizeKwp: Number(actualSystemSizeKwp.toFixed(2)),
        moduleCount: modulesNeeded,
        moduleBrand: selectedModule.manufacturer,
        moduleModel: selectedModule.model,
        inverterBrand: selectedInverter.manufacturer,
        inverterModel: selectedInverter.model,
        modules: [{ ...selectedModule, quantity: modulesNeeded }],
        inverters: [{ ...selectedInverter, quantity: invertersNeeded }],
        totalInvestment: Number(totalInvestment.toFixed(2)),
        paybackYears: Number(paybackYears.toFixed(1)),
        monthlySavings: Number(monthlySavingsBRL.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        monthlyGeneration: monthlyGeneration.map(v => Number(v.toFixed(1))),
        annualGeneration: Number(annualGeneration.toFixed(1)),
        avgMonthlyGeneration: Number((annualGeneration / 12).toFixed(1)),
        co2Savings: Number(co2Savings.toFixed(2)),
        currentMonthlyCost: avgConsumption * input.tariffRate,
        newMonthlyCost: (avgConsumption - (annualGeneration/12)) * input.tariffRate, // Simplified
        installments,
        serviceComposition,
        chartData,
        peakMonthConsumption: MONTHS[input.invoices[0].monthlyHistory.indexOf(Math.max(...input.invoices[0].monthlyHistory))] || 'N/A',
        peakMonthGeneration: MONTHS[monthlyGeneration.indexOf(Math.max(...monthlyGeneration))] || 'N/A',
        irradiationLocal: Number(hspAvg.toFixed(2)),
        serviceSchedule: {
            assinatura: servicePrice * 0.3,
            chegada: servicePrice * 0.2,
            troca: servicePrice * 0.25,
            finalizacao: servicePrice * 0.25
        },
        calculatedAt: new Date()
      };

      logger.info({
        event: "solar.calculation.completed",
        output: { systemSizeKwp: output.systemSizeKwp, payback: output.paybackYears },
        duration: "N/A" // could verify timing if needed
      });

      return output;

    } catch (error: any) {
      logger.error({
        event: "solar.calculation.failed",
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private calculateServiceComposition(modQty: number, invQty: number, settings: EngineeringSettings): ServiceItem[] {
    const directServiceCosts: ServiceItem[] = [
      {
        description: "Módulos Fotovoltaico - Montagem telhado",
        quantity: modQty,
        unitValue: settings.serviceUnitModule,
        total: modQty * settings.serviceUnitModule
      },
      {
        description: "Estrutura metálica de suporte - Montagem telhado",
        quantity: modQty / 2,
        unitValue: settings.serviceUnitStructure,
        total: Math.ceil(modQty / 2) * settings.serviceUnitStructure
      },
      {
        description: "Inversor(es) e conectores - Ligações e instalação",
        quantity: invQty,
        unitValue: settings.serviceUnitInverter,
        total: invQty * settings.serviceUnitInverter
      },
      {
        description: "Projeto, regularização e ART",
        quantity: `${(settings.serviceProjectPercent * 100).toFixed(0)}%`,
        unitValue: settings.serviceProjectBase,
        total: settings.serviceProjectBase * settings.serviceProjectPercent
      },
      {
        description: "Administração da instalação e despesas gerais",
        quantity: `${(settings.serviceAdminPercent * 100).toFixed(0)}%`,
        unitValue: settings.serviceAdminBase,
        total: settings.serviceAdminBase * settings.serviceAdminPercent
      }
    ];

    const sumServices = directServiceCosts.reduce((acc, item) => acc + item.total, 0);
    const materialsCost = sumServices * settings.serviceMaterialsPercent;

    const materialsItem: ServiceItem = {
      description: "Materiais para instalação",
      quantity: `${(settings.serviceMaterialsPercent * 100).toFixed(0)}%`,
      unitValue: sumServices,
      total: materialsCost
    };

    const allDirectCosts = [...directServiceCosts, materialsItem];
    const subtotalA = allDirectCosts.reduce((acc, item) => acc + item.total, 0);

    const overheads: ServiceItem[] = [
      {
        description: "Margem de Lucro",
        quantity: `${(settings.marginPercentage * 100).toFixed(1)}%`,
        unitValue: subtotalA,
        total: settings.marginPercentage * subtotalA
      },
      {
        description: `Comissão "VENDEDOR"`,
        quantity: `${(settings.commissionPercentage * 100).toFixed(1)}%`,
        unitValue: subtotalA,
        total: settings.commissionPercentage * subtotalA
      },
      {
        description: "Impostos, tributos e taxas",
        quantity: `${(settings.taxPercentage * 100).toFixed(1)}%`,
        unitValue: subtotalA,
        total: settings.taxPercentage * subtotalA
      }
    ];

    return [...allDirectCosts, ...overheads];
  }

  private avgMonthlyGeneration(gen: number[]): number {
    return gen.reduce((a, b) => a + b, 0) / 12;
  }
}
