import { useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { useProjectContext } from '@/hooks/useProjectContext';
import { PVModule } from '@/modules/crm/constants/pvModules';
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

export const useTechCalculations = (selectedModule?: PVModule): TechCalculationResult => {
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
        return Math.ceil((requiredPowerKw * 1000) / selectedModule.electrical.pmax);
    }, [requiredPowerKw, selectedModule]);

    // 3. Occupied Area
    const requiredArea = useMemo(() => {
        if (!selectedModule || suggestedQty <= 0) return 0;
        // Area = Qty * Width * Length (mm to m conversion)
        const areaPerModule = (selectedModule.dimensions.length * selectedModule.dimensions.width) / 1_000_000;
        // Alternatively use pre-calculated area property if robust
        return suggestedQty * (selectedModule.area || areaPerModule);
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
