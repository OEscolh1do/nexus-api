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
 * useStringAssignment
 *
 * Encapsulates module ↔ MPPT assignment logic (T3 · P6-1).
 * - `assign()`:  assigns modules to a specific MPPT
 * - `unassign()`: clears stringData from given modules
 * - `preview()`:  returns a validation preview BEFORE committing
 */
export function useStringAssignment() {
    const modules = useSolarStore(selectModules);
    const settings = useSolarStore(state => state.settings);
    const placedModules = useSolarStore(state => state.project.placedModules);
    const assignAction = useSolarStore(state => state.assignModulesToString);
    const { inverters: techInvertersStore } = useTechStore();

    // ─── Assign Modules ─────────────────────────────

    const assign = useCallback((
        moduleIds: string[],
        inverterId: string,
        mpptId: number
    ) => {
        assignAction(moduleIds, inverterId, mpptId);
    }, [assignAction]);

    // ─── Unassign Modules ───────────────────────────

    const unassign = useCallback((moduleIds: string[]) => {
        // Setting inverterId to '' and mpptId to 0 clears the assignment
        // The projectSlice will create stringData: { inverterId: '', mpptId: 0 }
        // UI logic should treat empty inverterId as "unassigned"
        assignAction(moduleIds, '', 0);
    }, [assignAction]);

    // ─── Preview Before Assign ──────────────────────

    const preview = useCallback((
        moduleIds: string[],
        inverterId: string,
        mpptId: number
    ): AssignmentPreview | null => {
        if (modules.length === 0 || moduleIds.length === 0) return null;

        const m = modules[0]; // Assumes homogeneous system
        const techInverters = toArray(techInvertersStore);
        const techInv = techInverters.find(
            ti => ti.id === inverterId || ti.catalogId === inverterId
        );
        if (!techInv) return null;

        const spec = INVERTER_CATALOG.find((c: any) => c.id === techInv.catalogId);
        if (!spec) return null;

        const specMppt = spec.mppts?.find((mp: any) => mp.mpptId === mpptId) || spec.mppts?.[0];
        if (!specMppt) return null;

        const mpptConfig = techInv.mpptConfigs.find(c => c.mpptId === mpptId);
        const stringsCount = mpptConfig?.stringsCount || 1;

        // Simulate: what would the string look like after assignment?
        const futureModulesPerString = moduleIds.length / stringsCount;
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

        const iscTotal = (m.isc ?? 0) * stringsCount;

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
    }, [modules, settings, techInvertersStore]);

    // ─── Computed: Available MPPTs ───────────────────

    const availableMPPTs = useMemo(() => {
        const techInverters = toArray(techInvertersStore);
        return techInverters.flatMap(inv => {
            const spec = INVERTER_CATALOG.find((c: any) => c.id === inv.catalogId);
            if (!spec) return [];

            return inv.mpptConfigs.map(mppt => {
                const specMppt = spec.mppts?.find((m: any) => m.mpptId === mppt.mpptId);
                const assignedCount = placedModules.filter(
                    pm => pm.stringData?.inverterId === inv.id && pm.stringData?.mpptId === mppt.mpptId
                ).length;

                return {
                    inverterId: inv.id,
                    inverterModel: inv.snapshot.model,
                    mpptId: mppt.mpptId,
                    logicalCapacity: mppt.modulesPerString * mppt.stringsCount,
                    assignedCount,
                    isFull: assignedCount >= (mppt.modulesPerString * mppt.stringsCount),
                    maxVoltage: specMppt?.maxInputVoltage ?? 0,
                };
            });
        });
    }, [techInvertersStore, placedModules]);

    return {
        assign,
        unassign,
        preview,
        availableMPPTs,
    };
}
