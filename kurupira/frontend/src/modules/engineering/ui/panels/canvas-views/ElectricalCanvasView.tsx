import React, { useMemo, useState, useCallback } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { toArray } from '@/core/types/normalized.types';
import { Zap, Cpu, Sun } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { calculateStringMetrics } from '../../../utils/electricalMath';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';

// Componentes do Hub + Strip + Canvas
import { InverterHub, type InverterChipData, type ValidationPill } from './electrical/InverterHub';
import { MPPTConfigStrip } from './electrical/MPPTConfigStrip';
import { VoltageRangeChart, type MpptThermalProfile } from './electrical/VoltageRangeChart';
import { ElectricalDiagnosticPanel } from './electrical/ElectricalDiagnosticPanel';
import { StringTopologyViewer } from './electrical/StringTopologyViewer';
import { AlertDescriptor } from './electrical/components/DiagnosticAlertsList';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE FALLBACK POR UF (pior cenário — Q5 sem manualTmax)
// ─────────────────────────────────────────────────────────────────────────────
const ESTADOS_TROPICAIS = new Set(['AM','PA','RR','AP','AC','RO','TO','MA','PI','CE','RN','PB','PE','AL','SE','BA']);

const TMIN_POR_UF: Record<string, number> = {
  RS: 0, SC: 2, PR: 5, SP: 8, MG: 8, RJ: 12, ES: 12,
  MS: 8, GO: 10, DF: 8, MT: 15,
  BA: 15, SE: 18, AL: 18, PE: 18, PB: 18, RN: 18,
  CE: 20, PI: 20, MA: 22, TO: 20,
  PA: 22, AM: 22, AC: 20, RO: 20, RR: 22, AP: 22,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const resolveTemps = (
  settings: any,
  clientData: any
): { tmin: number; tamb_max: number } => {
  const uf = clientData?.state ?? '';
  const isTropical = ESTADOS_TROPICAIS.has(uf);
  const tmin = settings?.manualTmin ?? TMIN_POR_UF[uf] ?? 10;
  const tamb_max = settings?.manualTmax ?? (isTropical ? 35 : 30);
  return { tmin, tamb_max };
};

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICAL CANVAS VIEW v2.0 — Hub + Strip + Canvas
// ─────────────────────────────────────────────────────────────────────────────
export const ElectricalCanvasView: React.FC = () => {
  const settings   = useSolarStore(state => state.settings);
  const clientData  = useSolarStore(state => state.clientData);
  const modules     = useSolarStore(selectModules);

  const invertersNorm    = useTechStore(state => state.inverters);
  const updateMPPTConfig = useTechStore(state => state.updateMPPTConfig);
  const addInverterTech  = useTechStore(state => state.addInverter);
  const removeInverterTech = useTechStore(state => state.removeInverter);

  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
  const { kpi }        = useTechKPIs();
  const { electrical, globalHealth } = useElectricalValidation();
  const { inverters: catalogInverters } = useCatalogStore();

  const techInverters   = useMemo(() => toArray(invertersNorm), [invertersNorm]);
  const [activeInverterId, setActiveInverterId] = useState<string | null>(null);

  // Resolução do inversor ativo (multi-inversor Tier 2 — default [0])
  const activeInverter = useMemo(() => {
    if (activeInverterId) return techInverters.find(i => i.id === activeInverterId) ?? techInverters[0] ?? null;
    return techInverters[0] ?? null;
  }, [techInverters, activeInverterId]);

  const repModule = modules[0] ?? null;

  // T1-A: campo correto — electrical.tempCoeffVoc (não .tempCoeff)
  const moduleSpecs = useMemo(() => {
    if (!repModule) return null;
    return {
      voc:         repModule.voc,
      vmp:         repModule.vmp ?? repModule.voc * 0.82,
      isc:         repModule.isc ?? 0,
      tempCoeffVoc: (repModule as any).electrical?.tempCoeffVoc ?? repModule.tempCoeff ?? -0.29,
    };
  }, [repModule]);

  // ── Temperaturas com fallback por UF ─────────────────────────────────────
  const { tmin, tamb_max } = useMemo(
    () => resolveTemps(settings, clientData),
    [settings, clientData]
  );

  // ── Cálculo de Vmp(calor) por MPPT ───────────────────────────────────────
  const calcVmpCalor = useCallback((modulesPerString: number): number => {
    if (!moduleSpecs || modulesPerString <= 0) return 0;
    const noct = (repModule as any)?.noct ?? 45;
    const tcell_max = tamb_max + (noct - 20) * (1000 / 800);
    const vmpCalor = moduleSpecs.vmp * (1 + (moduleSpecs.tempCoeffVoc / 100) * (tcell_max - 25)) * modulesPerString;
    return vmpCalor;
  }, [moduleSpecs, tamb_max, repModule]);

  // ── Dados derivados do inversor ativo ─────────────────────────────────────
  const dashboardData = useMemo(() => {
    if (!activeInverter || !moduleSpecs) return null;

    const limitInverterVMax  = activeInverter.snapshot?.maxInputVoltage ?? 1000;
    const limitMpptVMin      = activeInverter.snapshot?.minMpptVoltage ?? 150;
    const limitMpptVMax      = activeInverter.snapshot?.maxMpptVoltage ?? 800;
    const limitIscMaxMppt    = activeInverter.snapshot?.maxCurrentPerMPPT ?? 22;

    let totalVocMax = 0;
    let totalIscMax = 0;
    const mpptProfiles: MpptThermalProfile[] = [];

    activeInverter.mpptConfigs.forEach(mppt => {
      const mods     = mppt.modulesPerString || 0;
      const strCount = mppt.stringsCount || 0;
      if (mods > 0 && strCount > 0) {
        const metrics  = calculateStringMetrics(moduleSpecs, mods, tmin);
        const vmpCalor = calcVmpCalor(mods);
        const iscMppt  = moduleSpecs.isc * strCount;
        if (metrics.vocMax > totalVocMax) totalVocMax = metrics.vocMax;
        if (iscMppt > totalIscMax) totalIscMax = iscMppt;
        mpptProfiles.push({
          mpptId:   mppt.mpptId,
          vocMax:   metrics.vocMax,
          vmpMin:   metrics.vmpMin,
          vmpMax:   metrics.vmpMax,
          vmpCalor,
        });
      }
    });

    const alerts: AlertDescriptor[] = [];
    electrical?.entries?.forEach(entry => {
      entry.messages.forEach((msg, idx) => {
        alerts.push({
          id:       `${entry.mpptId}-${idx}`,
          mpptId:   entry.mpptId.toString(),
          severity: entry.status === 'error' ? 'error' : 'warning',
          message:  msg,
        });
      });
    });

    return {
      totalVocMax, totalIscMax,
      limitInverterVMax, limitMpptVMin, limitMpptVMax, limitIscMaxMppt,
      mpptProfiles, alerts,
    };
  }, [activeInverter, moduleSpecs, tmin, electrical, calcVmpCalor]);

  // ── Métricas por MPPT para o Strip ────────────────────────────────────────
  const mpptMetrics = useMemo(() => {
    if (!activeInverter || !moduleSpecs) return {};
    const result: Record<number, any> = {};
    activeInverter.mpptConfigs.forEach(mppt => {
      const mods     = mppt.modulesPerString || 0;
      const strCount = mppt.stringsCount || 0;
      const metrics  = mods > 0 ? calculateStringMetrics(moduleSpecs, mods, tmin) : null;
      const vmpCalor = mods > 0 ? calcVmpCalor(mods) : 0;
      const localPmax = (repModule as any)?.electrical?.pmax || (repModule as any)?.pmax || 0;

      // Mismatch: verifica se azimute difere entre configs — simplificado
      // (comparação futura entre stringIds quando Tier 3 estiver disponível)
      result[mppt.mpptId] = {
        vocFrio:    metrics?.vocMax ?? 0,
        vmpCalor,
        iscTotal:   (moduleSpecs.isc || 0) * strCount,
        powerKwp:   mods > 0 && strCount > 0 ? (localPmax * mods * strCount) / 1000 : 0,
        hasMismatch: false, // Tier 3: detectar por azimuthDeg das strings
      };
    });
    return result;
  }, [activeInverter, moduleSpecs, tmin, calcVmpCalor, repModule]);

  // ── Chips de validação para o Hub ─────────────────────────────────────────
  const validationPills: ValidationPill[] = useMemo(() => {
    if (!dashboardData) return [];
    const { totalVocMax, totalIscMax, limitInverterVMax, limitIscMaxMppt } = dashboardData;

    const fdi = kpi.dcAcRatio;
    const pills: ValidationPill[] = [];

    // FDI — 5 faixas
    if (fdi > 0) {
      const fdiSev: ValidationPill['severity'] =
        fdi < 1.00 || fdi > 1.50 ? 'error' :
        fdi <= 1.10 || (fdi > 1.35 && fdi <= 1.50) ? 'warn' : 'ok';
      pills.push({ label: 'FDI', value: `${(fdi * 100).toFixed(0)}%`, severity: fdiSev,
        tooltip: `FDI = P_CC / P_CA. Ideal: 110–135%.` });
    }

    // Voc
    if (totalVocMax > 0) {
      const vocRatio = totalVocMax / limitInverterVMax;
      const vocSev: ValidationPill['severity'] = vocRatio > 1 ? 'error' : vocRatio > 0.95 ? 'warn' : 'ok';
      pills.push({ label: 'Voc', value: `${totalVocMax.toFixed(0)}V`, severity: vocSev,
        tooltip: `Voc corrigido pelo frio (Tmin ${tmin}°C). Limite: ${limitInverterVMax}V` });
    }

    // Isc
    if (totalIscMax > 0) {
      const iscSev: ValidationPill['severity'] = totalIscMax > limitIscMaxMppt ? 'warn' : 'ok';
      pills.push({ label: 'Isc', value: `${totalIscMax.toFixed(1)}A`, severity: iscSev,
        tooltip: `Isc total do arranjo. Limite por MPPT: ${limitIscMaxMppt}A` });
    }

    return pills;
  }, [dashboardData, kpi.dcAcRatio, tmin]);

  // ── Dados normativos do inversor ativo (catálogo) ─────────────────────────
  const inverterCatalogData = useMemo(() => {
    if (!activeInverter) return null;
    return catalogInverters.find((c: InverterCatalogItem) => c.id === activeInverter.catalogId) ?? null;
  }, [activeInverter, catalogInverters]);

  const hasAfci = inverterCatalogData ? (inverterCatalogData as any).afci === true : true;
  const hasRsd  = inverterCatalogData ? (inverterCatalogData as any).rsd === true : true;

  // Derating: passivo + >10kW + região tropical
  const hasDeratingRisk = useMemo(() => {
    if (!inverterCatalogData || !activeInverter) return false;
    const uf = (clientData as any)?.state ?? '';
    const isTropical = ESTADOS_TROPICAIS.has(uf);
    const isPassive  = (inverterCatalogData as any).coolingType === 'passive';
    const powerKw    = activeInverter.snapshot.nominalPower;
    return isTropical && isPassive && powerKw > 10;
  }, [inverterCatalogData, activeInverter, clientData]);

  // ── Handlers de inversor ─────────────────────────────────────────────────
  const handleAddInverter = useCallback((item: InverterCatalogItem) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const mpptArray = Array.isArray(item.mppts) ? item.mppts : null;
    const mpptCount = mpptArray ? mpptArray.length : 1;
    const mapped = {
      id: newId, quantity: 1,
      manufacturer: item.manufacturer, model: item.model, imageUrl: item.imageUrl,
      nominalPower: item.nominalPowerW ? item.nominalPowerW / 1000 : 0,
      maxEfficiency: typeof item.efficiency === 'object' ? (item.efficiency?.euro || 0) : (item.efficiency || 0),
      maxInputVoltage: item.maxInputVoltage || (mpptArray ? mpptArray[0]?.maxInputVoltage : 600) || 600,
      minInputVoltage: mpptArray ? mpptArray[0]?.minMpptVoltage || 40 : 40,
      maxInputCurrent: mpptArray ? Math.round(mpptArray.reduce((s: number, m: any) => s + (m.maxCurrentPerMPPT || 0), 0) * 10) / 10 : 0,
      outputVoltage: item.outputVoltage || 220, outputFrequency: item.outputFrequency || 60,
      maxOutputCurrent: item.maxOutputCurrent || 0, weight: item.weight || 0,
      connectionType: item.connectionType || 'Monofásico', mppts: mpptCount,
    };
    useSolarStore.getState().addInverter(mapped);
    addInverterTech(item, newId);
    setActiveInverterId(newId);
  }, [addInverterTech]);

  const handleRemoveInverter = useCallback((id: string) => {
    useSolarStore.getState().removeInverter(id);
    removeInverterTech(id);
    if (activeInverterId === id) setActiveInverterId(null);
  }, [removeInverterTech, activeInverterId]);

  // ── Scroll-to MPPT ao clicar em alerta ───────────────────────────────────
  const [highlightMpptId, setHighlightMpptId] = useState<number | undefined>(undefined);
  const handleAlertClick = useCallback((mpptId: string) => {
    const id = parseInt(mpptId);
    setHighlightMpptId(id);
    document.getElementById(`mppt-strip-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setHighlightMpptId(undefined), 2500);
  }, []);

  // ── Chips de inversor para o Hub ─────────────────────────────────────────
  const inverterChips: InverterChipData[] = useMemo(() =>
    techInverters.map(inv => {
      const catalogItem = catalogInverters.find((c: InverterCatalogItem) => c.id === inv.catalogId);
      return {
        id:           inv.id,
        manufacturer: catalogItem?.manufacturer ?? inv.snapshot.model.split(' ')[0] ?? 'Inversor',
        model:        inv.snapshot.model,
        powerKw:      inv.snapshot.nominalPower,
        mpptCount:    inv.snapshot.mppts,
      };
    }),
    [techInverters, catalogInverters]
  );

  // ── Empty State — 3 casos ─────────────────────────────────────────────────
  if (modules.length === 0 && techInverters.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 gap-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Zap size={40} className="opacity-30" />
          <p className="text-sm font-medium text-slate-300 text-center">Configure o sistema para habilitar a elétrica</p>
          <p className="text-xs text-slate-500 text-center max-w-xs">
            Adicione módulos e selecione um inversor no compositor lateral para visualizar a topologia elétrica.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFocusedBlock('module')}
            className="flex items-center gap-2 px-4 py-2 border border-amber-500/40 text-amber-400 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-amber-950/20 transition-all"
          >
            <Sun size={12} /> Módulos
          </button>
          <button
            onClick={() => setFocusedBlock('inverter')}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-500/40 text-emerald-400 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-emerald-950/20 transition-all"
          >
            <Cpu size={12} /> Inversor
          </button>
        </div>
      </div>
    );
  }

  if (techInverters.length === 0) {
    const totalKwp = modules.reduce((s, m) => s + (m.power || 0) / 1000, 0);
    return (
      <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
        <InverterHub
          inverterChips={[]}
          activeInverterId={null}
          onChipSelect={() => {}}
          onChipRemove={() => {}}
          catalogInverters={catalogInverters}
          onAddInverter={handleAddInverter}
          activeInverterIds={[]}
          pills={[]}
          globalHealth="ok"
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-slate-500">
          <Cpu size={36} className="text-emerald-500/40 animate-pulse" />
          <p className="text-sm font-medium text-slate-300 text-center">
            Selecione um inversor para configurar a topologia elétrica
          </p>
          <p className="text-[11px] font-mono text-slate-600">
            {totalKwp.toFixed(2)} kWp disponível
          </p>
          <p className="text-[10px] text-slate-700 uppercase tracking-widest">
            Use o botão + Inversor acima ↑
          </p>
        </div>
      </div>
    );
  }

  if (!activeInverter || !dashboardData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <p className="text-[11px] text-slate-600 font-mono uppercase tracking-widest">Configurando...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* LEVEL 1: InverterHub */}
      <InverterHub
        inverterChips={inverterChips}
        activeInverterId={activeInverter.id}
        onChipSelect={setActiveInverterId}
        onChipRemove={handleRemoveInverter}
        catalogInverters={catalogInverters}
        onAddInverter={handleAddInverter}
        activeInverterIds={techInverters.map(i => i.catalogId)}
        pills={validationPills}
        globalHealth={globalHealth}
      />

      {/* LEVEL 2: MPPTConfigStrip */}
      <MPPTConfigStrip
        inverterId={activeInverter.id}
        mpptConfigs={activeInverter.mpptConfigs}
        mpptMetrics={mpptMetrics}
        updateMPPT={updateMPPTConfig}
        limitVMax={dashboardData.limitInverterVMax}
        limitVMpptMin={dashboardData.limitMpptVMin}
      />

      {/* LEVEL 3: Canvas Principal */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden p-3 gap-3">

        {/* Área principal — gráficos */}
        <div className="flex-1 flex flex-col gap-3 min-h-[400px] lg:min-h-0 min-w-0 overflow-y-auto custom-scrollbar pr-1">
          <VoltageRangeChart
            mpptProfiles={dashboardData.mpptProfiles}
            limitInversorVMax={dashboardData.limitInverterVMax}
            limitMpptVMin={dashboardData.limitMpptVMin}
            limitMpptVMax={dashboardData.limitMpptVMax}
            limitVStart={dashboardData.limitMpptVMin}
          />
          <StringTopologyViewer
            mpptConfigs={activeInverter.mpptConfigs}
            highlightMpptId={highlightMpptId}
          />
        </div>

        {/* Painel lateral — diagnósticos */}
        <div className="w-full lg:w-[280px] shrink-0 overflow-hidden">
          <ElectricalDiagnosticPanel
            inverterState={activeInverter}
            fdi={kpi.dcAcRatio}
            vocMaxGlobal={dashboardData.totalVocMax}
            iscMaxGlobal={dashboardData.totalIscMax}
            vocGlobalStatus={
              dashboardData.totalVocMax > dashboardData.limitInverterVMax ? 'error' :
              dashboardData.totalVocMax > dashboardData.limitInverterVMax * 0.95 ? 'warning' : 'ok'
            }
            iscGlobalStatus={
              dashboardData.totalIscMax > dashboardData.limitIscMaxMppt ? 'error' :
              dashboardData.totalIscMax > dashboardData.limitIscMaxMppt * 0.9 ? 'warning' : 'ok'
            }
            alerts={dashboardData.alerts}
            abrirCatalogo={() => setFocusedBlock('inverter')}
            hasAfci={hasAfci}
            hasRsd={hasRsd}
            hasDeratingRisk={hasDeratingRisk}
            onAlertClick={handleAlertClick}
          />
        </div>
      </div>
    </div>
  );
};
