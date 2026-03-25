import { create } from 'zustand';
import { NormalizedCollection, createEmptyCollection } from '@/core/types/normalized.types';

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

export interface LogicalString {
    id: string;
    name: string;
    mpptId: string | null; // "inverterId:mpptId"
    moduleIds: string[];
}

export interface MPPTConfig {
    mpptId: number;
    stringIds: string[]; // V4: Array de IDs das Strings atribuídas
    stringsCount: number; // Mapeado para retro-compatibilidade temporária
    modulesPerString: number; // Mapeado para retro-compatibilidade 
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

export interface Inverter { id?: string; manufacturer: string; model: string; nominalPower: number; mppts?: number; connectionType: string; maxInputVoltage?: number; [key: string]: any; }

interface TechState {
  lossProfile: LossProfile;
  selectedModuleId: string | null;
  
  // Inverters State (PRÉ-1: normalizado)
  inverters: NormalizedCollection<InverterState>;
  strings: NormalizedCollection<LogicalString>; // V4: Strings Lógicas
  
  // Actions
  updateLoss: (key: keyof LossProfile, value: number) => void;
  resetLosses: () => void;
  resetProject: () => void;
  setSelectedModuleId: (id: string | null) => void;
  
  // Inverter Actions
  addInverter: (equipment: any, providedId?: string) => void;
  removeInverter: (id: string) => void;
  updateInverterQuantity: (id: string, qty: number) => void;

  updateMPPTConfig: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  
  // V4 String Actions
  createString: (moduleIds: string[]) => void;
  deleteString: (stringId: string) => void;
  addModulesToString: (stringId: string, moduleIds: string[]) => void;
  removeModulesFromString: (stringId: string, moduleIds: string[]) => void;
  assignStringToMPPT: (stringId: string, inverterId: string, mpptId: number) => void;
  unassignStringFromMPPT: (stringId: string) => void;
  assignModulesToNewString: (moduleIds: string[], inverterId: string, mpptId: number) => void;
  assignStringToInverterFallback: (stringId: string, inverterId: string) => void;
  
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
        stringIds: [],
        stringsCount: 0,
        modulesPerString: 0
    }));
};



