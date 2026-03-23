import { useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { useProjectContext } from '@/hooks/useProjectContext';
import type { ModuleSpecs } from '@/core/schemas/equipment.schemas';

/**
 * @deprecated Alias mantido para facilitar transição e não quebrar imports existentes. Use `ModuleSpecs` diretamente se possível.
 */
export type PVModule = ModuleSpecs;
// Confirmed clean imports

interface TechCalculationResult {
    suggestedQty: number;
    requiredPowerKw: number;
    requiredArea: number;
    isFeasible: boolean;
    targetConsumption: number;
    hsp: number;
    performanceRatio: number;
}

const DEFAULT_PERFORMANCE_RATIO = 0.75; // 75%

export const useTechCalculations = (selectedModule?: ModuleSpecs): TechCalculationResult => {
    // Project Context Bridge
    const { energyGoal, climate, constraints } = useProjectContext();
    const settings = useSolarStore(state => state.settings);

    // Factors from Context
    const targetConsumption = energyGoal.monthlyTarget;
    const hsp = climate.hsp;
    
    // PR from settings or default
    const performanceRatio = settings?.performanceRatio || DEFAULT_PERFORMANCE_RATIO;

    // 1. Required Generator Power (kWp)
    // Formula: Consumption / (HSP * 30 * PR)
    const requiredPowerKw = useMemo(() => {
        if (targetConsumption <= 0 || hsp <= 0) return 0;
        return targetConsumption / (hsp * 30 * performanceRatio);
    }, [targetConsumption, hsp, performanceRatio]);

    // 2. Quantity of Modules
    const suggestedQty = useMemo(() => {
        if (!selectedModule || requiredPowerKw <= 0) return 0;
        // Module power is usually in Watts, convert requiredPower to Watts
        return Math.ceil((requiredPowerKw * 1000) / selectedModule.power);
    }, [requiredPowerKw, selectedModule]);

    // 3. Occupied Area
    const requiredArea = useMemo(() => {
        if (!selectedModule || suggestedQty <= 0) return 0;
        // The area is already computed in ModuleSpecs (in m²)
        return suggestedQty * (selectedModule.area || 0);
    }, [suggestedQty, selectedModule]);

    // 4. Feasibility Check
    const isFeasible = useMemo(() => {
        const available = constraints.area;
        // If available area is 0 (not drawn), we assume feasible or warn differently?
        // Let's assume strict check if available > 0
        if (available <= 0) return true; // Pass if no constraint defined
        return requiredArea <= available;
    }, [requiredArea, constraints.area]);

    return {
        suggestedQty,
        requiredPowerKw,
        requiredArea,
        isFeasible,
        targetConsumption,
        hsp,
        performanceRatio
    };
};
