import { create } from 'zustand';

export interface LossProfile {
  orientation: number;
  inclination: number;
  shading: number;
  horizon: number;
  temperature: number;
  mismatch: number;
  soiling: number;
  dcCable: number;
  acCable: number;
  inverterEfficiency: number; // Stored as percentage, e.g., 98.0
}

export interface MPPTConfig {
    mpptId: number;
    stringsCount: number;
    modulesPerString: number;
    azimuth?: number; // Advanced: MPPTs can face different directions
    inclination?: number;
}

export interface ElectricalValidation {
  isValid: boolean;
  messages: string[];
  metrics: {
    vocMax: number;
    iscMax: number;
    vmpMin: number;
    vmpMax: number;
    utilizationRatio: number;
  } | null;
}

export interface InverterState {
    id: string; // Unique ID for this instance in the project
    catalogId: string; // Ref to INVERTER_CATALOG
    quantity: number;
    mpptConfigs: MPPTConfig[]; // Array of MPPT configs
    snapshot: {
        model: string;
        nominalPower: number;
        mppts: number;
    };

}

import { Inverter } from '@/modules/crm/store/useEquipmentStore';

interface TechState {
  lossProfile: LossProfile;
  selectedModuleId: string | null;
  
  // Inverters State
  inverters: InverterState[];
  
  // Actions
  updateLoss: (key: keyof LossProfile, value: number) => void;
  resetLosses: () => void;
  resetProject: () => void;
  setSelectedModuleId: (id: string | null) => void;
  
  // Inverter Actions
  addInverter: (equipment: Inverter) => void;
  removeInverter: (id: string) => void;
  updateInverterQuantity: (id: string, qty: number) => void;

  updateMPPTConfig: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  
  // Selectors (Computed)
  getPerformanceRatio: () => number; // Returns decimal (0.75) using IEC 61724 (Multiplicative)
  getAdditivePerformanceRatio: () => number; // Returns decimal using Simple Sum (Conservative)
  getDCACRatio: (totalModulePower: number) => number; // Returns percentage (e.g. 1.25 for 125%)
  
  // PR Mode
  prCalculationMode: 'iec' | 'additive';
  setPrCalculationMode: (mode: 'iec' | 'additive') => void;
}

const DEFAULT_LOSSES: LossProfile = {
  orientation: 3.0,
  inclination: 4.0,
  shading: 3.0,
  horizon: 2.0,
  temperature: 4.4,
  mismatch: 1.5,
  soiling: 5.0,
  dcCable: 0.5,
  acCable: 1.0,
  inverterEfficiency: 98.0
};

// Helper: Generate Default String Config for a new Inverter
const createDefaultMPPTConfig = (mppts: number): MPPTConfig[] => {
    return Array.from({ length: mppts }, (_, i) => ({
        mpptId: i + 1,
        stringsCount: 1,
        modulesPerString: 0
    }));
};



export const useTechStore = create<TechState>((set, get) => ({
  lossProfile: { ...DEFAULT_LOSSES },
  selectedModuleId: null,
  inverters: [],
  prCalculationMode: 'additive', // Default per user request

  setPrCalculationMode: (mode) => set({ prCalculationMode: mode }),

  setSelectedModuleId: (id) => set({ selectedModuleId: id }),

  addInverter: (equipment) => {
      const newInverter: InverterState = {
          id: Math.random().toString(36).substr(2, 9),
          catalogId: equipment.id,
          quantity: 1,
          mpptConfigs: createDefaultMPPTConfig(equipment.mppts || 1),
          snapshot: {
              model: equipment.model,
              nominalPower: equipment.nominalPower,
              mppts: equipment.mppts || 1
          },

      };

      set(state => ({ inverters: [...state.inverters, newInverter] }));
  },

  removeInverter: (id) => set(state => ({
      inverters: state.inverters.filter(i => i.id !== id)
  })),

  updateInverterQuantity: (id, qty) => set(state => ({
      inverters: state.inverters.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)
  })),



  updateMPPTConfig: (inverterId, mpptId, config) => set(state => ({
      inverters: state.inverters.map(inv => {
          if (inv.id !== inverterId) return inv;
          return {
              ...inv,
              mpptConfigs: inv.mpptConfigs.map(sc => 
                  sc.mpptId === mpptId ? { ...sc, ...config } : sc
              )
          };
      })
  })),

  updateLoss: (key, value) => set((state) => ({
    lossProfile: {
      ...state.lossProfile,
      [key]: value
    }
  })),

  resetLosses: () => set({ lossProfile: { ...DEFAULT_LOSSES } }),

  resetProject: () => set({
      lossProfile: { ...DEFAULT_LOSSES },
      inverters: [],
      selectedModuleId: null,
      prCalculationMode: 'additive'
  }),

  getPerformanceRatio: () => {
    const { lossProfile } = get();
    
    // Extract efficiency (which is a multiplier)
    const effInverterDecimal = lossProfile.inverterEfficiency / 100;

    const losses = [
        lossProfile.soiling,
        lossProfile.mismatch,
        lossProfile.dcCable,
        lossProfile.acCable,
        lossProfile.shading,
        lossProfile.orientation, 
        lossProfile.inclination,
        lossProfile.horizon,
        lossProfile.temperature
    ];

    // Calculate Product(1 - loss)
    const totalLossFactor = losses.reduce((acc, lossVal) => {
        const lossDecimal = lossVal / 100;
        return acc * (1 - lossDecimal);
    }, 1.0);

    return effInverterDecimal * totalLossFactor;
  },

  getDCACRatio: (totalModulePowerW) => {
      const { inverters } = get();
      if (inverters.length === 0) return 0;

      const totalAcPowerW = inverters.reduce((acc, inv) => {
          return acc + (inv.snapshot.nominalPower * inv.quantity);
      }, 0);

      if (totalAcPowerW === 0) return 0;
      return totalModulePowerW / totalAcPowerW;
  },

  getAdditivePerformanceRatio: () => {
    const { lossProfile } = get();
    
    // Convert Inverter Efficiency to Loss (e.g., 98% -> 2%)
    const invLoss = 100 - lossProfile.inverterEfficiency;
    
    const totalLossSum = 
        lossProfile.soiling +
        lossProfile.mismatch +
        lossProfile.dcCable +
        lossProfile.acCable +
        lossProfile.shading +
        lossProfile.orientation + 
        lossProfile.inclination +
        lossProfile.horizon +
        lossProfile.temperature +
        invLoss;

    // Return remaining percentage as decimal (e.g. 26.25% loss -> 0.7375)
    return Math.max(0, (100 - totalLossSum) / 100);
  }
}));


