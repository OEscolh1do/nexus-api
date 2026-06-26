import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NormalizedCollection, createEmptyCollection } from '@/core/types/normalized.types';
import type { ParametricSymbolConfig } from '@/core/schemas/inverterSchema';
import { useSolarStore } from '@/core/state/solarStore';

/** Generates a short unique ID using crypto.randomUUID() truncated to 9 chars */
const genId = (): string => {
  try {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 9);
  } catch {
    // Fallback for environments without crypto.randomUUID
    return Math.random().toString(36).substring(2, 9);
  }
};

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

/**
 * @deprecated Legacy V4 string system — migrate to StringDef V5 (mpptConfig.strings[])
 *
 * This interface represents the old string system where strings were stored
 * separately and referenced by ID in mpptConfig.stringIds.
 *
 * **Migration Path:**
 * - V4: `strings: NormalizedCollection<LogicalString>` + `mpptConfig.stringIds: string[]`
 * - V5: `mpptConfig.strings: StringDef[]` (embedded, no external references)
 *
 * Use V5's StringDef for new code. V4 will be removed in a future release.
 */
export interface LogicalString {
    id: string;
    name: string;
    mpptId: string | null; // "inverterId:mpptId"
    moduleIds: string[];
}

export interface StringDef {
    id: string; // ID único interno
    name: string; // Nome de Anilha executiva (ex: INV-01.M1.S1)
    modulesCount: number;
    cableLength: number;
    cableSection: number;
    azimuth?: number;
    inclination?: number;
}

export interface MPPTConfig {
    mpptId: number;
    /** @deprecated V4 legacy field — use `strings: StringDef[]` instead */
    stringIds: string[]; // V4: Array de IDs das Strings atribuídas
    /** @deprecated V4 legacy field — use `strings.length` instead */
    stringsCount?: number; // Mapeado para retro-compatibilidade temporária
    /** @deprecated V4 legacy field — use `strings[i].modulesCount` instead */
    modulesPerString?: number; // Mapeado para retro-compatibilidade
    azimuth?: number; // Advanced: MPPTs can face different directions
    inclination?: number;
    cableLength?: number; // [LEGACY] Comprimento do cabo CC (m)
    cableSection?: number; // [LEGACY] Seção nominal (mm²)
    strings: StringDef[]; // [V5] Strings locais do MPPT para engenharia (current standard)
    moduleModel?: string; // [V6] Modelo do módulo específico para este MPPT
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
        maxInputCurrent: number;
        maxEfficiency: number;
        maxOutputPowerW?: number;
        deratingTempC?: number;
        symbolConfig?: ParametricSymbolConfig | null;       // PSB: @deprecated
        // New topology engine — seeded from catalog.typologyConfig when inverter is added
        typologyConfig?: Record<string, unknown> | null;
    };
}


export interface Inverter { id?: string; manufacturer: string; model: string; nominalPower: number; mppts?: number; connectionType: string; maxInputVoltage?: number; [key: string]: any; }

interface TechState {
  lossProfile: LossProfile;
  selectedModuleId: string | null;
  cosip: number; // R$ Iluminação Pública

  // Inverters State (PRÉ-1: normalizado)
  inverters: NormalizedCollection<InverterState>;
  /** @deprecated V4 legacy — use mpptConfig.strings (StringDef[]) instead */
  strings: NormalizedCollection<LogicalString>; // V4: Strings Lógicas

  // Project-level topology pre-seeded from the first inverter's catalog typologyConfig.
  // Null until an inverter with a typologyConfig is added.
  // Will be the starting point for Kurupira's future TopologyEditor integration.
  projectTopologyConfig: Record<string, unknown> | null;

  // Actions
  updateLoss: (key: keyof LossProfile, value: number) => void;
  resetLosses: () => void;
  resetProject: () => void;
  setSelectedModuleId: (id: string | null) => void;
  setCosip: (val: number) => void;
  setProjectTopologyConfig: (config: Record<string, unknown> | null) => void;
  
  // Inverter Actions
  addInverter: (equipment: any, providedId?: string) => void;
  removeInverter: (id: string) => void;
  duplicateInverter: (id: string) => void;
  updateInverterQuantity: (id: string, qty: number) => void;

  updateMPPTConfig: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;

