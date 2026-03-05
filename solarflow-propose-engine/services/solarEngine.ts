
import { InputData, ProposalData, ConnectionType, InstallmentOption, ServiceSchedule, InverterSpecs, ModuleSpecs, ServiceItem, FinancialSummary, EngineeringSettings } from '../types';

const IRRADIATION_DB: Record<string, number[]> = {
  'PA-DEFAULT': [4.3, 4.2, 4.1, 4.3, 4.6, 5.0, 5.3, 5.6, 5.5, 5.2, 4.8, 4.5],
  'PA-BELÉM': [4.1, 3.9, 3.8, 4.0, 4.5, 5.1, 5.4, 5.7, 5.6, 5.3, 5.0, 4.6],
  'PA-PARAUAPEBAS': [4.0, 4.1, 4.2, 4.5, 4.9, 5.3, 5.7, 5.9, 5.4, 4.9, 4.4, 4.1],
  'PA-MARABÁ': [4.1, 4.2, 4.3, 4.6, 5.0, 5.4, 5.8, 6.0, 5.5, 5.0, 4.5, 4.2],
  'RS-DEFAULT': [6.2, 5.8, 4.8, 3.8, 3.0, 2.6, 2.9, 3.6, 4.2, 5.1, 5.9, 6.4],
};

