/**
 * TECH-SLICE.TS
 * Slice Zustand para dados Técnicos (Equipamentos e Settings)
 * 
 * Responsabilidade: Gerenciar estado de módulos solares, inversores,
 * e configurações de engenharia (PR, perdas, custos).
 * 
 * // NOTA V2.1.0: Novos campos de settings adicionados:
 * //   - minHistoricalTemp, vocTempCoefficient (Voc por temperatura)
 * //   - soilingLoss, mismatchLoss, inverterEfficiency (PR dinâmico)
 */

import { StateCreator } from 'zustand';
import { ModuleSpecs, InverterSpecs, EngineeringSettings } from '@/core/types';

/**
 * Interface do slice técnico
 * Expõe dados e actions para manipulação de equipamentos e settings
 */
export interface TechSlice {
  /** Array de especificações de módulos selecionados */
  modules: ModuleSpecs[];
  
  /** Array de especificações de inversores selecionados */
  inverters: InverterSpecs[];
  
  /** Configurações de engenharia (PR, perdas, custos, etc.) */
  settings: EngineeringSettings;
  
  /** Preço manual do kit (opcional, sobrescreve cálculo automático) */
  manualKitPrice: number;
  
  // Actions - Módulos
  addModule: (module: ModuleSpecs) => void;
  removeModule: (id: string) => void;
  updateModuleQty: (id: string, qty: number) => void;
  updateModulePrice: (id: string, price: number) => void;
  setModules: (modules: ModuleSpecs[]) => void;
  
  // Actions - Inversores
  addInverter: (inverter: InverterSpecs) => void;
  removeInverter: (id: string) => void;
  updateInverterQty: (id: string, qty: number) => void;
  updateInverterPrice: (id: string, price: number) => void;
  setInverters: (inverters: InverterSpecs[]) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<EngineeringSettings>) => void;
  setManualKitPrice: (price: number) => void;
}

/**
 * Estado inicial de settings de engenharia
 * 
 * Inclui novos campos V2.1.0 para cálculos avançados
 */
const initialSettings: EngineeringSettings = {
  performanceRatio: 0.75,
  referenceKitPricePerKwp: 1800,
  cableLoss: 0.02,
  structureType: 'Telhado',
  
  // Fatores de orientação por cardeal
  orientationFactors: { norte: 1, leste: 0.95, oeste: 0.95, sul: 0.85 },
  
  // Financeiro
  monthlyInterestRate: 0.02,
  marginPercentage: 0.15,
  commissionPercentage: 0.03,
  taxPercentage: 0.12,
  
  // Identificação do engenheiro
  engineerName: '',
  creaNumber: '',
  companyCnpj: '00.000.000/0000-00',
  
  // Fatores ambientais
  co2Factor: 0.08,
  
  // Serviços e custos (Neonorte Calibration - Feb 2026)
  serviceUnitModule: 131.25, // Conforme planilha
  serviceUnitStructure: 99.15, // Conforme planilha
  serviceUnitInverter: 500.32, // Conforme planilha
  serviceProjectBase: 600, // Conforme planilha
  serviceProjectPercent: 0, // Planilha usa valor fixo
  serviceAdminBase: 1542.36, // Conforme planilha
  serviceAdminPercent: 0, // Planilha usa valor fixo
  serviceMaterialsPercent: 0.20, // 20% conforme planilha
  energyInflationRate: 0.06,

  // CUSTOS DE HARDWARE (Component-Based Pricing)
  structurePricePerModule: 0, // Já incluso no UnitStructure
  bosPricePerKwp: 0, // Zerado para evitar dupla contagem com Materials%
  
  // ===========================================
  // NOVOS CAMPOS V2.1.0 - Engenharia Avançada
  // ===========================================
  
  // Premissas para cálculo de Voc por Temperatura
  minHistoricalTemp: -5, // °C - Valor conservador para Brasil (regiões frias do Sul)
  vocTempCoefficient: -0.30, // %/°C - Típico para silício cristalino
  
  // Fatores para PR Dinâmico
  // Fatores para PR Dinâmico
  soilingLoss: 0.03, // 3%
  mismatchLoss: 0.02, // 2%
  inverterEfficiency: 0.97, // 97%
  
  // Detailed Loss Profile (New V2.1.0)
  orientationLoss: 0.03,
  inclinationLoss: 0.03,
  shadingLoss: 0.03,
  horizonLoss: 0.02,
  cableDCLoss: 0.005,
  cableACLoss: 0.01,
  thermalLoss: 0.044,
  targetOversizing: 1.2,
  minPerformanceRatio: 0.75,

  // Inicialização de Custos Extras (Fix TS Error)
  infrastructureUpgradeCost: 0,
  extraMaterialsCost: 0,

  // Pricing Strategy Defaults (Hybrid Model)
  pricingModel: 'margin',
  serviceMarkup: 0.23,
  serviceCommissionFixed: 500,
};

/**
 * Factory function para criar o slice técnico
 * Segue o padrão Zustand para slices compostos
 * 
 * Tipagem genérica para compatibilidade com store composto
 */
export const createTechSlice: StateCreator<
  TechSlice,
  [],
  [],
  TechSlice
> = (set) => ({
  modules: [],
  inverters: [],
  settings: initialSettings,
  manualKitPrice: 0,

  // Módulos
  addModule: (module) => set((state) => ({ 
    modules: [...state.modules, module] 
  })),

  removeModule: (id) => set((state) => ({ 
    modules: state.modules.filter((m) => m.id !== id) 
  })),

  updateModuleQty: (id, qty) => set((state) => ({
    modules: state.modules.map((m) => m.id === id ? { ...m, quantity: qty } : m)
  })),

  updateModulePrice: (id, price) => set((state) => ({
    modules: state.modules.map((m) => m.id === id ? { ...m, price } : m)
  })),

  setModules: (modules) => set({ modules }),

  // Inversores
  addInverter: (inverter) => set((state) => ({ 
    inverters: [...state.inverters, inverter] 
  })),

  removeInverter: (id) => set((state) => ({ 
    inverters: state.inverters.filter((i) => i.id !== id) 
  })),

  updateInverterQty: (id, qty) => set((state) => ({
    inverters: state.inverters.map((i) => i.id === id ? { ...i, quantity: qty } : i)
  })),

  updateInverterPrice: (id, price) => set((state) => ({
    inverters: state.inverters.map((i) => i.id === id ? { ...i, price } : i)
  })),

  setInverters: (inverters) => set({ inverters }),

  // Settings
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings }
  })),

  setManualKitPrice: (price) => set({ manualKitPrice: price }),
});
