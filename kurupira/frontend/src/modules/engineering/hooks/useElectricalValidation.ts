import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { validateSystemStrings, type MPPTInput, type SystemValidationReport } from '@/modules/engineering/utils/electricalMath';

export interface InventorySyncStatus {
    isSynced: boolean;
    placedCount: number;
    logicalCount: number;
    inventoryCount: number; 
    remainingCount: number; // NOVO: Quanto sobra para alocar
    difference: number; 
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
    const placedModules = useSolarStore(state => state.project.placedModules);
    const settings = useSolarStore(state => state.settings);
    const engineeringData = useSolarStore(state => state.engineeringData);
    const catalogInverters = useCatalogStore(state => state.inverters);
    
    // TechStore data
    const invertersNorm = useTechStore(state => state.inverters);
    const stringsNorm = useTechStore(state => state.strings);
    
    // We only recalculate when these specific serializations change to avoid 3D vector-drag re-renders
    const placedCount = placedModules.length;
    const inventoryCount = modules.length;
    const representativeModule = modules[0]; // Assume uniform modules for now
    
    // By extracting the IDs and relevant nested properties instead of full stringification, we save CPU cycles
    const invertersSig = Object.values(invertersNorm.entities)
        .map(inv => `${inv.id}-${inv.mpptConfigs.map(m => `${m.stringIds.join(',')}|${m.modulesPerString}|${m.stringsCount}|${m.cableLength}`).join('|')}`)
        .join('::');
        
    const stringsSig = Object.values(stringsNorm.entities)
        .map(str => `${str.id}-${str.mpptId}-${str.moduleIds.length}`)
        .join('::');
        
    const settingsSig = settings?.minHistoricalTemp ?? -5;

    return useMemo(() => {
        const techInverters = Object.values(invertersNorm.entities);
        const techStrings = Object.values(stringsNorm.entities);

        // --- A. INVENTORY SYNC VALIDATION ---
        const physicalCount = placedCount; // Módulos físicos no telhado (3D/Canvas)
        const totalInventory = inventoryCount; // Módulos no catálogo do projeto (Comercial)
        
        // Cálculo granular por MPPT para evitar inconsistências entre desenho (Tier 3) e config manual (Tier 2)
        const logicalCount = techInverters.reduce((totalAcc, inv) => {
            const inverterMpptsSum = inv.mpptConfigs.reduce((mpptAcc, mppt) => {
                // 1. Módulos na configuração V5 (Anilhas/StringDef)
                const v5Count = (mppt.strings || []).reduce((acc, s) => acc + s.modulesCount, 0);

                // 2. Módulos na configuração rápida (campos legados Mods/Str)
                const legacyCount = (mppt.modulesPerString || 0) * (mppt.stringsCount || 0);
                
                // 3. Módulos em strings reais desenhadas (Tier 3)
                const mpptRef = `${inv.id}:${mppt.mpptId}`;
                const drawnCount = techStrings
                    .filter(str => str.mpptId === mpptRef)
                    .reduce((strAcc, str) => strAcc + str.moduleIds.length, 0);

                // Pegamos o maior entre os métodos para garantir conservadorismo
                return mpptAcc + Math.max(v5Count, legacyCount, drawnCount);
            }, 0);
            
            return totalAcc + inverterMpptsSum;
        }, 0);
        


        // O Saldo principal agora é contra o Inventário Total, não contra o físico
        const difference = logicalCount - totalInventory;
        let invStatus: 'ok' | 'warning' | 'error' = 'ok';
        let invMessage = 'Inventário sincronizado.';

        if (difference > 0) {
           invStatus = 'error';
           invMessage = `Excesso: Existem ${difference} módulo(s) alocados a mais do que o inventário disponível (${totalInventory}).`;
        } else if (difference < 0) {
           invStatus = 'warning';
           invMessage = `Pendente: Existem ${Math.abs(difference)} módulo(s) no inventário aguardando alocação elétrica.`;
        } else {
           // Se o alocado bate com o inventário, verificamos se o físico (telhado) também bate
           if (physicalCount < totalInventory) {
               invStatus = 'warning';
               invMessage = `Elétrica OK, mas faltam ${totalInventory - physicalCount} módulo(s) serem posicionados no telhado.`;
           }
        }

        const inventorySync: InventorySyncStatus = {
            isSynced: difference === 0 && physicalCount === totalInventory,
            placedCount: physicalCount,
            logicalCount,
            inventoryCount: totalInventory,
            remainingCount: totalInventory - logicalCount,
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
                imp: (representativeModule as any).imp ?? (representativeModule.isc ?? 0) * 0.95,
                tempCoeffVoc: (representativeModule as any).electrical?.tempCoeffVoc ?? representativeModule.tempCoeff ?? -0.29,
            };

            const mpptInputs: MPPTInput[] = techInverters.flatMap(inv => {
                const catalogSpec = catalogInverters.find((c: any) => c.id === inv.catalogId);
                if (!catalogSpec) {
                    console.warn(`[ElectricalValidation] Inversor ${inv.id} (catalogId: ${inv.catalogId}) sem spec no catálogo — usando fallbacks conservadores.`);
                }

                return inv.mpptConfigs.map(cfg => {
                    // Determinamos as strings ativas: Prioridade V5 (Anilhas) > Tier 3 (Drawn) > Legacy
                    const v5Strings = cfg.strings || [];
                    const assignedStrings = cfg.stringIds
                        .map(sId => stringsNorm.entities[sId])
                        .filter(Boolean);
                    
                    // Estrutura de strings unificada para o motor matemático
                    const activeStrings = v5Strings.length > 0 
                        ? v5Strings 
                        : assignedStrings.length > 0
                            ? assignedStrings.map(s => ({ 
                                id: s.id, 
                                name: `STR-${s.id}`, 
                                modulesCount: s.moduleIds.length,
                                cableLength: cfg.cableLength || 10,
                                cableSection: cfg.cableSection || 4
                              }))
                            : Array.from({ length: cfg.stringsCount || 0 }).map((_, i) => ({
                                id: `legacy-${i}`,
                                name: `STR-LEGACY-${i}`,
                                modulesCount: cfg.modulesPerString || 0,
                                cableLength: cfg.cableLength || 10,
                                cableSection: cfg.cableSection || 4
                              }));

                    const maxModulesInAString = activeStrings.reduce((acc, s) => Math.max(acc, s.modulesCount), 0);
                    const activeStringsCount = activeStrings.length;

                    return {
                        inverterId: inv.id,
                        mpptId: cfg.mpptId,
                        modulesPerString: maxModulesInAString,
                        stringsCount: activeStringsCount,
                        strings: activeStrings, // Passamos o array completo V5
                        maxInputVoltage: inv.snapshot?.maxInputVoltage ?? 600,
                        minMpptVoltage: inv.snapshot?.minMpptVoltage ?? 150,
                        maxMpptVoltage: inv.snapshot?.maxMpptVoltage ?? 500,
                        maxCurrentPerMPPT: inv.snapshot?.maxCurrentPerMPPT ?? 15,
                        cableLength: cfg.cableLength,
                        cableSection: cfg.cableSection,
                        azimuth: cfg.azimuth ?? engineeringData.azimute,
                        inclination: cfg.inclination ?? engineeringData.roofTilt,
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
    }, [
        placedCount, 
        inventoryCount, 
        representativeModule?.id, 
        invertersSig, 
        stringsSig, 
        settingsSig, 
        catalogInverters.length,
        invertersNorm.ids.length, // Força recálculo se deletar inversor
        stringsNorm.ids.length    // Força recálculo se deletar string
    ]);
};
