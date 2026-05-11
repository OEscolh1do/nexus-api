/**
 * CATALOG SYNC UTILS
 * 
 * Helper functions to ensure data integrity between top-level database fields
 * and the 'electricalData' JSON blob used by the engineering engine.
 */

interface ModuleElectricalData {
  pmax?: number;
  voc?: number;
  isc?: number;
  vmp?: number;
  imp?: number;
  tempCoeffVoc?: number;
  tempCoeffPmax?: number;
  tempCoeffIsc?: number;
  [key: string]: any;
}

interface InverterElectricalData {
  pNomDCW?: number;
  pMaxDCW?: number;
  vAbsMax?: number;
  vMinMpp?: number;
  vMaxMpp?: number;
  iMaxDC?: number;
  maxOutputW?: number;
  nbMppt?: number;
  [key: string]: any;
}

/**
 * Syncs module top-level fields into electricalData JSON.
 */
export function syncModuleData(
  topLevel: { 
    powerWp?: number;
    // Add other top-level fields here if needed
  },
  electricalData: ModuleElectricalData
): ModuleElectricalData {
  const synced = { ...electricalData };
  
  if (topLevel.powerWp !== undefined) {
    synced.pmax = topLevel.powerWp;
  }
  
  return synced;
}

/**
 * Syncs inverter top-level fields into electricalData JSON.
 */
export function syncInverterData(
  topLevel: {
    nominalPowerW?: number;
    maxInputV?: number;
    mpptCount?: number;
    efficiency?: number;
    weight?: number;
    width?: number;
    height?: number;
    depth?: number;
  },
  electricalData: InverterElectricalData
): InverterElectricalData {
  const synced = { ...electricalData };
  
  if (topLevel.nominalPowerW !== undefined) {
    // Sincroniza potência nominal CA
    synced.maxOutputW = topLevel.nominalPowerW;
    // Se pNomDCW não existe, assume 110% da AC como chute inicial (oversizing comum)
    if (!synced.pNomDCW) {
      synced.pNomDCW = topLevel.nominalPowerW * 1.1;
    }
  }
  
  if (topLevel.maxInputV !== undefined) {
    synced.vAbsMax = topLevel.maxInputV;
  }
  
  if (topLevel.mpptCount !== undefined) {
    synced.nbMppt = topLevel.mpptCount;
  }

  if (topLevel.efficiency !== undefined) {
    synced.effMax = topLevel.efficiency;
  }

  // Sincroniza dimensões físicas para consistência no motor de simulação
  if (topLevel.weight !== undefined) synced.weight = topLevel.weight;
  if (topLevel.width !== undefined) synced.width = topLevel.width;
  if (topLevel.height !== undefined) synced.height = topLevel.height;
  if (topLevel.depth !== undefined) synced.depth = topLevel.depth;
  
  return synced;
}

/**
 * Deep merges form fields into the electricalData object.
 * Use this when the form has direct access to technical parameters.
 */
export function mergeTechnicalData<T extends Record<string, any>>(
  current: T,
  updates: Partial<T>
): T {
  return {
    ...current,
    ...updates
  };
}