export const useTechStore = create<TechState>((set, get) => ({
  lossProfile: { ...DEFAULT_LOSSES },
  selectedModuleId: null,
  inverters: createEmptyCollection<InverterState>(),
  strings: createEmptyCollection<LogicalString>(),
  prCalculationMode: 'additive', // Default per user request

  setPrCalculationMode: (mode) => set({ prCalculationMode: mode }),

  setSelectedModuleId: (id) => set({ selectedModuleId: id }),

  addInverter: (equipment, providedId) => {
      const newInverter: InverterState = {
          id: providedId || Math.random().toString(36).substr(2, 9),
          catalogId: equipment.id || '',
          quantity: 1,
          mpptConfigs: createDefaultMPPTConfig(equipment.mppts || 1),
          snapshot: {
              model: equipment.model,
              nominalPower: equipment.nominalPower,
              mppts: equipment.mppts || 1
          },
      };

      set(state => ({
        inverters: {
          ids: [...state.inverters.ids, newInverter.id],
          entities: { ...state.inverters.entities, [newInverter.id]: newInverter },
        },
      }));
  },

  removeInverter: (id) => set(state => {
      const { [id]: _, ...remaining } = state.inverters.entities;
      return {
        inverters: {
          ids: state.inverters.ids.filter(existingId => existingId !== id),
          entities: remaining,
        },
      };
  }),

  updateInverterQuantity: (id, qty) => set(state => ({
      inverters: {
        ...state.inverters,
        entities: {
          ...state.inverters.entities,
          [id]: { ...state.inverters.entities[id], quantity: Math.max(1, qty) },
        },
      },
  })),



  updateMPPTConfig: (inverterId, mpptId, config) => set(state => {
      const inv = state.inverters.entities[inverterId];
      if (!inv) return state;
      return {
        inverters: {
          ...state.inverters,
          entities: {
            ...state.inverters.entities,
            [inverterId]: {
              ...inv,
              mpptConfigs: inv.mpptConfigs.map(sc =>
                sc.mpptId === mpptId ? { ...sc, ...config } : sc
              ),
            },
          },
        },
      };
  }),

  updateLoss: (key, value) => set((state) => ({
    lossProfile: {
      ...state.lossProfile,
      [key]: value
    }
  })),

  resetLosses: () => set({ lossProfile: { ...DEFAULT_LOSSES } }),

  resetProject: () => set({
      lossProfile: { ...DEFAULT_LOSSES },
      inverters: createEmptyCollection<InverterState>(),
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
      const inverterList = Object.values(inverters.entities);
      if (inverterList.length === 0) return 0;

      const totalAcPowerW = inverterList.reduce((acc, inv) => {
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
  },

  // ─── V4: String Actions ────────────────────────────────────────────────
  createString: (moduleIds) => set((state) => {
      const id = 'str-' + Math.random().toString(36).substring(2, 9);
      const newStringCount = state.strings.ids.length + 1;
      const newString: LogicalString = {
          id,
          name: `String ${newStringCount}`,
          mpptId: null,
          moduleIds
      };
      
      return {
          strings: {
              ids: [...state.strings.ids, id],
              entities: { ...state.strings.entities, [id]: newString }
          }
      };
  }),

  deleteString: (stringId) => set((state) => {
      const stringEntity = state.strings.entities[stringId];
      if (!stringEntity) return state;

      // Se estivesse usando get() precisaria puxar de fora, 
      // mas como o unassign faria um segundo set(), faremos a lógica aqui inline para manter atômico:
      let invertersUpdate = state.inverters;
      
      if (stringEntity.mpptId) {
          const [inverterId, mpptIdStr] = stringEntity.mpptId.split(':');
          const mpptId = parseInt(mpptIdStr);
          const inv = state.inverters.entities[inverterId];
          
          if (inv) {
              const newMpptConfigs = inv.mpptConfigs.map(m => {
                  if (m.mpptId === mpptId) {
                      const newStringIds = m.stringIds.filter(id => id !== stringId);
                      return { 
                          ...m, 
                          stringIds: newStringIds,
                          stringsCount: newStringIds.length
                      };
                  }
                  return m;
              });

              invertersUpdate = {
                  ...state.inverters,
                  entities: {
                      ...state.inverters.entities,
                      [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
                  }
              };
          }
      }

      const newEntities = { ...state.strings.entities };
      delete newEntities[stringId];

      return {
          strings: {
              ids: state.strings.ids.filter(id => id !== stringId),
              entities: newEntities
          },
          inverters: invertersUpdate
      };
  }),

  addModulesToString: (stringId, moduleIds) => set((state) => {
      const str = state.strings.entities[stringId];
      if (!str) return state;
      return {
          strings: {
              ...state.strings,
              entities: {
                  ...state.strings.entities,
                  [stringId]: {
                      ...str,
                      moduleIds: Array.from(new Set([...str.moduleIds, ...moduleIds]))
                  }
              }
          }
      };
  }),

  removeModulesFromString: (stringId, moduleIdsToRemove) => set((state) => {
      const str = state.strings.entities[stringId];
      if (!str) return state;

      const newModuleIds = str.moduleIds.filter(id => !moduleIdsToRemove.includes(id));

      return {
          strings: {
              ...state.strings,
              entities: {
                  ...state.strings.entities,
                  [stringId]: {
                      ...str,
                      moduleIds: newModuleIds
                  }
              }
          }
      };
  }),

  assignStringToMPPT: (stringId, inverterId, mpptId) => set((state) => {
      const str = state.strings.entities[stringId];
      const inv = state.inverters.entities[inverterId];
      if (!str || !inv) return state;

      const mpptRef = `${inverterId}:${mpptId}`;

      const newMpptConfigs = inv.mpptConfigs.map(m => {
          if (m.mpptId === mpptId) {
              const newStringIds = Array.from(new Set([...m.stringIds, stringId]));
              return { 
                  ...m, 
                  stringIds: newStringIds,
                  stringsCount: newStringIds.length
              };
          }
          return m;
      });

      return {
          strings: {
              ...state.strings,
              entities: {
                  ...state.strings.entities,
                  [stringId]: { ...str, mpptId: mpptRef }
              }
          },
          inverters: {
              ...state.inverters,
              entities: {
                  ...state.inverters.entities,
                  [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
              }
          }
      };
  }),

  unassignStringFromMPPT: (stringId) => set((state) => {
      const str = state.strings.entities[stringId];
      if (!str || !str.mpptId) return state;

      const [inverterId, mpptIdStr] = str.mpptId.split(':');
      const mpptId = parseInt(mpptIdStr);
      const inv = state.inverters.entities[inverterId];

      let invertersUpdate = state.inverters;

      if (inv) {
          const newMpptConfigs = inv.mpptConfigs.map(m => {
              if (m.mpptId === mpptId) {
                  const newStringIds = m.stringIds.filter(id => id !== stringId);
                  return { 
                      ...m, 
                      stringIds: newStringIds,
                      stringsCount: newStringIds.length
                  };
              }
              return m;
          });

          invertersUpdate = {
              ...state.inverters,
              entities: {
                  ...state.inverters.entities,
                  [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
              }
          };
      }

      return {
          strings: {
              ...state.strings,
              entities: {
                  ...state.strings.entities,
                  [stringId]: { ...str, mpptId: null }
              }
          },
          inverters: invertersUpdate
      };
  }),

  assignModulesToNewString: (moduleIds, inverterId, mpptId) => set((state) => {
      const inv = state.inverters.entities[inverterId];
      if (!inv) return state;

      const newStringId = 'str-' + Math.random().toString(36).substring(2, 9);
      const mpptRef = `${inverterId}:${mpptId}`;

      const newString: LogicalString = {
          id: newStringId,
          name: `String ${state.strings.ids.length + 1}`,
          mpptId: mpptRef,
          moduleIds
      };

      const newMpptConfigs = inv.mpptConfigs.map(m => {
          if (m.mpptId === mpptId) {
              const newStringIds = Array.from(new Set([...m.stringIds, newStringId]));
              return { 
                  ...m, 
                  stringIds: newStringIds,
                  stringsCount: newStringIds.length
              };
          }
          return m;
      });

      return {
          strings: {
              ids: [...state.strings.ids, newStringId],
              entities: {
                  ...state.strings.entities,
                  [newStringId]: newString
              }
          },
          inverters: {
              ...state.inverters,
              entities: {
                  ...state.inverters.entities,
                  [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
              }
          }
      };
  }),

  assignStringToInverterFallback: (stringId, inverterId) => set((state) => {
      const str = state.strings.entities[stringId];
      const inv = state.inverters.entities[inverterId];
      if (!str || !inv || inv.mpptConfigs.length === 0) return state;

      // Se a string já tinha um MPPT em OUTRO ou no MESMO inversor, teríamos que limpar primeiro.
      // Assumiremos que esta action é chamada prioritariamente para "Strings Desconectadas"
      
      const targetMppt = inv.mpptConfigs[0].mpptId;
      const mpptRef = `${inverterId}:${targetMppt}`;

      const newMpptConfigs = inv.mpptConfigs.map(m => {
          if (m.mpptId === targetMppt) {
              const newStringIds = Array.from(new Set([...m.stringIds, stringId]));
              return { 
                  ...m, 
                  stringIds: newStringIds,
                  stringsCount: newStringIds.length
              };
          }
          return m;
      });

      return {
          strings: {
              ...state.strings,
              entities: {
                  ...state.strings.entities,
                  [stringId]: { ...str, mpptId: mpptRef }
              }
          },
          inverters: {
              ...state.inverters,
              entities: {
                  ...state.inverters.entities,
                  [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
              }
          }
      };
  }),

  // -- Computeds --
}));
