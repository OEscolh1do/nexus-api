import { useMemo, useCallback } from 'react';
import { calculateStringMetrics } from '../utils/electricalMath';
import { getModuleSpecs } from '../utils/specAdapter';
import { ENGINEERING_CONSTANTS } from '../constants/engineeringConstants';
import type { InverterState } from '../store/useTechStore';
import type { ModuleSpecs as CoreModuleSpecs } from '@/core/types';
import type { SystemValidationReport } from '../utils/electricalMath';
import type { AlertDescriptor } from '../ui/panels/canvas-views/electrical/components/DiagnosticAlertsList';

export interface MpptThermalProfile {
  mpptId: number;
  vocMax: number;
  vmpMin: number;
  vmpMax: number;
  vmpCalor: number;
}

export interface DashboardData {
  totalVocMax: number;
  totalIscMax: number;
  limitInverterVMax: number;
  limitMpptVMin: number;
  limitMpptVMax: number;
  limitIscMaxMppt: number;
  startupVoltage: number;
  mpptProfiles: MpptThermalProfile[];
  alerts: AlertDescriptor[];
  minModulesLimit: number;
  maxModulesLimit: number;
}

export interface MpptMetric {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  iscProtection: number;
  impTotal: number;
  powerKwp: number;
  hasMismatch: boolean;
  unitVmp: number;
  unitImp: number;
  unitIsc: number; // SWEEP11-AREA6 fix: add missing unitIsc for FuseDetailCard
}

export interface UseElectricalDashboardParams {
  activeInverter: InverterState | null;
  modules: CoreModuleSpecs[];
  tmin: number;
  tcellMax: number;
  electrical: SystemValidationReport | null;
}

export interface UseElectricalDashboardResult {
  dashboardData: DashboardData | null;
  mpptMetrics: Record<number, MpptMetric>;
  activeMpptCount: number;
  calcVmpCalor: (specs: any, modulesPerString: number) => number;
}

/**
 * useElectricalDashboard — Hook de Cálculo Elétrico
 *
 * Extrai lógica pesada de cálculo elétrico do ElectricalCanvasView para:
 * 1. Manter o componente enxuto
 * 2. Tornar os cálculos testáveis
 * 3. Prevenir drift de dependências
 *
 * @param params Parâmetros de entrada (inversor ativo, módulos, premissas térmicas, validação)
 * @returns Dados do dashboard, métricas por MPPT e função de cálculo Vmp no calor
 */
