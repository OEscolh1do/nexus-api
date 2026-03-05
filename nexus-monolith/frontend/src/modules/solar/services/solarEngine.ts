import type { InputData, ProposalData, ConnectionType, InverterSpecs, ModuleSpecs, ServiceItem, EngineeringSettings, ChartData } from '../types';

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

  const sumOverheads = overheads.reduce((acc, item) => acc + item.total, 0);
  const totalServiceValue = subtotalA + sumOverheads;

  return [...allDirectCosts, ...overheads, {
    description: "VALOR TOTAL DOS SERVIÇOS",
    quantity: "1",
    unitValue: totalServiceValue,
    total: totalServiceValue,
    isTotal: true
  }];
};

export const calculateProposal = (input: InputData, settings: EngineeringSettings): ProposalData => {
  const { currentBill = 0, connectionType = 'monofasico' } = input;
  const irradiation = getIrradiationProfile(input.city, input.state);
  
  const annualAvgIrradiation = irradiation.curve.reduce((a, b) => a + b, 0) / 12;
  const performanceRatio = settings.performanceRatio || 0.75; // 75% efficiency fallback
  
  const tariff = input.tariffRate || 0.95; // R$/kWh
  const monthlyConsumptionKwh = currentBill / tariff;
  
  // System Size Calculation
  const targetKwh = Math.max(0, monthlyConsumptionKwh - GRID_COST_KWH[connectionType]);
  const systemSizeKwp = targetKwh / (annualAvgIrradiation * 30 * performanceRatio);
  
  const modulePowerW = 550;
  const numModules = Math.ceil((systemSizeKwp * 1000) / modulePowerW);
  const realSystemSizeKwp = (numModules * modulePowerW) / 1000;

  // Generation Estimation
  const monthlyGeneration = irradiation.curve.map(irr => realSystemSizeKwp * irr * 30 * performanceRatio);
  const annualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
  const monthlyAvgGeneration = annualGeneration / 12;

  // Costs
  const kitCost = realSystemSizeKwp * (settings.kitPricePerKwp || settings.referenceKitPricePerKwp || 3000);
  const freightCost = settings.freightFixed || 0;
  
  // Compose Modules List
  const modulesSpecs: ModuleSpecs[] = [{
    model: "Jinko Solar 550W Pro Tiger",
    power: 550,
    quantity: numModules,
    type: "Monocristalino Half-Cell",
    warranty: "12 Anos (Produto) / 25 Anos (Performance)"
  }];

  // Compose Inverter
  const invertersSpecs: InverterSpecs[] = [{
    model: "Growatt 5kW", // Logic to pick inverter size based on kWp would go here
    power: 5,
    quantity: 1,
    monitor: "Wifi-X Stick",
    warranty: "10 Anos"
  }];

  // Services
  const services = calculateServiceComposition(modulesSpecs, invertersSpecs, settings);
  const totalServices = services.find(s => s.isTotal)?.total || 0;
  
  const totalInvestment = kitCost + freightCost + totalServices;

  // Financials
  const monthlySavings = (monthlyAvgGeneration * tariff) * 0.95; // 5% maintenance buffer?
  const annualSavings = monthlySavings * 12;
  const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : 99;
  const roi = totalInvestment > 0 ? ((annualSavings * 25 - totalInvestment) / totalInvestment) * 100 : 0;

  // Generate Recharts Data
  const chartData: ChartData[] = MONTHS.map((month, idx) => ({
    month,
    consumption: Math.round(monthlyConsumptionKwh),
    generation: Math.round(monthlyGeneration[idx])
  }));

  return {
    id: crypto.randomUUID(),
    clientName: input.clientName,
    systemSize: realSystemSizeKwp.toFixed(2),
    modulesQty: numModules,
    inverterQty: 1, // Simplified
    monthlyAvgGeneration: Math.round(monthlyAvgGeneration),
    location: `${input.city}, ${input.state}`,
    irradiationSource: irradiation.source,
    
    // Engineer Info
    engineerName: settings.engineerName,
    creaNumber: settings.creaNumber,

    modules: modulesSpecs,
    inverters: invertersSpecs,
    
    services: services,
    resumo_financeiro: {
      investimento_total: totalInvestment,
      investimento_total_referencia: totalInvestment,
      economia_mensal: monthlySavings,
      economia_anual: annualSavings,
      tempo_retorno_anos: paybackYears,
      roi_25_anos: roi,
      valor_kwp: realSystemSizeKwp > 0 ? totalInvestment / realSystemSizeKwp : 0
    },

    // Graphs
    chartData,
    payback_chart: {
      labels: Array.from({length: 25}, (_, i) => `Ano ${i+1}`),
      accumulated_savings: Array.from({length: 25}, (_, i) => (annualSavings * (i+1)) - totalInvestment)
    },

    currentMonthlyCost: currentBill,
    totalInvestment: totalInvestment,
    annualSavings: annualSavings,

    mapImage: input.mapImage,
    roofArea: input.roofArea || input.availableArea,
    irradiationLocal: Math.round(annualAvgIrradiation * 100) / 100,
    orientation: input.orientation,
    panelCount: numModules,
    lat: input.lat,
    lng: input.lng,

    payment_options: [
      { type: 'A Vista', output: `R$ ${(totalInvestment * 0.95).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, interest: '5% Desconto' },
      { type: 'Financiamento 60x', output: `60x R$ ${(totalInvestment / 45).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, interest: '1.29% a.m.' }
    ]
  };
};
