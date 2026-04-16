/**
 * =============================================================================
 * SYSTEM COMPOSITION SLICE — Seletores Derivados para os Chips do Compositor
 * =============================================================================
 *
 * NÃO armazena dados de domínio. Apenas lê de:
 * - solarStore.clientData (consumo, HSP)
 * - solarStore.journeySlice.kWpAlvo
 * - useTechStore (módulos, inversores configurados)
 * - useElectricalValidation (validação elétrica)
 *
 * Expõe seletores que os blocos do LeftOutliner consomem via hooks.
 * Segue o princípio: estado derivado não é persistido, não é duplicado.
 *
 * Spec 03 — Compositor de Blocos (§4)
 * =============================================================================
 */

import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';

// =============================================================================
// TYPES
// =============================================================================

export type ChipSeverityLevel = 'ok' | 'warn' | 'error' | 'neutral';

export interface BlockChip {
  label: string;
  value: string;
  severity: ChipSeverityLevel;
}

export interface BlockStatus {
  status: 'complete' | 'warning' | 'error' | 'empty';
  chips: BlockChip[];
}

export interface ConnectorStatus {
  label: string;
  value: string;
  active: boolean;
}

export interface SystemCompositionView {
  consumptionBlock: BlockStatus;
  moduleBlock: BlockStatus;
  inverterBlock: BlockStatus;
  /** C1: Consumo → Módulos (kWp alvo) */
  connectorC1: ConnectorStatus;
  /** C2: Módulos → Inversor (topologia) */
  connectorC2: ConnectorStatus;
}

// =============================================================================
// HOOK PRINCIPAL — useSystemComposition()
// =============================================================================

/**
 * Hook que deriva toda a visão do Compositor a partir dos stores de domínio.
 * Zero estado local, zero persistência. Puro selector.
 */
export function useSystemComposition(): SystemCompositionView {
  // — Consumo —
  const clientData = useSolarStore(s => s.clientData);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const avgConsumption = clientData?.averageConsumption || 0;
  const validHsp = (clientData?.monthlyIrradiation || []).filter((v: number) => v > 0);
  const avgHsp = validHsp.length > 0
    ? validHsp.reduce((a: number, b: number) => a + b, 0) / validHsp.length
    : 0;

  // — Módulos —
  const modules = useSolarStore(selectModules);
  const totalModules = modules.length;
  const totalDcKwp = modules.reduce((sum, m) => sum + ((m.power || 0) / 1000), 0);

  // — Inversores (TechStore) —
  const techInverters = toArray(useTechStore(s => s.inverters));
  const techInv = techInverters[0] ?? null;

  // — Validação Elétrica —
  const { electrical } = useElectricalValidation();
  const inverterEntries = electrical?.entries?.filter((e: any) => e.inverterId === techInv?.id) || [];
  const hasElecError = inverterEntries.some((e: any) => e.status === 'error');
  const hasElecWarn = inverterEntries.some((e: any) => e.status === 'warning');

  // =========================================================================
  // BLOCO CONSUMO
  // =========================================================================
  const consumptionChips: BlockChip[] = [];
  if (avgConsumption > 0) {
    consumptionChips.push({ label: 'Média', value: `${Math.round(avgConsumption)} kWh`, severity: 'ok' });
  }
  if (avgHsp > 0) {
    consumptionChips.push({ label: 'HSP', value: `${avgHsp.toFixed(1)} h/dia`, severity: 'ok' });
  }
  if (loadGrowthFactor > 0) {
    consumptionChips.push({ label: 'Crescimento', value: `+${loadGrowthFactor}%`, severity: 'warn' });
  }

  const consumptionBlock: BlockStatus = {
    status: avgConsumption > 0 ? 'complete' : 'empty',
    chips: consumptionChips,
  };

  // =========================================================================
  // BLOCO MÓDULOS
  // =========================================================================
  const moduleChips: BlockChip[] = [];
  const isKwpMet = kWpAlvo !== null && kWpAlvo > 0 && totalDcKwp >= kWpAlvo * 0.98;

  if (totalDcKwp > 0) {
    moduleChips.push({
      label: 'DC',
      value: `${totalDcKwp.toFixed(2)} kWp`,
      severity: isKwpMet ? 'ok' : 'warn',
    });
  }
  if (totalModules > 0) {
    moduleChips.push({ label: 'Qtd', value: `${totalModules} un.`, severity: 'neutral' });
  }
  if (kWpAlvo !== null && !isKwpMet && totalDcKwp > 0) {
    moduleChips.push({ label: 'Alvo', value: `${kWpAlvo} kWp`, severity: 'warn' });
  }

  const moduleBlock: BlockStatus = {
    status: totalModules === 0 ? 'empty' : isKwpMet ? 'complete' : 'warning',
    chips: moduleChips,
  };

  // =========================================================================
  // BLOCO INVERSOR
  // =========================================================================
  const inverterChips: BlockChip[] = [];
  if (techInv) {
    const displayPower = useSolarStore.getState().inverters?.entities?.[techInv.id]?.nominalPower ?? 0;
    const ratioValue = displayPower > 0 ? totalDcKwp / displayPower : 0;

    if (ratioValue > 0) {
      const ratioOk = ratioValue >= 1.05 && ratioValue <= 1.35;
      inverterChips.push({
        label: 'Ratio',
        value: ratioValue.toFixed(2),
        severity: ratioValue >= 1.10 && ratioValue <= 1.25 ? 'ok' : ratioOk ? 'warn' : 'error',
      });
    }

    const maxVoc = inverterEntries.length > 0 ? Math.max(...inverterEntries.map((e: any) => e.vocMax || 0)) : 0;
    if (maxVoc > 0) {
      inverterChips.push({
        label: 'Voc',
        value: `${maxVoc.toFixed(0)}V`,
        severity: maxVoc <= (displayPower * 120) ? 'ok' : 'warn', // simplificado
      });
    }
  }

  const inverterBlock: BlockStatus = {
    status: !techInv ? 'empty'
      : hasElecError ? 'error'
      : hasElecWarn ? 'warning'
      : 'complete',
    chips: inverterChips,
  };

  // =========================================================================
  // CONECTORES
  // =========================================================================
  const connectorC1: ConnectorStatus = {
    label: 'kWp Alvo',
    value: kWpAlvo !== null ? `${kWpAlvo} kWp` : '—',
    active: kWpAlvo !== null,
  };

  const firstEntryVoc = inverterEntries[0]?.vocMax ?? 0;
  const stringCount = techInv?.mpptConfigs?.length ?? 0;
  const connectorC2: ConnectorStatus = {
    label: stringCount > 0 ? `${stringCount} strings` : '—',
    value: firstEntryVoc > 0 ? `Voc ${firstEntryVoc.toFixed(0)}V` : '—',
    active: totalModules > 0 && techInv !== null,
  };

  return {
    consumptionBlock,
    moduleBlock,
    inverterBlock,
    connectorC1,
    connectorC2,
  };
}