  // V5: Exec MPPT Strings Actions
  addStringToMPPT: (inverterId: string, mpptId: number) => void;
  removeStringFromMPPT: (inverterId: string, mpptId: number, stringId: string) => void;
  updateStringInMPPT: (inverterId: string, mpptId: number, stringId: string, data: Partial<StringDef>) => void;
  /** Reseta configuração de um MPPT para estado inicial (1 string vazia) */
  resetMPPT: (inverterId: string, mpptId: number) => void;
  autoDistributeModules: (inverterId: string, targetModules: number, maxPerString: number) => { success: boolean; message: string };

  /** Called by SolarStore after assigning modules to update StringDef.modulesCount automatically */
  syncStringModulesCount: (inverterId: string, mpptId: number, stringId: string | undefined, count: number) => void;
  /** Reset all StringDef.modulesCount to 0 for an inverter (called by clearStringAssignments) */
  resetStringCounts: (inverterId?: string) => void;

  // ═══════════════════════════════════════════════════════════════════════════
  // V4 String Actions — DEPRECATED
  // ═══════════════════════════════════════════════════════════════════════════
  // The following methods operate on the legacy `strings: NormalizedCollection<LogicalString>`
  // system where strings are stored separately and referenced by ID.
  //
  // **Migration to V5:**
  // Instead of manipulating `state.strings` + `mpptConfig.stringIds`, use:
  // - `addStringToMPPT(inverterId, mpptId)` — adds a StringDef to mppt.strings[]
  // - `updateStringInMPPT(inverterId, mpptId, stringId, data)` — updates a StringDef
  // - `removeStringFromMPPT(inverterId, mpptId, stringId)` — removes a StringDef
  //
  // V4 will be removed in a future release.
  // ═══════════════════════════════════════════════════════════════════════════

  /** @deprecated Use addStringToMPPT + updateStringInMPPT instead */
  createString: (moduleIds: string[]) => void;
  /** @deprecated Use removeStringFromMPPT instead */
  deleteString: (stringId: string) => void;
  /** @deprecated Use updateStringInMPPT to modify StringDef.modulesCount */
  addModulesToString: (stringId: string, moduleIds: string[]) => void;
  /** @deprecated Use updateStringInMPPT to modify StringDef.modulesCount */
  removeModulesFromString: (stringId: string, moduleIds: string[]) => void;
  /** @deprecated Use addStringToMPPT or move existing StringDef in mppt.strings[] */
  assignStringToMPPT: (stringId: string, inverterId: string, mpptId: number) => void;
  /** @deprecated Use removeStringFromMPPT instead */
  unassignStringFromMPPT: (stringId: string) => void;
  /** @deprecated Use addStringToMPPT + updateStringInMPPT instead */
  assignModulesToNewString: (moduleIds: string[], inverterId: string, mpptId: number) => void;
  /** @deprecated Use addStringToMPPT to add StringDef to first MPPT */
  assignStringToInverterFallback: (stringId: string, inverterId: string) => void;
  /** @deprecated Manage module assignments via solarStore or update StringDef.modulesCount directly */
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
        stringsCount: 1,
        modulesPerString: 0,
        strings: [{
            id: genId(),
            name: `S1`,
            modulesCount: 0,
            cableLength: 10,
            cableSection: 4
        }],
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
      cosip: 35.00,
      projectTopologyConfig: null,

      setPrCalculationMode: (mode) => set({ prCalculationMode: mode }),

      setSelectedModuleId: (id) => set({ selectedModuleId: id }),

      setCosip: (val) => set({ cosip: val }),

