import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { validateSystemStrings, type MPPTInput, type SystemValidationReport } from '@/modules/engineering/utils/electricalMath';

export interface InventorySyncStatus {
    isSynced: boolean;
    placedCount: number;
    logicalCount: number;
    difference: number; // positive = more logical than physical
    status: 'ok' | 'warning' | 'error';
    message: string;
}

export interface UnifiedValidationResult {
    electrical: SystemValidationReport | null;
    inventory: InventorySyncStatus;
    globalHealth: 'ok' | 'warning' | 'error';
}

export const useElectricalValidation = (): UnifiedValidationResult => {
    // 1. Fetch dependencies (avoiding deep object listening if possible, but keeping it simple for now)
    const modules = useSolarStore(selectModules);
    const settings = useSolarStore(state => state.settings);
    const catalogInverters = useCatalogStore(state => state.inverters);
    
    // TechStore data
    const invertersNorm = useTechStore(state => state.inverters);
    const stringsNorm = useTechStore(state => state.strings);
    
    // We only recalculate when these specific serializations change to avoid 3D vector-drag re-renders
    const modulesCount = modules.length;
    const representativeModule = modules[0]; // Assume uniform modules for now
    
    // By extracting the IDs and relevant nested properties instead of full stringification, we save CPU cycles
    const invertersSig = Object.values(invertersNorm.entities)
        .map(inv => `${inv.id}-${inv.mpptConfigs.map(m => `${m.stringIds.join(',')}|${m.cableLength}|${m.cableSection}`).join('|')}`)
        .join('::');
        
    const stringsSig = Object.values(stringsNorm.entities)
        .map(str => `${str.id}-${str.mpptId}-${str.moduleIds.length}`)
        .join('::');
        
    const settingsSig = settings?.minHistoricalTemp ?? -5;

    return useMemo(() => {
        const techInverters = Object.values(invertersNorm.entities);
        const techStrings = Object.values(stringsNorm.entities);

        // --- A. INVENTORY SYNC VALIDATION ---
        const placedCount = modulesCount; // Módulos físicos na tela 3D
        // Logical modules are the ones actually inserted into Strings
        // OR the user created them in the topology. Wait, free modules are in the store but not strings?
        // Let's assume logical modules are those linked to ANY string (connected or disconnected).
        const logicalCount = techStrings.reduce((acc, str) => acc + str.moduleIds.length, 0);
        
        const difference = logicalCount - placedCount;
        let invStatus: 'ok' | 'warning' | 'error' = 'ok';
        let invMessage = 'Inventário sincronizado.';

        if (difference > 0) {
           invStatus = 'error';
           invMessage = `Excesso Lógico: Existem ${difference} módulo(s) a mais nas conexões elétricas do que no telhado físico 3D.`;
        } else if (difference < 0) {
           invStatus = difference < -5 ? 'warning' : 'ok';
           invMessage = `Aviso: Existem ${Math.abs(difference)} painel(is) desvinculados no telhado físico.`;
        }

        const inventorySync: InventorySyncStatus = {
            isSynced: difference === 0,
            placedCount,
            logicalCount,
            difference,
            status: invStatus,
            message: invMessage
        };

        // --- B. ELECTRICAL THERMAL VALIDATION ---
        let electricalReport: SystemValidationReport | null = null;
        
        if (representativeModule && techInverters.length > 0) {
            const moduleSpecs = {
                voc: representativeModule.voc,
                vmp: representativeModule.vmp ?? representativeModule.voc * 0.82,
                isc: representativeModule.isc ?? 0,
                tempCoeffVoc: representativeModule.tempCoeff || -0.29,
            };

            const mpptInputs: MPPTInput[] = techInverters.flatMap(inv => {
                const catalogSpec = catalogInverters.find((c: any) => c.id === inv.catalogId);
                if (!catalogSpec) {
                    console.warn(`[ElectricalValidation] Inversor ${inv.id} (catalogId: ${inv.catalogId}) sem spec no catálogo — usando fallbacks conservadores.`);
                }

                return inv.mpptConfigs.map(cfg => {
                    // Em P6.4, cfg.stringIds contém as strings LÓGICAS reais atribuídas ao MPPT
                    const assignedStrings = cfg.stringIds
                        .map(sId => stringsNorm.entities[sId])
                        .filter(Boolean);
                    
                    // Pegamos a maior string deste MPPT para validar a Tensão máxima
                    const maxModulesInAString = assignedStrings.reduce((acc, s) => Math.max(acc, s.moduleIds.length), 0);
                    const activeStringsCount = assignedStrings.length;

                    return {
                        inverterId: inv.id,
                        mpptId: cfg.mpptId,
                        modulesPerString: maxModulesInAString,
                        stringsCount: activeStringsCount,
                        maxInputVoltage: inv.snapshot?.maxInputVoltage ?? 600,
                        minMpptVoltage: inv.snapshot?.minMpptVoltage ?? 150,
                        maxMpptVoltage: inv.snapshot?.maxMpptVoltage ?? 500,
                        maxCurrentPerMPPT: inv.snapshot?.maxCurrentPerMPPT ?? 15,
                        cableLength: cfg.cableLength,
                        cableSection: cfg.cableSection,
                    } as MPPTInput;
                }).filter(input => input.stringsCount > 0 && input.modulesPerString > 0);
            });

            if (mpptInputs.length > 0) {
                electricalReport = validateSystemStrings(
                    mpptInputs, 
                    moduleSpecs, 
                    settingsSig
                );
            }
        }

        // --- C. GLOBAL HEALTH CALCULATION ---
        let globalHealth: 'ok' | 'warning' | 'error' = 'ok';
        if (electricalReport?.globalStatus === 'error' || inventorySync.status === 'error') {
            globalHealth = 'error';
        } else if (electricalReport?.globalStatus === 'warning' || inventorySync.status === 'warning') {
            globalHealth = 'warning';
        }

        return {
            electrical: electricalReport,
            inventory: inventorySync,
            globalHealth
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modulesCount, representativeModule?.id, invertersSig, stringsSig, settingsSig, catalogInverters.length]);
};