export function useElectricalDashboard(
  params: UseElectricalDashboardParams
): UseElectricalDashboardResult {
  const { activeInverter, modules, tmin, tcellMax, electrical } = params;

  // ── Cálculo de Vmp(calor) por MPPT ───────────────────────────────────────
  // FIX B1: usa tempCoeffVmp (coeficiente correto para Vmp) em vez de tempCoeffVoc.
  // tempCoeffVmp ≈ -0.34 %/°C vs tempCoeffVoc ≈ -0.29 %/°C — diferença de ~17%.
  // Norma: NBR 16690:2019, §4.3.1.2
  const calcVmpCalor = useCallback(
    (specs: any, modulesPerString: number): number => {
      if (!specs || modulesPerString <= 0) return 0;
      // Prioridade: tempCoeffVmp > tempCoeffPmax > tempCoeffVoc (fallback conservador)
      const tCoeffVmp = specs.tempCoeffVmp ?? specs.tempCoeffPmax ?? specs.tempCoeffVoc;
      const vmpCalor = specs.vmp * (1 + (tCoeffVmp / 100) * (tcellMax - 25)) * modulesPerString;
      return vmpCalor;
    },
    [tcellMax]
  );

  // ── Dados derivados do inversor ativo ─────────────────────────────────────
  const dashboardData = useMemo(() => {
    if (!activeInverter || modules.length === 0) return null;

    const limitInverterVMax = activeInverter.snapshot?.maxInputVoltage ?? 1000;
    const limitMpptVMin = activeInverter.snapshot?.minMpptVoltage ?? 150;
    const limitMpptVMax = activeInverter.snapshot?.maxMpptVoltage ?? 800;
    const limitIscMaxMppt = activeInverter.snapshot?.maxCurrentPerMPPT ?? 22;

    const repSpecs = getModuleSpecs(modules[0]);
    if (!repSpecs) return null;

    // ── Cálculo dos limites físicos por string (baseado no módulo padrão)
    const vocFrio1 = calculateStringMetrics(repSpecs, 1, tmin).vocMax;
    const vmpCalor1 = calcVmpCalor(repSpecs, 1);

    // Teto absoluto: Tensão de circuito aberto no frio extremo vs Limite do Inversor
    const maxModulesLimit = vocFrio1 > 0 ? Math.floor(limitInverterVMax / vocFrio1) : 40;

    // Piso de segurança
    const startupVoltage = (activeInverter.snapshot as any)?.startupVoltage ?? limitMpptVMin;
    const effectiveMinVoltage = Math.max(limitMpptVMin, startupVoltage);
    const minModulesLimit =
      vmpCalor1 > 0
        ? Math.ceil(effectiveMinVoltage / (vmpCalor1 * ENGINEERING_CONSTANTS.CC_VOLTAGE_DROP_FACTOR))
        : 0;

    let totalVocMax = 0;
    let totalIscMax = 0;
    const mpptProfiles: MpptThermalProfile[] = [];

    activeInverter.mpptConfigs.forEach((mppt) => {
      const specificModule = mppt.moduleModel
        ? modules.find((m) => m.model === mppt.moduleModel)
        : modules[0];
      const specs = getModuleSpecs(specificModule);
      if (!specs) return;

      const activeStrings = mppt.strings?.length
        ? mppt.strings
        : Array.from({ length: mppt.stringsCount || 0 }).map(() => ({
            modulesCount: mppt.modulesPerString || 0,
          }));

      if (activeStrings.length > 0 && activeStrings.some((s) => s.modulesCount > 0)) {
        const maxMods = Math.max(...activeStrings.map((s) => s.modulesCount));
        const metrics = calculateStringMetrics(specs, maxMods, tmin);
        const vmpCalor = calcVmpCalor(specs, maxMods);
        const iscMppt = specs.isc * activeStrings.length;

        if (metrics.vocMax > totalVocMax) totalVocMax = metrics.vocMax;
        if (iscMppt > totalIscMax) totalIscMax = iscMppt;

        mpptProfiles.push({
          mpptId: mppt.mpptId,
          vocMax: metrics.vocMax,
          vmpMin: metrics.vmpMin,
          vmpMax: metrics.vmpMax,
          vmpCalor,
        });
      }
    });

    const alerts: AlertDescriptor[] = [];
    electrical?.entries?.forEach((entry) => {
      entry.messages.forEach((msg, idx) => {
        alerts.push({
          id: `${entry.mpptId}-${idx}`,
          mpptId: entry.mpptId.toString(),
          severity: entry.status === 'error' ? 'error' : 'warning',
          message: msg,
        });
      });
    });

    return {
      totalVocMax,
      totalIscMax,
      limitInverterVMax,
      limitMpptVMin,
      limitMpptVMax,
      limitIscMaxMppt,
      startupVoltage,
      mpptProfiles,
      alerts,
      minModulesLimit,
      maxModulesLimit,
    };
  }, [activeInverter, modules, tmin, electrical, calcVmpCalor]);

  // ── Métricas por MPPT para o Strip ────────────────────────────────────────
  const mpptMetrics = useMemo(() => {
    if (!activeInverter || modules.length === 0) return {};
    const result: Record<number, MpptMetric> = {};

    activeInverter.mpptConfigs.forEach((mppt) => {
      const specificModule = mppt.moduleModel
        ? modules.find((m) => m.model === mppt.moduleModel)
        : modules[0];
      const specs = getModuleSpecs(specificModule);
      if (!specs) return;

      const activeStrings = mppt.strings?.length
        ? mppt.strings
        : Array.from({ length: mppt.stringsCount || 0 }).map(() => ({
            modulesCount: mppt.modulesPerString || 0,
          }));

      const strCount = activeStrings.length;
      const maxMods = strCount > 0 ? Math.max(...activeStrings.map((s) => s.modulesCount)) : 0;
      const totalMods = activeStrings.reduce((acc, s) => acc + s.modulesCount, 0);

      const metrics = maxMods > 0 ? calculateStringMetrics(specs, maxMods, tmin) : null;
      const vmpCalor = maxMods > 0 ? calcVmpCalor(specs, maxMods) : 0;

      const bifacialFactor = specs.isBifacial ? 1 + 0.7 * specs.albedo : 1;

      const mpptEntry = electrical?.entries?.find((e) => e.mpptId === mppt.mpptId);
      const hasMismatch =
        mpptEntry?.messages.some((m) => m.includes('Sistema Multi-orientado')) || false;

      result[mppt.mpptId] = {
        vocFrio: metrics?.vocMax ?? 0,
        vmpCalor,
        // FIX D2: iscTotal SEM fator 1.25 — para comparação com limite de hardware do MPPT.
        // O fator 1.25 (NBR 16690 §5.3.11.1) é para dimensionamento de proteções (fusíveis),
        // NÃO para comparar com maxCurrentPerMPPT do datasheet do inversor.
        iscTotal: (specs.isc || 0) * strCount * bifacialFactor,
        // iscProtection: valor majorado 1.25× para dimensionar fusíveis/DPS (exibir separado)
        iscProtection: (specs.isc || 0) * strCount * bifacialFactor * 1.25,
        impTotal: (specs.imp || 0) * strCount * bifacialFactor,
        powerKwp: totalMods > 0 ? (specs.pmax * totalMods) / 1000 : 0,
        hasMismatch,
        unitVmp: specs.vmp,
        unitImp: specs.imp,
        unitIsc: specs.isc, // SWEEP11-AREA6 fix: populate unitIsc for fuse rating display
      };
    });
    return result;
  }, [activeInverter, modules, tmin, calcVmpCalor, electrical]);

  const activeMpptCount = useMemo(() => {
    return Object.values(mpptMetrics).filter((m) => m.powerKwp > 0).length;
  }, [mpptMetrics]);

  return { dashboardData, mpptMetrics, activeMpptCount, calcVmpCalor };
}