      setProjectTopologyConfig: (config) => set({ projectTopologyConfig: config }),

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
              const instanceId = i === 0 && providedId ? providedId : genId();
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
                      maxInputVoltage: equipment.Voc_max_hardware || equipment.maxInputVoltage || equipment.maxInputV || 600,
                      minMpptVoltage: equipment.mppts?.[0]?.minMpptVoltage || equipment.minMpptVoltage || equipment.mpptMinV || 150,
                      maxMpptVoltage: equipment.mppts?.[0]?.maxMpptVoltage || equipment.maxMpptVoltage || equipment.mpptMaxV || 500,
                      maxCurrentPerMPPT: equipment.mppts?.[0]?.maxCurrentPerMPPT || equipment.maxCurrentPerMPPT || equipment.maxCurrent || 15,
                      maxInputCurrent: equipment.Isc_max_hardware || equipment.maxInputCurrent || ((equipment.mppts?.[0]?.maxCurrentPerMPPT || 15) * mpptCount) || 30,
                      maxEfficiency: equipment.efficiency?.euro || equipment.efficiency?.cec || equipment.maxEfficiency || 98.0,
                      maxOutputPowerW: equipment.maxOutputPowerW,
                      deratingTempC: equipment.deratingTempC,
                      symbolConfig: equipment.symbolConfig ?? null,       // PSB @deprecated
                      typologyConfig: (equipment as any).typologyConfig ?? null,
                  },
              };
              newIds.push(instanceId);
              newEntities[instanceId] = newInverter;
          }

          // Seed project topology from the first inverter that has one,
          // only if no project topology has been set yet.
          const firstTypology = (equipment as any).typologyConfig ?? null;
          const shouldSeed = firstTypology && state.projectTopologyConfig === null;

          return {
            inverters: { ids: newIds, entities: newEntities },
            ...(shouldSeed && { projectTopologyConfig: firstTypology }),
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

          const newId = genId();
          const cloned: InverterState = {
            ...source,
            id: newId,
            mpptConfigs: source.mpptConfigs.map(m => ({
              ...m,
              stringIds: [],
              stringsCount: 1,
              strings: [{
                id: genId(),
                name: `S1`,
                modulesCount: 0,
                cableLength: 10,
                cableSection: 4
              }]
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
                  const newId = genId();
                  newIds.push(newId);
                  newEntities[newId] = { 
                      ...baseInstance, 
                      id: newId,
                      // Deep Clone e Isolamento de Strings (V5)
                      mpptConfigs: baseInstance.mpptConfigs.map(m => ({
                          ...m,
                          stringIds: [],
                          strings: (m.strings || []).map(s => ({
                              ...s,
                              id: genId(),
                              modulesCount: 0 // Instâncias adicionais começam limpas
                          }))
                      }))
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

      addStringToMPPT: (inverterId, mpptId) => set(state => {
        const inv = state.inverters.entities[inverterId];
        if (!inv) return state;
        
        const invIndex = state.inverters.ids.indexOf(inverterId) + 1;
        const formattedInvId = invIndex.toString().padStart(2, '0');
        
        const newMpptConfigs = inv.mpptConfigs.map(mppt => {
          if (mppt.mpptId === mpptId) {
            // Busca o maior índice Z na nomenclatura INV-XX.MY.SZ atual para evitar duplicatas ao remover/adicionar
            const existingIndices = (mppt.strings || []).map(s => {
               const match = s.name.match(/\.S(\d+)$/);
               return match ? parseInt(match[1], 10) : 0;
            });
            const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;

            const newString: StringDef = {
              id: genId(),
              name: `INV-${formattedInvId}.M${mpptId}.S${nextIndex}`,
              modulesCount: 0,
              cableLength: 10,
              cableSection: 4
            };
            return {
              ...mppt,
              strings: [...(mppt.strings || []), newString],
              stringsCount: (mppt.strings || []).length + 1,
            };
          }
          return mppt;
        });

        return {
          inverters: {
            ...state.inverters,
            entities: {
              ...state.inverters.entities,
              [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
            }
          }
        };
      }),

      removeStringFromMPPT: (inverterId, mpptId, stringId) => set(state => {
        const inv = state.inverters.entities[inverterId];
        if (!inv) return state;

        const newMpptConfigs = inv.mpptConfigs.map(mppt => {
          if (mppt.mpptId === mpptId) {
            const newStrings = (mppt.strings || []).filter(s => s.id !== stringId);
            return {
              ...mppt,
              strings: newStrings,
              stringsCount: newStrings.length,
            };
          }
          return mppt;
        });

        return {
          inverters: {
            ...state.inverters,
            entities: {
              ...state.inverters.entities,
              [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
            }
          }
        };
      }),

      resetMPPT: (inverterId, mpptId) => set(state => {
        const inv = state.inverters.entities[inverterId];
        if (!inv) return state;

        const newMpptConfigs = inv.mpptConfigs.map(mppt => {
          if (mppt.mpptId !== mpptId) return mppt;
          return {
            ...mppt,
            strings: [{
              id: genId(),
              name: `INV-${inverterId.slice(-3)}.M${mpptId}.S1`,
              modulesCount: 0,
              cableLength: mppt.strings?.[0]?.cableLength ?? 10,
              cableSection: mppt.strings?.[0]?.cableSection ?? 4,
            }],
            stringsCount: 0,
            modulesPerString: 0,
          };
        });

        return {
          inverters: {
            ...state.inverters,
            entities: {
              ...state.inverters.entities,
              [inverterId]: { ...inv, mpptConfigs: newMpptConfigs },
            },
          },
        };
      }),

      updateStringInMPPT: (inverterId, mpptId, stringId, data) => set(state => {
        const inv = state.inverters.entities[inverterId];
        if (!inv) return state;

        const newMpptConfigs = inv.mpptConfigs.map(mppt => {
          if (mppt.mpptId === mpptId) {
            const newStrings = (mppt.strings || []).map(s =>
              s.id === stringId ? { ...s, ...data } : s
            );
            return { ...mppt, strings: newStrings };
          }
          return mppt;
        });

        return {
          inverters: {
            ...state.inverters,
            entities: {
              ...state.inverters.entities,
              [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
            }
          }
        };
      }),

      syncStringModulesCount: (inverterId, mpptId, stringId, count) => set(state => {
        const inv = state.inverters.entities[inverterId];
        if (!inv) return state;

        const newMpptConfigs = inv.mpptConfigs.map(mppt => {
          if (mppt.mpptId !== mpptId) return mppt;

          let strings = [...(mppt.strings || [])];

          if (stringId) {
            // Find by id or name
            const idx = strings.findIndex(s => s.id === stringId || s.name === stringId);
            if (idx >= 0) {
              // Found: update count
              strings = strings.map((s, i) => i === idx ? { ...s, modulesCount: count } : s);
            } else {
              // R4-07: Guard against race condition — check if another concurrent call already created it
              const existingByName = strings.find(s => s.name === stringId);
              if (existingByName) {
                // Race condition detected: use existing StringDef
                strings = strings.map(s =>
                  s.name === stringId ? { ...s, modulesCount: count } : s
                );
              } else {
                // Safe to create new — no race condition
                const freshId = genId();
                const zeroIdx = strings.findIndex(s => s.modulesCount === 0);

                // R5-01: Double-check após findIndex (window de concorrência Zustand)
                const secondCheck = strings.find(s => s.name === stringId);
                if (secondCheck) {
                  strings = strings.map(s => s.name === stringId ? { ...s, modulesCount: count } : s);
                } else if (zeroIdx >= 0) {
                  strings = strings.map((s, i) =>
                    i === zeroIdx ? { ...s, id: freshId, name: stringId, modulesCount: count } : s
                  );
                } else {
                  strings = [...strings, {
                    id: freshId,
                    name: stringId,
                    modulesCount: count,
                    cableLength: strings[0]?.cableLength ?? 10,
                    cableSection: strings[0]?.cableSection ?? 4,
                  }];
                }
              }
            }
          } else {
            // No stringId: update first StringDef's count
            if (strings.length > 0) {
              strings = [{ ...strings[0], modulesCount: count }, ...strings.slice(1)];
            }
          }

          // Also keep legacy fields in sync for backward compatibility
          const totalModules = strings.reduce((acc, s) => acc + s.modulesCount, 0);
          return {
            ...mppt,
            strings,
            modulesPerString: strings.length > 0 ? Math.ceil(totalModules / Math.max(strings.length, 1)) : mppt.modulesPerString,
            stringsCount: strings.filter(s => s.modulesCount > 0).length || mppt.stringsCount,
          };
        });

        return {
          inverters: {
            ...state.inverters,
            entities: {
              ...state.inverters.entities,
              [inverterId]: { ...inv, mpptConfigs: newMpptConfigs },
            },
          },
        };
      }),

      resetStringCounts: (inverterId?) => set(state => {
        const ids = inverterId ? [inverterId] : state.inverters.ids;
        const newEntities = { ...state.inverters.entities };

        ids.forEach(id => {
          const inv = state.inverters.entities[id];
          if (!inv) return;
          newEntities[id] = {
            ...inv,
            mpptConfigs: inv.mpptConfigs.map(mppt => {
              const strings = mppt.strings || [];
              // Zero all counts first
              const zeroed = strings.map(s => ({ ...s, modulesCount: 0 }));
              // Remove auto-generated ones (name starts with "String ") — they'll be recreated on next stringing
              const filtered = zeroed.filter(s => !s.name.startsWith('String '));
              // Always keep at least one StringDef per MPPT
              if (filtered.length > 0) {
                return { ...mppt, strings: filtered, modulesPerString: 0, stringsCount: 0 };
              }
              // All were auto-generated — keep one default
              return {
                ...mppt,
                strings: [{
                  id: genId(),
                  name: 'S1',
                  modulesCount: 0,
                  cableLength: 10,
                  cableSection: 4,
                }],
                modulesPerString: 0,
                stringsCount: 0,
              };
            }),
          };
        });

        return { inverters: { ...state.inverters, entities: newEntities } };
      }),

      autoDistributeModules: (inverterId, targetModules, maxPerString) => {
          let success = false;
          let message = 'Erro ao distribuir módulos.';
          
          set(state => {
              const inv = state.inverters.entities[inverterId];
              if (!inv || inv.mpptConfigs.length === 0) {
                  message = 'Inversor não encontrado.';
                  return state;
              }

              if (targetModules === 0) {
                  const newMpptConfigs = inv.mpptConfigs.map(mppt => ({
                      ...mppt,
                      stringsCount: 1,
                      strings: [{
                          id: genId(),
                          name: `INV.M${mppt.mpptId}.S1`,
                          modulesCount: 0,
                          cableLength: 10,
                          cableSection: 4
                      }]
                  }));
                  success = true;
                  message = 'Módulos zerados com sucesso.';
                  return {
                      inverters: {
                          ...state.inverters,
                          entities: { ...state.inverters.entities, [inverterId]: { ...inv, mpptConfigs: newMpptConfigs } }
                      }
                  };
              }

              const mpptCount = inv.mpptConfigs.length;
              let k = Array(mpptCount).fill(1);
              let bestDistribution: { stringsCount: number, size: number }[] | null = null;

              // Tenta achar a topologia
              for (let iter = 0; iter < 100; iter++) {
                  let totalStrings = k.reduce((a, b) => a + b, 0);
                  let S = Array(mpptCount).fill(Math.floor(targetModules / totalStrings));
                  let allocated = S.reduce((sum, size, idx) => sum + size * k[idx], 0);
                  let remaining = targetModules - allocated;
                  
                  let valid = true;
                  
                  while (remaining > 0) {
                      let bestIdx = -1;
                      for (let i = 0; i < mpptCount; i++) {
                          if (k[i] <= remaining && S[i] < maxPerString) {
                              if (bestIdx === -1) {
                                  bestIdx = i;
                              } else if (S[i] < S[bestIdx]) {
                                  bestIdx = i;
                              } else if (S[i] === S[bestIdx] && k[i] > k[bestIdx]) {
                                  bestIdx = i;
                              }
                          }
                      }
                      if (bestIdx !== -1) {
                          S[bestIdx]++;
                          remaining -= k[bestIdx];
                      } else {
                          valid = false;
                          break;
                      }
                  }
                  
                  for (let i = 0; i < mpptCount; i++) {
                      if (S[i] > maxPerString) valid = false;
                  }
                  
                  if (valid) {
                      bestDistribution = k.map((stringsCount, i) => ({ stringsCount, size: S[i] }));
                      break;
                  }
                  
                  let minK = Math.min(...k);
                  let idxToIncrement = k.indexOf(minK);
                  k[idxToIncrement]++;
                  
                  if (k.reduce((a, b) => a + b, 0) > targetModules) {
                      break;
                  }
              }

              if (!bestDistribution) {
                  message = `Impossível distribuir ${targetModules} módulos uniformemente respeitando limite de ${maxPerString} por string. Tente outra quantidade.`;
                  return state;
              }

              const invIndex = state.inverters.ids.indexOf(inverterId) + 1;
              const formattedInvId = invIndex.toString().padStart(2, '0');

              const newMpptConfigs = inv.mpptConfigs.map((mppt, idx) => {
                  const dist = bestDistribution![idx];
                  const newStrings = Array.from({ length: dist.stringsCount }).map((_, sIdx) => ({
                      id: genId(),
                      name: `INV-${formattedInvId}.M${mppt.mpptId}.S${sIdx + 1}`,
                      modulesCount: dist.size,
                      cableLength: 10,
                      cableSection: 4,
                  }));

                  return {
                      ...mppt,
                      stringsCount: dist.stringsCount,
                      strings: newStrings
                  };
              });

              success = true;
              message = 'Distribuição concluída com sucesso.';

              return {
                  inverters: {
                      ...state.inverters,
                      entities: {
                          ...state.inverters.entities,
                          [inverterId]: { ...inv, mpptConfigs: newMpptConfigs }
                      }
                  }
              };
          });

          // B2: Clear stale stringData references after redistribution
          if (success) {
              useSolarStore.getState().clearOrphanStringData(inverterId);
          }

          return { success, message };
      },

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
          prCalculationMode: 'additive',
          cosip: 35.00,
          projectTopologyConfig: null,
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

      // ═══════════════════════════════════════════════════════════════════════════
      // V4: String Actions — DEPRECATED — DO NOT USE IN NEW CODE
      // ═══════════════════════════════════════════════════════════════════════════
      // These methods are kept for backward compatibility only. They operate on the
      // legacy `strings: NormalizedCollection<LogicalString>` system.
      //
      // **Why V4 is deprecated:**
      // - Strings were stored separately from MPPTs, requiring two-step lookups
      // - StringIDs had to be managed manually and could become orphaned
      // - No clear ownership model (strings could exist without MPPT assignment)
      //
      // **V5 Approach (current standard):**
      // - Strings are embedded directly in `mpptConfig.strings: StringDef[]`
      // - No external IDs or lookups needed
      // - Clear ownership: each StringDef belongs to exactly one MPPT
      //
      // **Migration checklist:**
      // 1. Replace `createString()` with `addStringToMPPT(inverterId, mpptId)`
      // 2. Replace `deleteString()` with `removeStringFromMPPT(inverterId, mpptId, stringId)`
      // 3. Replace `addModulesToString()` with `updateStringInMPPT(..., { modulesCount })`
      // 4. Use `mppt.strings` array directly instead of `stringIds` lookups
      //
      // V4 will be removed in release 1.0.0.
      // ═══════════════════════════════════════════════════════════════════════════

      createString: (moduleIds) => set((state) => {
          const id = 'str-' + genId();
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

          const newStringId = 'str-' + genId();
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
    {
      name: 'kurupira-tech-storage',
      partialize: (state) => ({
        inverters: state.inverters,
        lossProfile: state.lossProfile,
        prCalculationMode: state.prCalculationMode,
        cosip: state.cosip,
        strings: state.strings, // keep for backward compat
      }),
    }
  )
);

// =============================================================================
// STABLE SELECTORS — Avoid repeated Object.values() calls across hooks (P02)
// =============================================================================

/** Stable selector for inverters array — avoids repeated toArray() calls across hooks */
let _invCacheRef: any = null;
let _invCacheArr: InverterState[] = [];
export const selectTechInvertersArray = (state: TechState) => {
  if (state.inverters !== _invCacheRef) {
    _invCacheRef = state.inverters;
    _invCacheArr = Object.values(state.inverters.entities).filter(Boolean) as InverterState[];
  }
  return _invCacheArr;
};

/**
 * @deprecated V4 legacy selector — use mppt.strings directly from selectTechInvertersArray
 *
 * Instead of:
 * ```ts
 * const strings = useTechStore(selectTechStringsArray);
 * ```
 *
 * Use:
 * ```ts
 * const inverters = useTechStore(selectTechInvertersArray);
 * // Access strings via: inverters[i].mpptConfigs[j].strings
 * ```
 */
let _strCacheRef: any = null;
let _strCacheArr: LogicalString[] = [];
export const selectTechStringsArray = (state: TechState) => {
  if (state.strings !== _strCacheRef) {
    _strCacheRef = state.strings;
    _strCacheArr = Object.values(state.strings.entities).filter(Boolean) as LogicalString[];
  }
  return _strCacheArr;
};
