import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { validateSystemStrings, type MPPTInput, type SystemValidationReport } from '@/modules/engineering/utils/electricalMath';
import { getModuleSpecs, type ModuleSpecs } from '@/modules/engineering/utils/specAdapter';
import { useThermalPremises } from './useThermalPremises';
import { useDebounce } from './useDebounce';

/** Lightweight djb2 string hash — for change detection only, not cryptographic */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

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
    /** Number of placed modules without stringData assignment */
    unassignedModulesCount: number;
    /** True if all placed modules are assigned AND electrical validation passes */
    isReadyForApproval: boolean;
    /** Placed modules whose moduleSpecId has no matching spec in the store — silent power loss risk */
    orphanedSpecCount: number;
    /** Placed modules whose stringData.inverterId has no matching InverterState in TechStore */
    orphanedInverterCount: number;
    /** Number of MPPTs that have StringDefs configured but zero modules assigned */
    emptyConfiguredMPPTCount: number;
    /** Avisos sobre qualidade dos dados usados na validação (ex: fallbacks conservadores usados) */
    dataQualityWarnings: string[];
}

export const useElectricalValidation = (): UnifiedValidationResult => {
    // 1. Fetch dependencies (avoiding deep object listening if possible, but keeping it simple for now)
    const modules = useSolarStore(selectModules);
    const placedModules = useSolarStore(state => state.project.placedModules);
    const catalogInverters = useCatalogStore(state => state.inverters);
    const engineeringData  = useSolarStore(state => state.engineeringData);
    const moduleSpecsEntities = useSolarStore(state => state.modules.entities);
    
    // TechStore data
    const invertersNorm = useTechStore(state => state.inverters);
    const stringsNorm = useTechStore(state => state.strings);

    // Premissas térmicas centralizadas — fonte única de verdade (NBR 16690:2019 §4.3.1.2)
    const { tmin: settingsSig, tcellMax } = useThermalPremises();
    const thermalSig = tcellMax;

    // Primitivos para evitar re-renders por referência de objeto
    const placedCount = placedModules.length;
    const inventoryCount = modules.length;

    // R4-06: Envolver em useMemo para evitar recalcular o filter em todo render
    const placedAssignedSig = useMemo(
      () => placedModules.filter(m => m.stringData).length,
      [placedModules]
    );

    // E02: Select most frequently used module spec from placedModules, fallback to modules[0]
    const representativeModule = useMemo(() => {
        if (modules.length === 0) return undefined;
        if (placedModules.length === 0) return modules[0];

        // Count frequency of each moduleSpecId in placed modules
        const freq: Record<string, number> = {};
        placedModules.forEach(pm => {
            if (pm.moduleSpecId) {
                freq[pm.moduleSpecId] = (freq[pm.moduleSpecId] ?? 0) + 1;
            }
        });

        // Find spec with highest count that still exists in modules
        const topSpecId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topSpec = topSpecId ? modules.find(m => m.id === topSpecId) : undefined;
        return topSpec ?? modules[0];
    }, [modules, placedModules, placedCount]);

    // Debounced: rapid MPPT field edits (e.g., modulesPerString typing) fire validation
    // only after 300ms of inactivity — avoids O(n) electrical re-calc on every keystroke.
    const invertersSigRaw = djb2Hash(
        Object.values(invertersNorm.entities)
            .map(inv => `${inv.id}-${inv.mpptConfigs.map(m => `${m.stringIds?.join(',')}|${m.modulesPerString}|${m.stringsCount}|${m.cableLength}`).join('|')}`)
            .join('::')
    );
    const invertersSig = useDebounce(invertersSigRaw, 300);

    const stringsSigRaw = djb2Hash(
        Object.values(stringsNorm.entities)
            .map(str => `${str.id}-${str.mpptId}-${str.moduleIds?.length}`)
            .join('::')
    );
    const stringsSig = useDebounce(stringsSigRaw, 300);

    // F01: Hash catalog inverter specs to detect changes to voltage/current limits
    // R5-07: Sort by id before hashing to avoid order-sensitive hash changes
    const catalogSig = useMemo(() =>
        djb2Hash(
            catalogInverters
                .slice()
                .sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''))
                .map((c: any) => `${c.id}-${c.maxInputVoltage ?? 0}-${c.minMpptVoltage ?? 0}-${c.maxMpptVoltage ?? 0}`)
                .join('|')
        ),
        [catalogInverters]
    );

    return useMemo(() => {
        const techInverters = Object.values(invertersNorm.entities);
        const techStrings = Object.values(stringsNorm.entities);

        // --- A. INVENTORY SYNC VALIDATION ---
        const physicalCount = placedCount; // Módulos físicos no telhado (3D/Canvas)
        const totalInventory = inventoryCount; // Módulos no catálogo do projeto (Comercial)
        
        // Cálculo granular por MPPT para evitar inconsistências entre desenho (Tier 3) e config manual (Tier 2)
        const logicalCount = techInverters.reduce((totalAcc, inv) => {
            const inverterMpptsSum = inv.mpptConfigs.reduce((mpptAcc, mppt) => {
                // 1. Módulos na configuração V5 (Anilhas/StringDef) — fonte de verdade preferencial
                const v5Count = (mppt.strings || []).reduce((acc, s) => acc + s.modulesCount, 0);

                // R4-02: Apenas usar V5 se há módulos efetivamente alocados nele
                const hasActiveV5 = v5Count > 0;

                if (hasActiveV5) {
                    return mpptAcc + v5Count;
                }

                // 2. Fallback: configuração rápida (campos legados Mods/Str)
                const legacyCount = (mppt.modulesPerString || 0) * (mppt.stringsCount || 0);

                // 3. Fallback: strings reais desenhadas (Tier 3)
                const mpptRef = `${inv.id}:${mppt.mpptId}`;
                const drawnCount = techStrings
                    .filter(str => str.mpptId === mpptRef)
                    .reduce((strAcc, str) => strAcc + str.moduleIds.length, 0);

                return mpptAcc + Math.max(legacyCount, drawnCount);
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

        const unassignedModulesCount = placedModules.filter(m => !m.stringData).length;
        const orphanedSpecCount = placedModules.filter(m => m.moduleSpecId && !moduleSpecsEntities[m.moduleSpecId]).length;
        const orphanedInverterCount = placedModules.filter(m =>
            m.stringData && !invertersNorm.entities[m.stringData.inverterId]
        ).length;

        // I08: Detect MPPTs with StringDefs configured but zero modules
        const emptyConfiguredMPPTCount = techInverters.reduce((count, inv) => {
            return count + inv.mpptConfigs.filter(cfg => {
                const v5Strings = cfg.strings || [];
                const v5Count = v5Strings.reduce((acc, s) => acc + s.modulesCount, 0);
                return v5Strings.length > 0 && v5Count === 0;
            }).length;
        }, 0);

        // --- B. ELECTRICAL THERMAL VALIDATION ---
        const dataQualityWarnings: string[] = [];
        let electricalReport: SystemValidationReport | null = null;

        if (representativeModule && techInverters.length > 0) {
            // representativeModule is guaranteed non-null at this point
            const moduleSpecs: ModuleSpecs = getModuleSpecs(representativeModule)!;

            // E01: Guard against invalid module specs that would corrupt thermal calculations
            // D03: Return explicit error instead of silent skip
            if (moduleSpecs.voc <= 0 || moduleSpecs.isc <= 0) {
                dataQualityWarnings.push('Módulo representativo sem parâmetros elétricos (Voc=0 ou Isc=0) — validação ignorada.');
                electricalReport = {
                    isValid: false,
                    globalStatus: 'error' as const,
                    entries: [{
                        inverterId: techInverters[0]?.id ?? 'unknown',
                        mpptId: 0,
                        status: 'error' as const,
                        vocMax: 0,
                        vmpMin: 0,
                        iscTotal: 0,
                        messages: ['Parâmetros elétricos do módulo inválidos (Voc=0 ou Isc=0). Verifique a seleção de módulo.'],
                    }],
                    summary: { totalMPPTs: 0, errors: 1, warnings: 0 },
                };
            } else {

            const mpptInputs: MPPTInput[] = techInverters.flatMap(inv => {
                const catalogSpec = catalogInverters.find((c: any) => c.id === inv.catalogId);
                if (!catalogSpec) {
                    console.warn(`[ElectricalValidation] Inversor ${inv.id} (catalogId: ${inv.catalogId}) sem spec no catálogo — usando fallbacks conservadores.`);
                    dataQualityWarnings.push(`Inversor "${inv.snapshot?.model ?? inv.id}" sem spec no catálogo — usando limites conservadores.`);
                }

                return inv.mpptConfigs.map(cfg => {
                    // Derive module spec for this specific MPPT from placed modules
                    // Falls back to representativeModule if no placed modules found for this MPPT
                    const mpptPlacedFirst = placedModules.find(m =>
                        m.stringData?.inverterId === inv.id &&
                        m.stringData?.mpptId === cfg.mpptId
                    );
                    const mpptSpecId = mpptPlacedFirst?.moduleSpecId ?? cfg.moduleModel;
                    const mpptRawSpec = mpptSpecId
                        ? modules.find(mod => mod.id === mpptSpecId)
                        : representativeModule;
                    const mpptModuleSpecs: ModuleSpecs = getModuleSpecs(mpptRawSpec) ?? moduleSpecs;

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
                        azimuth: cfg.azimuth ?? (engineeringData?.azimute ?? 0),
                        inclination: cfg.inclination ?? (engineeringData?.roofTilt ?? 15),
                        moduleSpecs: mpptModuleSpecs,  // per-MPPT validation if supported
                    } as any;
                }).filter(input => input.stringsCount > 0 && input.modulesPerString > 0);
            });

                if (mpptInputs.length > 0) {
                    electricalReport = validateSystemStrings(
                        mpptInputs,
                        moduleSpecs,
                        settingsSig,
                        tcellMax
                    );
                }
            }
        }

        // --- C. GLOBAL HEALTH CALCULATION ---
        let globalHealth: 'ok' | 'warning' | 'error' = 'ok';
        if (electricalReport?.globalStatus === 'error' || inventorySync.status === 'error') {
            globalHealth = 'error';
        } else if (electricalReport?.globalStatus === 'warning' || inventorySync.status === 'warning' || emptyConfiguredMPPTCount > 0) {
            globalHealth = 'warning';
        }

        const isReadyForApproval =
            unassignedModulesCount === 0 &&
            placedModules.length > 0 &&
            (electricalReport === null || electricalReport.globalStatus !== 'error') &&
            inventorySync.status !== 'error';

        return {
            electrical: electricalReport,
            inventory: inventorySync,
            globalHealth,
            unassignedModulesCount,
            isReadyForApproval,
            orphanedSpecCount,
            orphanedInverterCount,
            emptyConfiguredMPPTCount,
            dataQualityWarnings,
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        placedCount,
        inventoryCount,
        representativeModule?.id,
        invertersSig,
        stringsSig,
        settingsSig,
        thermalSig,
        catalogSig, // F01: Use hash instead of length to detect spec changes
        invertersNorm.ids.length, // Força recálculo se deletar inversor
        stringsNorm.ids.length,   // Força recálculo se deletar string
        placedAssignedSig,        // Força recálculo quando placedModules são assignados
        Object.keys(moduleSpecsEntities).length // Força recálculo quando specs são removidas
    ]);
};