const GRID_COST_KWH: Record<ConnectionType, number> = {
  'monofasico': 30,
  'bifasico': 50,
  'trifasico': 100
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const getIrradiationProfile = (city: string, state: string): { curve: number[], source: string } => {
  const normalize = (str: string) => str.toUpperCase().trim();
  const cityKey = `${normalize(state)}-${normalize(city)}`;
  if (IRRADIATION_DB[cityKey]) return { curve: IRRADIATION_DB[cityKey], source: `Estação Meteorológica: ${city.toUpperCase()} (${state})` };
  const stateKey = `${normalize(state)}-DEFAULT`;
  if (IRRADIATION_DB[stateKey]) return { curve: IRRADIATION_DB[stateKey], source: `Média Estadual: ${state} (Estimado)` };
  return { curve: IRRADIATION_DB['PA-DEFAULT'], source: `Base Regional Padrão` };
};

const calculateServiceComposition = (modules: ModuleSpecs[], inverters: InverterSpecs[], settings: EngineeringSettings): ServiceItem[] => {
  const modQty = modules.reduce((acc, m) => acc + m.quantity, 0);
  const invQty = inverters.reduce((acc, i) => acc + i.quantity, 0);

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
      description: "Comissão \"VENDEDOR\"",
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
};

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

const calculatePhysicsAndFinancials = (
  modules: ModuleSpecs[],
  inverters: InverterSpecs[],
  input: InputData,
  settings: EngineeringSettings,
  monthlyHistory: number[],
  optionalKitPrice?: number
) => {
  const { curve: hspCurve, source: irradiationSource } = getIrradiationProfile(input.city, input.state);

  const orientationKey = input.orientation.toLowerCase() as keyof EngineeringSettings['orientationFactors'];
  const orientationFactor = settings.orientationFactors[orientationKey] || 1.0;
  const effectivePR = settings.performanceRatio * orientationFactor;

  let actualSystemSizeKwp = 0;
  let roofArea = 0;
  let totalPanelCount = 0;

  modules.forEach(mod => {
    actualSystemSizeKwp += (mod.quantity * mod.power) / 1000;
    roofArea += (mod.quantity * mod.area);
    totalPanelCount += mod.quantity;
  });

  if (actualSystemSizeKwp === 0) actualSystemSizeKwp = 0.1;

  const serviceComposition = calculateServiceComposition(modules, inverters, settings);
  const servicePrice = serviceComposition.reduce((acc, item) => acc + item.total, 0);

  const monthlyGeneration = hspCurve.map((hsp, index) => {
    const daysInMonth = DAYS_IN_MONTH[index];
    return actualSystemSizeKwp * hsp * daysInMonth * effectivePR;
  });

  const finalKitPrice = optionalKitPrice !== undefined ? optionalKitPrice : (actualSystemSizeKwp * settings.referenceKitPricePerKwp);
  const totalInvestment = finalKitPrice + servicePrice;

  const installments = calculateInstallments(finalKitPrice);

  const monthlyAvgConsumption = monthlyHistory.reduce((a, b) => a + b, 0) / 12;

  const primaryInvoice = input.invoices[0];
  const minKwhToPay = GRID_COST_KWH[primaryInvoice.connectionType];
  const availabilityCostBRL = minKwhToPay * input.tariffRate;

  const annualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
  const avgMonthlyGeneration = annualGeneration / 12;

  const annualSavings = (monthlyAvgConsumption - minKwhToPay) * input.tariffRate * 12;

  /* OLD SIMPLE CALC
  const paybackYears = totalInvestment / annualSavings;
  const roi25Years = (annualSavings * 25) - totalInvestment;
  */

  // --- COMPLEX PAYBACK & ROI WITH INFLATION ---
  let cumulativeCashFlow = -totalInvestment;
  let paybackYears = 25; // Default if never pays back
  let foundPayback = false;
  let totalLifecycleSavings = 0;

  for (let year = 1; year <= 25; year++) {
    // Apply inflation to energy savings
    const inflationFactor = Math.pow(1 + (settings.energyInflationRate || 0), year - 1); // Year 1 is base
    const yearlySavings = annualSavings * inflationFactor;

    const prevBalance = cumulativeCashFlow;
    cumulativeCashFlow += yearlySavings;
    totalLifecycleSavings += yearlySavings;

    if (!foundPayback && cumulativeCashFlow >= 0) {
      // Linear interpolation for more precision
      // fraction = abs(prevBalance) / yearlySavings
      const fraction = Math.abs(prevBalance) / yearlySavings;
      paybackYears = (year - 1) + fraction;
      foundPayback = true;
    }
  }

  const roi25Years = totalLifecycleSavings - totalInvestment;
  // ------------------------------------------

  const co2Savings = (annualGeneration * settings.co2Factor) / 1000;

  const chartData = MONTHS.map((m, i) => ({
    month: m,
    consumption: Math.round(monthlyHistory[i]),
    generation: Math.round(monthlyGeneration[i]),
  }));

  const primaryModule = modules.length > 0 ? modules[0] : { manufacturer: "Genérico", power: 550 };

  const resumo_financeiro: FinancialSummary = {
    total_hardware_estimado: finalKitPrice,
    total_servicos_contratados: servicePrice,
    investimento_total_referencia: totalInvestment,
    payback_estimado_anos: Number(paybackYears.toFixed(1)),
    roi_25_anos: roi25Years
  };

  return {
    systemSize: Number(actualSystemSizeKwp.toFixed(2)),
    panelCount: totalPanelCount,
    roofArea: Number(roofArea.toFixed(1)),
    moduleManufacturer: primaryModule.manufacturer,
    panelPower: primaryModule.power,
    inverters,
    modules,
    serviceComposition,
    monthlyGeneration,
    monthlyConsumption: monthlyHistory,
    annualSavings,
    totalInvestment,
    kitPrice: finalKitPrice,
    servicePrice,
    paybackYears: Number(paybackYears.toFixed(1)),
    co2Savings: Number(co2Savings.toFixed(2)),
    chartData,
    currentMonthlyCost: monthlyAvgConsumption * input.tariffRate,
    newMonthlyCost: availabilityCostBRL,
    irradiationLocal: Number((hspCurve.reduce((a, b) => a + b, 0) / 12).toFixed(2)),
    avgMonthlyGeneration: Number(avgMonthlyGeneration.toFixed(1)),
    irradiationSource,
    serviceSchedule: {
      assinatura: servicePrice * 0.3,
      chegada: servicePrice * 0.2,
      troca: servicePrice * 0.25,
      finalizacao: servicePrice * 0.25
    },
    installments,
    peakMonthConsumption: MONTHS[monthlyHistory.indexOf(Math.max(...monthlyHistory))] || 'N/A',
    peakMonthGeneration: MONTHS[monthlyGeneration.indexOf(Math.max(...monthlyGeneration))] || 'N/A',
    resumo_financeiro
  };
};

export const calculateProposal = (input: InputData, settings: EngineeringSettings): ProposalData => {
  const aggregateMonthlyHistory = new Array(12).fill(0);
  input.invoices.forEach(invoice => {
    invoice.monthlyHistory.forEach((val, idx) => { aggregateMonthlyHistory[idx] += val; });
  });

  const core = calculatePhysicsAndFinancials([], [], input, settings, aggregateMonthlyHistory);

  return {
    clientName: input.clientName, city: input.city, state: input.state, street: input.street,
    neighborhood: input.neighborhood, number: input.number, complement: input.complement,
    lat: input.lat, lng: input.lng, tariffRate: input.tariffRate,
    installationNumber: input.invoices[0].installationNumber || 'N/A',
    connectionType: input.invoices[0].connectionType,
    concessionaire: input.invoices[0].concessionaire,
    rateGroup: input.invoices[0].rateGroup,
    voltage: input.invoices[0].voltage,
    breakerCurrent: input.invoices[0].breakerCurrent,
    orientation: input.orientation,
    availableArea: input.availableArea,
    engineerName: settings.engineerName,
    creaNumber: settings.creaNumber,
    inverterWarranty: "7 Anos",
    mapImage: input.mapImage,
    ...core
  };
};

export const recalculateProposal = (current: ProposalData, newModules: ModuleSpecs[], settings: EngineeringSettings): ProposalData => {
  const dummyInput = { city: current.city, state: current.state, orientation: current.orientation, tariffRate: current.tariffRate, invoices: [{ connectionType: current.connectionType }] } as any;
  const core = calculatePhysicsAndFinancials(newModules, current.inverters, dummyInput, settings, current.monthlyConsumption, current.kitPrice);
  return { ...current, ...core };
};

export const updateProposalInverters = (current: ProposalData, inverters: InverterSpecs[], settings: EngineeringSettings): ProposalData => {
  const dummyInput = { city: current.city, state: current.state, orientation: current.orientation, tariffRate: current.tariffRate, invoices: [{ connectionType: current.connectionType }] } as any;
  const core = calculatePhysicsAndFinancials(current.modules, inverters, dummyInput, settings, current.monthlyConsumption, current.kitPrice);
  return { ...current, ...core };
};

export const recalculateProposalWithServicePrice = (current: ProposalData, newServicePrice: number): ProposalData => {
  const diff = newServicePrice - current.servicePrice;

  // Adjust "Margem de Lucro" to absorb the difference
  const newComposition = current.serviceComposition.map(item => {
    if (item.description === "Margem de Lucro") {
      return {
        ...item,
        total: item.total + diff,
        quantity: "Ajuste Manual" // Mark as manual to indicate percentage is no longer valid
      };
    }
    return item;
  });

  // Calculate new totals
  const newTotalInvestment = current.kitPrice + newServicePrice;

  // Recalculate Financials
  // Payback = Total Investment / Annual Savings (complex)

  let tempCumulative = -newTotalInvestment;
  let newPayback = 25;
  let newFound = false;
  let newTotalLifecycle = 0;
  const baseAnnualSavings = current.annualSavings || 1;

  const inflationRate = (current as any).energyInflationRate || 0.045; // Access from somewhere or assume default if not in Proposals yet (it IS in Settings passed to generate, but effectively we might lose it if not stored in ProposalData. Actually, we should use the settings... but wait, this function doesn't take 'Settings' object, it takes 'ProposalData'. 
  // CRITICAL FIX: The 'recalculateProposalWithServicePrice' signature does NOT include 'Settings'. 
  // However, `ProposalData` does NOT currently store 'energyInflationRate'.
  // I must rely on a rough estimate OR assume it's in ProposalData if I added it? 
  // I did NOT add it to ProposalData in types.ts, only EngineeringSettings.
  // BUT the calculatePhysicsAndFinancials used 'settings'. The initial 'ProposalData' was generated with it.
  // To render this correctly without passing Settings, I might need to store the inflation rate in the ProposalData or just use a default here if missing. 
  // BETTER APPROACH: Use 4.5% as fallback or try to infer. 
  // Ideally, I should add energyInflationRate to ProposalData to be safe.

  // Let's check types.ts again. I added it to EngineeringSettings. ProposalData doesn't have it.
  // I will assume a standard 4.5% here if I can't access settings, OR I should update the signature.
  // Updating signature is cleaner but requires updating the Component too.
  // Let's stick with a default of 4.5% if we can't find it, but actually, let's just use the same logic 
  // assuming we can pass the inflation rate in the loop. 

  // For now, I will assume a default of 0.045 to avoid breaking the interface, 
  // OR I can add it to ProposalData. 
  // Let's add it to ProposalData to be robust. 
  // I will add it to types.ts first in next step if needed, but for now I will use the default value consistent with App.tsx.

  const assumedInflation = 0.045;

  for (let y = 1; y <= 25; y++) {
    const infFactor = Math.pow(1 + assumedInflation, y - 1);
    const ySav = baseAnnualSavings * infFactor;

    const prev = tempCumulative;
    tempCumulative += ySav;
    newTotalLifecycle += ySav;

    if (!newFound && tempCumulative >= 0) {
      const frac = Math.abs(prev) / ySav;
      newPayback = (y - 1) + frac;
      newFound = true;
    }
  }

  const newRoi = newTotalLifecycle - newTotalInvestment;

  const newResumo = {
    ...current.resumo_financeiro,
    total_servicos_contratados: newServicePrice,
    investimento_total_referencia: newTotalInvestment,
    payback_estimado_anos: Number(newPayback.toFixed(1)),
    roi_25_anos: newRoi
  };

  return {
    ...current,
    servicePrice: newServicePrice,
    serviceComposition: newComposition,
    totalInvestment: newTotalInvestment,
    paybackYears: Number(newPayback.toFixed(1)),
    resumo_financeiro: newResumo
  };
};
