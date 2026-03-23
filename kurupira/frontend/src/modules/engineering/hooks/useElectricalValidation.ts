import { useCallback } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';
import { INVERTER_CATALOG } from '../constants/inverters';
import { toArray } from '@/core/types/normalized.types';

export interface MPPTValidationResult {
  vocMax: number;
  iscMax: number;
  inverterMaxVoltage: number;
  inverterMaxCurrent: number;
  isVocUnsafe: boolean;
  isCurrentUnsafe: boolean;
  physicallyAssigned: number;
  logicalCount: number;
  isMismatch: boolean;
}

export function useElectricalValidation() {
  const modules = useSolarStore(selectModules);
  const settings = useSolarStore(state => state.settings);
  const placedModules = useSolarStore(state => state.project.placedModules);
  const { inverters: techInvertersStore } = useTechStore();

  const validateMPPT = useCallback((inverterId: string, mpptId: number): MPPTValidationResult | null => {
    if (modules.length === 0) return null;
    
    // Pega o módulo (vamos assumir que o projeto usa majoritariamente 1 tipo catalogado para simplificar, ou pega o primeiro)
    const m = modules[0];
    const techInverters = toArray(techInvertersStore);
    
    const techInv = techInverters.find(ti => ti.id === inverterId || ti.catalogId === inverterId);
    if (!techInv) return null;

    const spec = INVERTER_CATALOG.find((c: any) => c.id === techInv.catalogId);
    if (!spec) return null;

    const mpptConfig = techInv.mpptConfigs.find(c => c.mpptId === mpptId);
    if (!mpptConfig) return null;

    const specMppt = spec.mppts?.find((m: any) => m.mpptId === mpptId) || spec.mppts?.[0];
    if (!specMppt) return null;

    // Lógica 1: Física vs Lógica (P6-1)
    const physicallyAssigned = placedModules.filter(pm => pm.stringData?.inverterId === techInv.id && pm.stringData?.mpptId === mpptId).length;
    const logicalCount = mpptConfig.modulesPerString * mpptConfig.stringsCount;
    // P6-1: Se existir atribuição física, usamos ela! Se não, usamos o valor digitado manual.
    const effectiveModulesPerString = physicallyAssigned > 0 ? physicallyAssigned / (mpptConfig.stringsCount || 1) : mpptConfig.modulesPerString;

    // Lógica 2: Limites Térmicos Frio (P6-2)
    const tMin = settings?.minHistoricalTemp ?? 10;
    const tempCoeff = m.tempCoeff || -0.29;
    const correctionFactor = 1 + (tempCoeff / 100) * (tMin - 25);
    const vocMaxPerModule = m.voc * correctionFactor;
    
    const stringVoc = vocMaxPerModule * effectiveModulesPerString;
    const mpptIsc = (m.isc ?? 0) * mpptConfig.stringsCount;

    return {
      vocMax: stringVoc,
      iscMax: mpptIsc,
      inverterMaxVoltage: specMppt.maxInputVoltage,
      inverterMaxCurrent: specMppt.maxCurrentPerMPPT,
      isVocUnsafe: stringVoc > specMppt.maxInputVoltage,
      isCurrentUnsafe: mpptIsc > specMppt.maxCurrentPerMPPT,
      physicallyAssigned,
      logicalCount,
      isMismatch: physicallyAssigned > 0 && physicallyAssigned !== logicalCount
    };
  }, [modules, settings, placedModules, techInvertersStore]);

  return {
    validateMPPT,
    systemMinTemp: settings?.minHistoricalTemp ?? 10
  };
}
