/**
 * TECH-SLICE.TS
 * Slice Zustand para dados Técnicos (Equipamentos e Settings)
 * 
 * Responsabilidade: Gerenciar estado de módulos solares, inversores,
 * e configurações de engenharia (PR, perdas, custos).
 * 
 * // PRÉ-1 (22/03/2026): Estrutura normalizada { ids, entities }
 * //   Todas as actions usam O(1) entity lookup em vez de .map() full-scan.
 * 
 * // NOTA V2.1.0: Novos campos de settings adicionados:
 * //   - minHistoricalTemp, vocTempCoefficient (Voc por temperatura)
 * //   - soilingLoss, mismatchLoss, inverterEfficiency (PR dinâmico)
 */

import { StateCreator } from 'zustand';
import { ModuleSpecs, InverterSpecs, EngineeringSettings } from '@/core/types';
import { NormalizedCollection, createEmptyCollection, fromArray } from '@/core/types/normalized.types';

/**
 * Interface do slice técnico
 * Expõe dados e actions para manipulação de equipamentos e settings
 * 
 * PRÉ-1: modules e inverters agora são NormalizedCollection<T>
 */
export interface TechSlice {
  /** Coleção normalizada de módulos selecionados */
  modules: NormalizedCollection<ModuleSpecs>;
  
  /** Coleção normalizada de inversores selecionados */
  inverters: NormalizedCollection<InverterSpecs>;
  
  /** Configurações de engenharia (PR, perdas, custos, etc.) */
  settings: EngineeringSettings;
  
  /** Preço manual do kit (opcional, sobrescreve cálculo automático) */
  manualKitPrice: number;
  
  // Actions - Módulos
  addModule: (module: ModuleSpecs) => void;
  removeModule: (id: string) => void;
  updateModuleQty: (id: string, qty: number) => void;
  updateModulePrice: (id: string, price: number) => void;
  /** Aceita array para compatibilidade; converte internamente */
  setModules: (modules: ModuleSpecs[]) => void;
  
  // Actions - Inversores
  addInverter: (inverter: InverterSpecs) => void;
  removeInverter: (id: string) => void;
  updateInverterQty: (id: string, qty: number) => void;
  updateInverterPrice: (id: string, price: number) => void;
  /** Aceita array para compatibilidade; converte internamente */
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
  modules: createEmptyCollection<ModuleSpecs>(),
  inverters: createEmptyCollection<InverterSpecs>(),
  settings: initialSettings,
  manualKitPrice: 0,

  // ─── Módulos (O(1) normalized) ──────────────────────────

  addModule: (module) => set((state) => {
    const qty = module.quantity || 1;
    const newItems: Record<string, ModuleSpecs> = {};
    const newIds: string[] = [];
    
    for (let i = 0; i < qty; i++) {
        // Gera um ID único para *cada* instância física do módulo
        const instanceId = Math.random().toString(36).substring(2, 9);
        newIds.push(instanceId);
        newItems[instanceId] = { ...module, id: instanceId, quantity: undefined };
    }

    return {
      modules: {
        ids: [...state.modules.ids, ...newIds],
        entities: { ...state.modules.entities, ...newItems },
      },
    };
  }),

  removeModule: (id) => set((state) => {
    const { [id]: _, ...remaining } = state.modules.entities;
    return {
      modules: {
        ids: state.modules.ids.filter(existingId => existingId !== id),
        entities: remaining,
      },
    };
  }),

  updateModuleQty: (id, targetQty) => set((state) => {
      // Como o ID recebido agora pertence a UMA instância, precisamos achar o modelo base
      const baseInstance = state.modules.entities[id];
      if (!baseInstance) return state;

      const modelName = baseInstance.model;
      const allInstancesOfModel = state.modules.ids.filter(
          i => state.modules.entities[i]?.model === modelName
      );
      const currentQty = allInstancesOfModel.length;

      if (targetQty === currentQty) return state;

      const newEntities = { ...state.modules.entities };
      let newIds = [...state.modules.ids];

      if (targetQty > currentQty) {
          // Add clones
          const diff = targetQty - currentQty;
          for (let i = 0; i < diff; i++) {
              const newId = Math.random().toString(36).substring(2, 9);
              newIds.push(newId);
              newEntities[newId] = { ...baseInstance, id: newId };
          }
      } else {
          // Remove (LIFO) - but only those NOT assigned to a string yet?
          // For now, simple LIFO on the instances array. The String state might be orphaned,
          // which should be handled via an event or the tree simply drops invalid ones.
          const diff = currentQty - targetQty;
          const idsToRemove = allInstancesOfModel.slice(-diff);
          
          newIds = newIds.filter(i => !idsToRemove.includes(i));
          idsToRemove.forEach(i => delete newEntities[i]);
      }

      return {
          modules: { ids: newIds, entities: newEntities }
      };
  }),

  updateModulePrice: (id, price) => set((state) => ({
    modules: {
      ...state.modules,
      entities: {
        ...state.modules.entities,
        [id]: { ...state.modules.entities[id], price },
      },
    },
  })),

  setModules: (modules) => set({ modules: fromArray(modules) }),

  // ─── Inversores (O(1) normalized) ───────────────────────

  addInverter: (inverter) => set((state) => ({
    inverters: {
      ids: [...state.inverters.ids, inverter.id],
      entities: { ...state.inverters.entities, [inverter.id]: inverter },
    },
  })),

  removeInverter: (id) => set((state) => {
    const { [id]: _, ...remaining } = state.inverters.entities;
    return {
      inverters: {
        ids: state.inverters.ids.filter(existingId => existingId !== id),
        entities: remaining,
      },
    };
  }),

  updateInverterQty: (id, qty) => set((state) => ({
    inverters: {
      ...state.inverters,
      entities: {
        ...state.inverters.entities,
        [id]: { ...state.inverters.entities[id], quantity: qty },
      },
    },
  })),

  updateInverterPrice: (id, price) => set((state) => ({
    inverters: {
      ...state.inverters,
      entities: {
        ...state.inverters.entities,
        [id]: { ...state.inverters.entities[id], price },
      },
    },
  })),

  setInverters: (inverters) => set({ inverters: fromArray(inverters) }),

  // ─── Settings (inalterado) ──────────────────────────────

  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings }
  })),

  setManualKitPrice: (price) => set({ manualKitPrice: price }),
});

