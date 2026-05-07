import { useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { calculateProjectionStats } from '@/modules/engineering/utils/projectionMath';

export function useProposalPageData() {
  const clientData        = useSolarStore((s) => s.clientData);
  const proposalData      = useSolarStore((s) => s.proposalData);
  const getSimulatedTotal = useSolarStore((s) => s.getSimulatedTotal);
  const modules           = useSolarStore(selectModules);
  const isExportingPdf    = useSolarStore((s) => s.isExportingPdf);

  const inverters    = useTechStore((s) => s.inverters.entities);
  const inverterIds  = useTechStore((s) => s.inverters.ids);
  // Select only the fields needed for projection — avoids re-render on any tech store change
  const prCalculationMode          = useTechStore((s) => s.prCalculationMode);
  const getAdditivePerformanceRatio = useTechStore((s) => s.getAdditivePerformanceRatio);
  const getPerformanceRatio        = useTechStore((s) => s.getPerformanceRatio);
  const cosip                      = useTechStore((s) => s.cosip);

  const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000;
  const totalModules  = modules.reduce((acc, m) => acc + (m.quantity || 1), 0);
  const firstModule   = modules[0] ?? null;
  const firstInverter = inverterIds.length > 0 ? (inverters[inverterIds[0]] ?? null) : null;

  const stats = useMemo(() => {
    const prDecimal = prCalculationMode === 'additive'
      ? getAdditivePerformanceRatio()
      : getPerformanceRatio();

    const simulatedAddedLoad    = getSimulatedTotal();
    const additionalLoadsMonthly = Array(12).fill(simulatedAddedLoad) as number[];

    return calculateProjectionStats({
      totalPowerKw: totalPowerKwp,
      hsp: (clientData.monthlyIrradiation || Array(12).fill(0)) as number[],
      monthlyConsumption: (clientData.invoices?.[0]?.monthlyHistory || Array(12).fill(clientData.averageConsumption)) as number[],
      additionalLoadsMonthly,
      prDecimal: prDecimal || 0.75,
      tariffRate: clientData.tariffRate || 0.92,
      connectionType: clientData.connectionType,
      cosip,
    });
  }, [modules, clientData, prCalculationMode, getAdditivePerformanceRatio, getPerformanceRatio, cosip, getSimulatedTotal, totalPowerKwp]);

  const monthlyGenAvg = Math.round(stats.totalGen / 12);

  return {
    clientData,
    proposalData,
    modules,
    totalPowerKwp,
    totalModules,
    firstModule,
    firstInverter,
    inverterIds,
    stats,
    monthlyGenAvg,
    isExportingPdf,
  };
}
