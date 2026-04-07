import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../store/useTechStore';
import { useProjectContext } from '@/hooks/useProjectContext';
import { toArray } from '@/core/types/normalized.types';

export const useTechKPIs = () => {
    // 1. Consume data from stores
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(state => state.clientData);

    const {
        lossProfile,
        getPerformanceRatio,
        getAdditivePerformanceRatio,
        prCalculationMode,
        inverters: techInvertersNormalized,
        strings: techStringsNormalized
    } = useTechStore();

    // PRÉ-1: converter NormalizedCollection para array para cálculos
    const techInverters = useMemo(() => toArray(techInvertersNormalized), [techInvertersNormalized]);
    const techStrings = useMemo(() => toArray(techStringsNormalized), [techStringsNormalized]);

    const { energyGoal } = useProjectContext();

    // 2. Memoized Main KPIs Calculations
    const kpi = useMemo(() => {
        // DC Efetivo: Só contabilizamos a potência de módulos conectados a uma string ATIVA num MPPT (Inversor)
        const efetiveModulesId = new Set(
            techStrings.filter(s => s.mpptId !== null).flatMap(s => s.moduleIds)
        );

        // Total DC Power (kWp) efetivamente conectada
        const totalDC = modules
            .filter(m => efetiveModulesId.has(m.id))
            .reduce((acc, m) => acc + (m.power), 0) / 1000;

        // Total AC Power (kW) - Using Snapshot (Source of Truth já está em kW)
        const totalAC = techInverters.reduce((acc, inv) => {
            return acc + (inv.snapshot?.nominalPower || 0) * inv.quantity;
        }, 0);

        // Area Usage
        const usedArea = modules.reduce((acc, m) => acc + (m.area), 0);
        const availableArea = clientData.availableArea || 0;
        const areaUsagePercent = availableArea > 0 ? (usedArea / availableArea) * 100 : 0;

        // Inverter Sizing Factor (FDI / DC/AC Ratio)
        const dcAcRatio = totalAC > 0 ? totalDC / totalAC : 0;

        // ENERGY TARGET (ESTIMATED MONTHLY)
        // Heuristic: TotalDC (kWp) * Irradiance (4.5) * Days (30) * PR
        // 1. Get PR Decimal (0.XX) from store selector logic
        const efficiencyFactor = getAdditivePerformanceRatio(); // Defaulting to Additive for safety in bar

        const estimatedGeneration = totalDC * 4.5 * 30 * efficiencyFactor;

        // Target from Context Bridge (includes simulated loads)
        const targetConsumption = energyGoal.monthlyTarget || 0;

        const generationCoverage = targetConsumption > 0
            ? (estimatedGeneration / targetConsumption) * 100
            : 0;

        return {
            totalDC,
            totalAC,
            usedArea,
            availableArea,
            areaUsagePercent,
            dcAcRatio,
            estimatedGeneration,
            targetConsumption,
            generationCoverage
        };
    }, [modules, techInverters, techStrings, energyGoal.monthlyTarget, getAdditivePerformanceRatio, clientData.availableArea]);

    // 3. PR Calculation Priority Logic
    const prDecimalIEC = getPerformanceRatio();
    const prValueIEC = (prDecimalIEC * 100).toFixed(1);

    const prDecimalAdditive = getAdditivePerformanceRatio();
    const prValueAdditive = (prDecimalAdditive * 100).toFixed(1);

    // Determine Logic
    const isAdditive = prCalculationMode === 'additive';

    // Main Display Value (Hero)
    const displayedPr = isAdditive ? prValueAdditive : prValueIEC;
    const displayedLabel = isAdditive ? "PR (Soma Simples)" : "PR (IEC 61724)";

    return {
        kpi,
        displayedPr,
        displayedLabel,
        isAdditive,
        prValueIEC,
        prValueAdditive,
        lossProfile
    };
};
