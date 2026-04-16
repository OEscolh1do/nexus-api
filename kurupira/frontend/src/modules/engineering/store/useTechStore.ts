import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    catalogId: string; // Ref to useCatalogStore inverter id
    quantity: number;
    mpptConfigs: MPPTConfig[]; // Array of MPPT configs
    snapshot: {
        model: string;
        nominalPower: number;
        mppts: number;
        maxInputVoltage: number;
        minMpptVoltage: number;
        maxMpptVoltage: number;
        maxCurrentPerMPPT: number;
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
  duplicateInverter: (id: string) => void;
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
  removeModules: (moduleIds: string[]) => void;
  
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

export const useTechStore = create<TechState>()(
  persist(
    (set, get) => ({
      lossProfile: { ...DEFAULT_LOSSES },
      selectedModuleId: null,
      inverters: createEmptyCollection<InverterState>(),
      strings: createEmptyCollection<LogicalString>(),
      prCalculationMode: 'additive', // Default per user request

      setPrCalculationMode: (mode) => set({ prCalculationMode: mode }),

      setSelectedModuleId: (id) => set({ selectedModuleId: id }),

      addInverter: (equipment, providedId) => set(state => {
          // Defensivo: mppts pode vir como array (CatalogStore) ou number (adapter/SolarStore)
          const mpptCount = Array.isArray(equipment.mppts)
              ? equipment.mppts.length
              : (equipment.mppts || 1);
          // Defensivo: nominalPower (kW) ou nominalPowerW (W)
          const nominalPower = equipment.nominalPower
              || (equipment.nominalPowerW ? equipment.nominalPowerW / 1000 : 0);

          const qty = equipment.quantity || 1;
          const newEntities = { ...state.inverters.entities };
          const newIds = [...state.inverters.ids];

          for (let i = 0; i < qty; i++) {
              const instanceId = i === 0 && providedId ? providedId : Math.random().toString(36).substr(2, 9);
              const newInverter: InverterState = {
                  id: instanceId,
                  catalogId: equipment.id || '',
                  quantity: 1, // Fix: O inventário será sempre 1 por unidade para inverters
                  mpptConfigs: createDefaultMPPTConfig(mpptCount),
                  snapshot: {
                      model: equipment.model,
                      nominalPower,
                      mppts: mpptCount,
                      // Lendo limites do catálogo com valores padrão de segurança conservadores
                      maxInputVoltage: equipment.maxInputVoltage || equipment.maxInputV || 600,
                      minMpptVoltage: equipment.minMpptVoltage || equipment.mpptMinV || 150,
                      maxMpptVoltage: equipment.maxMpptVoltage || equipment.mpptMaxV || 500,
                      maxCurrentPerMPPT: equipment.maxCurrentPerMPPT || equipment.maxCurrent || 15,
                  },
              };
              newIds.push(instanceId);
              newEntities[instanceId] = newInverter;
          }

          return {
            inverters: {
              ids: newIds,
              entities: newEntities,
            },
          };
      }),

      removeInverter: (id) => set(state => {
          const { [id]: _, ...remaining } = state.inverters.entities;
          return {
            inverters: {
              ids: state.inverters.ids.filter(existingId => existingId !== id),
              entities: remaining,
            },
          };
      }),

      duplicateInverter: (id) => set(state => {
          const source = state.inverters.entities[id];
          if (!source) return state;

          const newId = Math.random().toString(36).substr(2, 9);
          const cloned: InverterState = {
            ...source,
            id: newId,
            mpptConfigs: source.mpptConfigs.map(m => ({
              ...m,
              stringIds: [],
              stringsCount: 0,
            })),
          };

          return {
            inverters: {
              ids: [...state.inverters.ids, newId],
              entities: { ...state.inverters.entities, [newId]: cloned },
            },
          };
      }),

      updateInverterQuantity: (id, targetQty) => set(state => {
          const baseInstance = state.inverters.entities[id];
          if (!baseInstance) return state;

          const modelName = baseInstance.snapshot?.model || baseInstance.catalogId;
          const allInstancesOfModel = state.inverters.ids.filter(
              i => (state.inverters.entities[i]?.snapshot?.model || state.inverters.entities[i]?.catalogId) === modelName
          );
          const currentQty = allInstancesOfModel.length;

          if (targetQty === currentQty) return state;

          const newEntities = { ...state.inverters.entities };
          let newIds = [...state.inverters.ids];

          if (targetQty > currentQty) {
              const diff = targetQty - currentQty;
              for (let i = 0; i < diff; i++) {
                  const newId = Math.random().toString(36).substr(2, 9);
                  newIds.push(newId);
                  newEntities[newId] = { 
                      ...baseInstance, 
                      id: newId,
                      // Reseta o mpptConfigs criando um deep clone fresquinho
                      mpptConfigs: baseInstance.mpptConfigs.map(m => ({ ...m, stringIds: [] }))
                  };
              }
          } else {
              // Remove LIFO (Last In First Out)
              const diff = currentQty - targetQty;
              const idsToRemove = allInstancesOfModel.slice(-diff);
              newIds = newIds.filter(i => !idsToRemove.includes(i));
              idsToRemove.forEach(i => delete newEntities[i]);
          }

          return {
            inverters: {
              ids: newIds,
              entities: newEntities,
            },
          };
      }),

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
          strings: createEmptyCollection<LogicalString>(),
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

      removeModules: (moduleIdsToRemove) => set((state) => {
          const newStrings = { ...state.strings.entities };
          let changed = false;

          state.strings.ids.forEach(sid => {
              const str = newStrings[sid];
              if (!str) return;
              const filtered = str.moduleIds.filter(mid => !moduleIdsToRemove.includes(mid));
              if (filtered.length !== str.moduleIds.length) {
                  newStrings[sid] = { ...str, moduleIds: filtered };
                  changed = true;
              }
          });

          if (!changed) return state;

          return {
              strings: {
                  ...state.strings,
                  entities: newStrings
              }
          };
      }),
    }),
    { name: 'kurupira-tech-storage' }
  )
);
