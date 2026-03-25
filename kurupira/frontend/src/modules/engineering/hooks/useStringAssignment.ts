import { useCallback, useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';
import { INVERTER_CATALOG } from '../constants/inverters';
import { toArray } from '@/core/types/normalized.types';
import {
    calculateStringMetrics,
    type ModuleElectricalSpecs,
    type ValidationStatus,
} from '../utils/electricalMath';

// ─── Types ──────────────────────────────────────────

export interface AssignmentPreview {
    vocMax: number;
    vmpMin: number;
    iscTotal: number;
    inverterMaxVoltage: number;
    vocStatus: ValidationStatus;
    iscStatus: ValidationStatus;
}

// ─── Hook ───────────────────────────────────────────

/**
 * useStringAssignment (P6.2)
 *
 * Encapsulates logical module ↔ MPPT assignment logic.
 * - Assignments are mathematical (modulesPerString * stringsCount)
 * - Computes unassigned pool derived from project inventory
 */
export function useStringAssignment() {
    const modules = useSolarStore(selectModules);
    const settings = useSolarStore(state => state.settings);
    
    const techInvertersStore = useTechStore(s => s.inverters);

    // ─── Assign Logical Modules ─────────────────────────────

    const assignLogical = useCallback((
        stringId: string,
        inverterId: string,
        mpptId: number
    ) => {
        useTechStore.getState().assignStringToMPPT(stringId, inverterId, mpptId);
    }, []);

    // ─── Unassign Logical Modules ───────────────────────────

    const unassignLogical = useCallback((
        stringId: string
    ) => {
        useTechStore.getState().unassignStringFromMPPT(stringId);
    }, []);

    // ─── Preview Before Assign ──────────────────────

    const preview = useCallback((
        stringId: string,
        inverterId: string,
        mpptId: number
    ): AssignmentPreview | null => {
        const freshStore = useTechStore.getState();
        const techInverters = toArray(freshStore.inverters);
        const strings = freshStore.strings.entities;
        
        const stringToAssign = strings[stringId];
        if (!stringToAssign || stringToAssign.moduleIds.length === 0) return null;
        
        const firstModuleId = stringToAssign.moduleIds[0];
        const m = modules.find(mod => mod.id === firstModuleId) || modules[0]; // Homogeneous fallback

        if (!m) return null;

        const techInv = techInverters.find(
            ti => ti.id === inverterId || ti.catalogId === inverterId
        );
        if (!techInv) return null;

        const spec = INVERTER_CATALOG.find((c: any) => c.id === techInv.catalogId);
        if (!spec) return null;

        const specMppt = spec.mppts?.find((mp: any) => mp.mpptId === mpptId) || spec.mppts?.[0];
        if (!specMppt) return null;

        const mpptConfig = techInv.mpptConfigs.find(c => c.mpptId === mpptId);
        if (!mpptConfig) return null;

        const futureStringsCount = mpptConfig.stringIds.length + 1; // Assuming we add this string
        // Em V4, módulos por string reais = stringToAssign.moduleIds.length
        // Mas a conta de Voc independe do número de strings paralelas,
        // depende dos painéis em série (na String mais longa).
        // Iremos usar a string atual que está sendo arrastada.
        const futureModulesPerString = stringToAssign.moduleIds.length;
        const minTemp = settings?.minHistoricalTemp ?? 10;

        const moduleSpecs: ModuleElectricalSpecs = {
            voc: m.voc,
            vmp: m.vmp ?? m.voc * 0.82,
            isc: m.isc ?? 0,
            tempCoeffVoc: m.tempCoeff || -0.29,
        };

        const metrics = calculateStringMetrics(
            moduleSpecs,
            futureModulesPerString,
            minTemp
        );

        // Current for MPPT is sum of all strings in parallel
        const iscTotal = (m.isc ?? 0) * futureStringsCount;

        return {
            vocMax: metrics.vocMax,
            vmpMin: metrics.vmpMin,
            iscTotal,
            inverterMaxVoltage: specMppt.maxInputVoltage,
            vocStatus: metrics.vocMax > specMppt.maxInputVoltage
                ? 'error'
                : metrics.vocMax > specMppt.maxInputVoltage * 0.95
                    ? 'warning'
                    : 'ok',
            iscStatus: iscTotal > specMppt.maxCurrentPerMPPT ? 'error' : 'ok',
        };
    }, [modules, settings]);

    // ─── Computed: Available MPPTs & Pool ───────────────────

    const { availableMPPTs, unassignedPool } = useMemo(() => {
        const techInverters = toArray(techInvertersStore);
        const strings = useTechStore.getState().strings.entities;
        
        let totalAssigned = 0;
        
        const mppts = techInverters.flatMap(inv => {
            const spec = INVERTER_CATALOG.find((c: any) => c.id === inv.catalogId);
            if (!spec) return [];

            return inv.mpptConfigs.map(mppt => {
                const specMppt = spec.mppts?.find((m: any) => m.mpptId === mppt.mpptId);
                
                // Em V4, assignedCount é a soma de todos os módulos das strings associadas a este MPPT.
                const assignedCount = mppt.stringIds.reduce((acc, strId) => {
                    const str = strings[strId];
                    return acc + (str ? str.moduleIds.length : 0);
                }, 0);
                
                totalAssigned += assignedCount;

                return {
                    inverterId: inv.id,
                    inverterModel: inv.snapshot.model,
                    mpptId: mppt.mpptId,
                    logicalCapacity: 100, // No hard limit on structural capacity anymore
                    assignedCount,
                    isFull: false, 
                    maxVoltage: specMppt?.maxInputVoltage ?? 0,
                };
            });
        });

        const totalInventory = modules.length;
        const unassignedPool = Math.max(0, totalInventory - totalAssigned);

        return { availableMPPTs: mppts, unassignedPool };
    }, [techInvertersStore, modules, useTechStore.getState().strings]);

    return {
        assignLogical,
        unassignLogical,
        preview,
        availableMPPTs,
        unassignedPool
    };
}
