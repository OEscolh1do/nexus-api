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
    
    const { inverters: techInvertersStore, updateMPPTConfig } = useTechStore();

    // ─── Assign Logical Modules ─────────────────────────────

    const assignLogical = useCallback((
        quantity: number,
        inverterId: string,
        mpptId: number
    ) => {
        const inv = techInvertersStore.entities[inverterId];
        if (!inv) return;
        const mppt = inv.mpptConfigs.find(m => m.mpptId === mpptId);
        if (!mppt) return;
        
        const currentTotal = mppt.modulesPerString * mppt.stringsCount;
        const nextTotal = currentTotal + quantity;
        
        // By default, group in a single string unless previously split
        // The electrical math handles validation.
        updateMPPTConfig(inverterId, mpptId, {
           stringsCount: mppt.stringsCount > 0 ? mppt.stringsCount : 1,
           modulesPerString: mppt.stringsCount > 0 ? Math.floor(nextTotal / mppt.stringsCount) : nextTotal
        });
    }, [techInvertersStore, updateMPPTConfig]);

    // ─── Unassign Logical Modules ───────────────────────────

    const unassignLogical = useCallback((
        quantity: number,
        inverterId: string,
        mpptId: number
    ) => {
        const inv = techInvertersStore.entities[inverterId];
        if (!inv) return;
        const mppt = inv.mpptConfigs.find(m => m.mpptId === mpptId);
        if (!mppt) return;
        
        const currentTotal = mppt.modulesPerString * mppt.stringsCount;
        const nextTotal = Math.max(0, currentTotal - quantity);
        
        updateMPPTConfig(inverterId, mpptId, {
           stringsCount: mppt.stringsCount > 0 ? mppt.stringsCount : 1,
           modulesPerString: mppt.stringsCount > 0 ? Math.floor(nextTotal / mppt.stringsCount) : nextTotal
        });
    }, [techInvertersStore, updateMPPTConfig]);

    // ─── Preview Before Assign ──────────────────────

    const preview = useCallback((
        quantityToAdd: number,
        inverterId: string,
        mpptId: number
    ): AssignmentPreview | null => {
        if (modules.length === 0 || quantityToAdd <= 0) return null;

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
        const currentTotal = (mpptConfig?.modulesPerString || 0) * stringsCount;

        // Simulate new math
        const futureModulesPerString = (currentTotal + quantityToAdd) / stringsCount;
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

    // ─── Computed: Available MPPTs & Pool ───────────────────

    const { availableMPPTs, unassignedPool } = useMemo(() => {
        const techInverters = toArray(techInvertersStore);
        let totalAssigned = 0;
        
        const mppts = techInverters.flatMap(inv => {
            const spec = INVERTER_CATALOG.find((c: any) => c.id === inv.catalogId);
            if (!spec) return [];

            return inv.mpptConfigs.map(mppt => {
                const specMppt = spec.mppts?.find((m: any) => m.mpptId === mppt.mpptId);
                const assignedCount = mppt.modulesPerString * mppt.stringsCount;
                totalAssigned += assignedCount;

                return {
                    inverterId: inv.id,
                    inverterModel: inv.snapshot.model,
                    mpptId: mppt.mpptId,
                    logicalCapacity: 100, // No hard limit on structural capacity anymore, guided by electrical
                    assignedCount,
                    isFull: false, // In logical flow, it's never structurally "full" unless electrically blocked
                    maxVoltage: specMppt?.maxInputVoltage ?? 0,
                };
            });
        });

        const totalInventory = modules.reduce((acc, m) => acc + (m.quantity || 0), 0);
        const unassignedPool = Math.max(0, totalInventory - totalAssigned);

        return { availableMPPTs: mppts, unassignedPool };
    }, [techInvertersStore, modules]);

    return {
        assignLogical,
        unassignLogical,
        preview,
        availableMPPTs,
        unassignedPool
    };
}
