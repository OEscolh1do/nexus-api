
export type ConnectionType = 'monofasico' | 'bifasico' | 'trifasico';

export interface EngineeringSettings {
  performanceRatio: number;
  orientationFactors: {
    norte: number;
    leste: number;
    oeste: number;
    sul: number;
  };
  referenceKitPricePerKwp: number;
  monthlyInterestRate: number;
  marginPercentage: number;
  commissionPercentage: number;
  taxPercentage: number;
  engineerName: string;
  creaNumber: string;
  companyCnpj: string;
  co2Factor: number;
  serviceUnitModule: number;
  serviceUnitStructure: number;
  serviceUnitInverter: number;
  serviceProjectBase: number;
  serviceProjectPercent: number;
  serviceAdminBase: number;
  serviceAdminPercent: number;
  serviceMaterialsPercent: number;
  energyInflationRate: number;
}

export interface InvoiceData {
  id: string;
  name: string;
  installationNumber: string;
  concessionaire: string;
  rateGroup: string;
  connectionType: ConnectionType;
  voltage: string;
  breakerCurrent: number;
  monthlyHistory: number[];
  monthlyHistoryPeak?: number[];
  monthlyHistoryOffPeak?: number[];
}

export interface InputData {
  clientName: string;
  city: string;
  state: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  lat?: number;
  lng?: number;
  invoices: InvoiceData[];
  tariffRate: number;
  orientation: string;
  availableArea: number;
  mapImage?: string;
}

export interface ChartData {
  month: string;
  consumption: number;
  generation: number;
}

export interface ServiceSchedule {
  assinatura: number;
  chegada: number;
  troca: number;
  finalizacao: number;
}

export interface InstallmentOption {
  parcelas: number;
  valorParcela: number;
  valorTotal: number;
  jurosTotal: number;
}

export interface InverterSpecs {
  id: string;
  quantity: number;
  manufacturer: string;
  model: string;
  maxInputVoltage: number;
  minInputVoltage: number;
  maxInputCurrent: number;
  outputVoltage: number;
  outputFrequency: number;
  maxOutputCurrent: number;
  nominalPower: number;
  maxEfficiency: number;
  weight: number;
  connectionType: string;
}

export interface ModuleSpecs {
  id: string;
  quantity: number;
  supplier: string;
  manufacturer: string;
  model: string;
  type: string;
  power: number;
  efficiency: number;
  cells: number;
  imp: number;
  vmp: number;
  isc: number;
  voc: number;
  weight: number;
  area: number;
  dimensions: string;
  inmetroId: string;
  maxFuseRating: number;
  tempCoeff: number;
  annualDepreciation: number;
}

export interface ServiceItem {
  description: string;
  quantity: number | string;
  unitValue: number;
  total: number;
}

export interface FinancialSummary {
  total_hardware_estimado: number;
  total_servicos_contratados: number;
  investimento_total_referencia: number;
  payback_estimado_anos: number;
  roi_25_anos: number;
}

export interface ProposalData {
  clientName: string;
  city: string;
  state: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  lat?: number;
  lng?: number;
  tariffRate: number;
  installationNumber: string;
  connectionType: ConnectionType;
  concessionaire: string;
  rateGroup: string;
  voltage: string;
  breakerCurrent: number;
  systemSize: number;
  panelCount: number;
  roofArea: number;
  moduleManufacturer: string;
  panelPower: number;
  orientation: string;
  availableArea: number;
  inverters: InverterSpecs[];
  modules: ModuleSpecs[];
  monthlyGeneration: number[];
  monthlyConsumption: number[];
  annualSavings: number;
  totalInvestment: number;
  kitPrice: number;
  servicePrice: number;
  paybackYears: number;
  co2Savings: number;
  chartData: ChartData[];
  peakMonthConsumption: string;
  peakMonthGeneration: string;
  currentMonthlyCost: number;
  newMonthlyCost: number;
  engineerName: string;
  creaNumber: string;
  inverterWarranty: string;
  irradiationLocal: number;
  avgMonthlyGeneration: number;
  irradiationSource?: string;
  serviceSchedule: ServiceSchedule;
  installments: InstallmentOption[];
  serviceComposition: ServiceItem[];
  resumo_financeiro: FinancialSummary;
  mapImage?: string;
}

export enum ViewState {
  FORM = 'FORM',
  ENERGY_FLUX = 'ENERGY_FLUX',
  TECH_CONFIG = 'TECH_CONFIG',
  ANALYSIS = 'ANALYSIS',
  SERVICE_COMPOSITION = 'SERVICE_COMPOSITION',
  PREVIEW = 'PREVIEW'
}

export interface WeatherAnalysis {
  hsp_monthly: number[];
  irradiation_source: string;
  ambient_temp_avg: number;
  location_name: string;
}
