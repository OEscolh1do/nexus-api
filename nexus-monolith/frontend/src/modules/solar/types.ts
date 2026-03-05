export type ConnectionType = 'monofasico' | 'bifasico' | 'trifasico';

export const ViewState = {
  FORM: 'FORM',
  PREVIEW: 'PREVIEW',
  PIPELINE: 'PIPELINE'
} as const;

export type ViewState = typeof ViewState[keyof typeof ViewState];

export interface Invoice {
  id: string;
  name: string;
  installationNumber: string;
  concessionaire: string;
  rateGroup: string;
  connectionType: ConnectionType;
  voltage: string;
  breakerCurrent: number;
  monthlyHistory: number[];
  file?: File;
}

export interface InputData {
  clientName: string;
  whatsapp?: string; // Optional
  email?: string; // Optional
  cep?: string; // Optional
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  availableArea: number;
  orientation: string;
  currentBill?: number; // R$
  connectionType?: ConnectionType; // Optional if using invoices
  mapImage?: string; // Data URL
  roofArea?: number; // Aliases for compatibility
  irradiationLocal?: number;
  panelCount?: number;
  
  // New fields
  invoices?: Invoice[];
  tariffRate?: number;
}

export interface ModuleSpecs {
  model: string;
  power: number;
  quantity: number;
  type: string;
  manufacturer?: string;
  technology?: string;
  efficiency?: number;
  warranty: string;
}

export interface InverterSpecs {
  model: string;
  power: number;
  quantity: number;
  monitor: string;
  manufacturer?: string;
  warranty: string;
}

export interface ServiceItem {
  description: string;
  quantity: number | string;
  unitValue: number;
  total: number;
  isTotal?: boolean;
}

export interface FinancialSummary {
  investimento_total: number;
  investimento_total_referencia: number;
  total_hardware_estimado?: number;
  total_servicos_contratados?: number;
  economia_mensal: number;
  economia_anual: number;
  tempo_retorno_anos: number;
  payback_estimado_anos?: number; // Alias
  roi_25_anos: number;
  valor_kwp: number;
}

export interface EngineeringSettings {
  kitPricePerKwp?: number; // Optional alias
  referenceKitPricePerKwp?: number;
  freightFixed?: number;
  serviceUnitModule: number;
  serviceUnitStructure: number;
  serviceUnitInverter: number;
  serviceProjectBase: number;
  serviceProjectPercent: number;
  serviceAdminBase: number;
  serviceAdminPercent: number;
  serviceMaterialsPercent: number;
  marginPercentage: number;
  commissionPercentage: number;
  taxPercentage: number;
  
  // Added properties
  performanceRatio?: number;
  orientationFactors?: {
    norte: number;
    leste: number;
    oeste: number;
    sul: number;
  };
  monthlyInterestRate?: number;
  engineerName?: string;
  creaNumber?: string;
  companyCnpj?: string;
  co2Factor?: number;
  energyInflationRate?: number;
}

export interface InstallmentOption {
  type: string;
  output: string;
  interest: string;
}

export interface ChartData {
  month: string;
  consumption: number;
  generation: number;
}

export interface ProposalData {
  id: string;
  clientName: string;
  systemSize: number | string; // kWp
  modulesQty: number;
  inverterQty: number;
  monthlyAvgGeneration: number; // kWh
  avgMonthlyGeneration?: number; // Alias
  location: string;
  city?: string;
  state?: string;
  irradiationSource: string;
  
  // Engineer Info (Mocked for now if not dynamic)
  engineerName?: string;
  creaNumber?: string;

  modules: ModuleSpecs[];
  inverters: InverterSpecs[];
  
  services: ServiceItem[];
  resumo_financeiro: FinancialSummary;
  
  // Charts - Recharts format
  chartData?: ChartData[];
  
  // Legacy format for compatibility/migration
  grafico_geracao?: { 
    labels: string[];
    geracao: number[];
    consumo: number[];
  };
  payback_chart?: {
    labels: string[];
    accumulated_savings: number[];
  };

  currentMonthlyCost: number; // Required now
  totalInvestment: number; // Required now
  annualSavings: number; // Required now

  mapImage?: string;
  roofArea?: number;
  irradiationLocal?: number;
  orientation?: string;
  panelCount?: number;
  
  // Added missing properties
  lat?: number;
  lng?: number;
  
  payment_options: InstallmentOption[];
}
