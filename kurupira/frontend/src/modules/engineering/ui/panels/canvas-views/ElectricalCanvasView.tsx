import React, { useMemo, useCallback, useEffect } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { useInverterUIStore } from '../../../store/useInverterUIStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { toArray } from '@/core/types/normalized.types';
import { Zap, Cpu, Sun, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { calculateStringMetrics } from '../../../utils/electricalMath';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { cn } from '@/lib/utils';


// Componentes do Hub + Strip + Canvas
import { InverterHub, type InverterChipData, type ValidationPill } from './electrical/InverterHub';
import { MPPTConfigStrip } from './electrical/MPPTConfigStrip';
import { VoltageRangeChart, type MpptThermalProfile } from './electrical/VoltageRangeChart';
import { StringTopologyViewer } from './electrical/StringTopologyViewer';
import { OversizingPanel } from './electrical/OversizingPanel';
import { CalculationAuditPanel } from './electrical/components/CalculationAuditPanel';
import { DiagnosticAlertsList, AlertDescriptor } from './electrical/components/DiagnosticAlertsList';
import { parsePanOnd } from '../../../utils/pvsystParser';
import { mapOndToInverter } from '../../../utils/ondAdapter';

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
  const { electrical, globalHealth, inventory } = useElectricalValidation();
  const { inverters: catalogInverters } = useCatalogStore();

  const techInverters   = useMemo(() => toArray(invertersNorm), [invertersNorm]);
  
  const activeInverterId = useInverterUIStore(s => s.activeInverterId);
  const setActiveInverterId = useInverterUIStore(s => s.setActiveInverterId);
  const activeCanvasTab = useInverterUIStore(s => s.activeCanvasTab);
  const setActiveCanvasTab = useInverterUIStore(s => s.setActiveCanvasTab);
  const terminalOpen = useInverterUIStore(s => s.terminalOpen);
  const setTerminalOpen = useInverterUIStore(s => s.setTerminalOpen);
  const highlightMpptId = useInverterUIStore(s => s.highlightMpptId);

  // Resolução do inversor ativo (multi-inversor Tier 2 — default [0])
  const activeInverter = useMemo(() => {
    if (activeInverterId) return techInverters.find(i => i.id === activeInverterId) ?? techInverters[0] ?? null;
    return techInverters[0] ?? null;
  }, [techInverters, activeInverterId]);

  const repModule = modules[0] ?? null;

  // totalKwpCC — soma de todos os módulos no projeto
  const totalKwpCC = useMemo(
    () => modules.reduce((sum, m) => sum + (m.power || 0) / 1000, 0),
    [modules]
  );

  // T1-A: campo correto — electrical.tempCoeffVoc (não .tempCoeff)
  const moduleSpecs = useMemo(() => {
    if (!repModule) return null;
    return {
      voc:         repModule.voc,
      vmp:         repModule.vmp ?? repModule.voc * 0.82,
      isc:         repModule.isc ?? 0,
      imp:         repModule.imp ?? repModule.isc * 0.95,
      pmax:        repModule.power ?? (repModule as any).pmax ?? 0,
      tempCoeffVoc: (repModule as any).electrical?.tempCoeffVoc ?? repModule.tempCoeff ?? -0.29,
      tempCoeffVmp: (repModule as any).electrical?.tempCoeffVmp ?? -0.34,
      noct:        (repModule as any).noct ?? 45,
      isBifacial:  (repModule as any).isBifacial ?? false,
      albedo:      0.2, // Padrão Conservador
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

    // ── Cálculo dos limites físicos por string (baseado em 1 módulo)
    const vocFrio1 = calculateStringMetrics(moduleSpecs, 1, tmin).vocMax;
    const vmpCalor1 = calcVmpCalor(1);
    
    // Teto absoluto: Tensão de circuito aberto no frio extremo vs Limite do Inversor
    const maxModulesLimit = vocFrio1 > 0 ? Math.floor(limitInverterVMax / vocFrio1) : 40;
    
    // Piso de segurança: Considera a tensão mínima do MPPT e a Tensão de Partida (Startup Voltage)
    const startupVoltage = (activeInverter.snapshot as any)?.startupVoltage ?? limitMpptVMin;
    const effectiveMinVoltage = Math.max(limitMpptVMin, startupVoltage);
    
    // Perda ôhmica simulada de 1.5% no cabo CC
    const voltageDropFactor = 0.985; 
    const minModulesLimit = vmpCalor1 > 0 ? Math.ceil(effectiveMinVoltage / (vmpCalor1 * voltageDropFactor)) : 0;

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
      minModulesLimit, maxModulesLimit,
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

      const bifacialFactor = moduleSpecs.isBifacial ? (1 + 0.70 * moduleSpecs.albedo) : 1;

      // Mismatch: verifica se azimute difere entre configs — simplificado
      // (comparação futura entre stringIds quando Tier 3 estiver disponível)
      result[mppt.mpptId] = {
        vocFrio:    metrics?.vocMax ?? 0,
        vmpCalor,
        iscTotal:   (moduleSpecs.isc || 0) * strCount * bifacialFactor,
        impTotal:   (moduleSpecs.imp || 0) * strCount * bifacialFactor,
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

  const handleUploadOnd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = parsePanOnd(content);
        const mapped = mapOndToInverter(parsed);
        const importedInverter: InverterCatalogItem = {
          ...mapped,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };
        handleAddInverter(importedInverter);
      } catch (err) {
        console.error("Erro ao processar arquivo .OND:", err);
        alert("Falha ao processar arquivo .OND. Verifique se o formato está correto.");
      }
    };
    reader.readAsText(file);
  }, [handleAddInverter]);

  const handleRemoveInverter = useCallback((id: string) => {
    useSolarStore.getState().removeInverter(id);
    removeInverterTech(id);
    if (activeInverterId === id) setActiveInverterId(null);
  }, [removeInverterTech, activeInverterId]);

  // ── Scroll-to MPPT ao clicar em alerta ───────────────────────────────────
  const setHighlightMpptId = useInverterUIStore(s => s.setHighlightMpptId);
  
  const handleAlertClick = useCallback((mpptId: string) => {
    const id = parseInt(mpptId);
    setHighlightMpptId(id);
    // Quando clicar no alerta, abre o terminal se não estiver e pisca o MPPT
    document.getElementById(`mppt-strip-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightMpptId(null), 2500);
  }, [setHighlightMpptId]);

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

  // ── Auto-open terminal if errors arrive ──────────────────────────────────
  const errorCount = dashboardData?.alerts.filter(a => a.severity === 'error').length ?? 0;
  const warnCount = dashboardData?.alerts.filter(a => a.severity === 'warning').length ?? 0;
  const hasAlerts = errorCount > 0 || warnCount > 0;

  useEffect(() => {
    if (errorCount > 0) {
      setTerminalOpen(true);
    }
  }, [errorCount]);

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
          onSelectInverter={handleAddInverter}
          onUploadOnd={handleUploadOnd}
          activeCatalogIds={[]}
          pills={[]}
          globalHealth="ok"
          totalKwpCC={totalKwpCC}
          inventory={inventory}
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
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">

      {/* LEVEL 1: InverterHub */}
      <InverterHub
        inverterChips={inverterChips}
        activeInverterId={activeInverter.id}
        onChipSelect={setActiveInverterId}
        onChipRemove={handleRemoveInverter}
        onSelectInverter={handleAddInverter}
        onUploadOnd={handleUploadOnd}
        activeCatalogIds={techInverters.map(inv => inv.catalogId).filter(Boolean) as string[]}
        pills={validationPills}
        globalHealth={globalHealth}
        fdi={kpi.dcAcRatio}
        totalKwpCC={totalKwpCC}
        inventory={inventory}
      />

      {/* LEVEL 2: MPPTConfigStrip (Dynamic Capacity Cockpit) */}
      <div className="shrink-0 max-h-[40vh] overflow-y-auto custom-scrollbar">
        <MPPTConfigStrip
          inverterId={activeInverter.id}
          mpptConfigs={activeInverter.mpptConfigs}
          mpptMetrics={mpptMetrics}
          updateMPPT={updateMPPTConfig}
          limitVMax={dashboardData.limitInverterVMax}
          limitVMpptMin={dashboardData.limitMpptVMin}
          limitIscMaxMppt={dashboardData.limitIscMaxMppt}
          inventoryStatus={inventory.status}
          minModulesLimit={dashboardData.minModulesLimit}
          maxModulesLimit={dashboardData.maxModulesLimit}
        />
      </div>

      {/* LEVEL 3: Canvas Principal (Full-Width) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-slate-800 shrink-0 bg-slate-950/80 px-4">
          {([
            { id: 'voltage',   label: 'Tensão Térmica' },
            { id: 'oversizing', label: 'FDI / Oversizing' },
            { id: 'topology',  label: 'Topologia Elétrica' },
            { id: 'audit',     label: 'Auditoria de Cálculo' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCanvasTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-6 py-2.5 min-h-[40px] text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
                activeCanvasTab === tab.id
                  ? 'text-emerald-400 border-emerald-500 bg-emerald-950/10'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeCanvasTab === 'voltage' && (
            <div className="max-w-5xl mx-auto">
              <VoltageRangeChart
                mpptProfiles={dashboardData.mpptProfiles}
                limitInversorVMax={dashboardData.limitInverterVMax}
                limitMpptVMin={dashboardData.limitMpptVMin}
                limitMpptVMax={dashboardData.limitMpptVMax}
                limitVStart={dashboardData.limitMpptVMin}
              />
            </div>
          )}
          {activeCanvasTab === 'oversizing' && (
            <div className="max-w-4xl mx-auto">
              <OversizingPanel
                fdi={kpi.dcAcRatio}
                totalKwpCC={totalKwpCC}
                totalKwCA={activeInverter.snapshot.nominalPower}
                uf={(clientData as any)?.state}
              />
            </div>
          )}
          {activeCanvasTab === 'topology' && (
            <div className="w-full">
              <StringTopologyViewer
                mpptConfigs={activeInverter.mpptConfigs}
                mpptMetrics={mpptMetrics}
                highlightMpptId={highlightMpptId}
              />
            </div>
          )}
          {activeCanvasTab === 'audit' && (
            <div className="max-w-5xl mx-auto">
              <CalculationAuditPanel
                mpptConfigs={activeInverter.mpptConfigs}
                mpptMetrics={mpptMetrics}
                dashboardData={dashboardData}
                activeInverterSnapshot={activeInverter.snapshot}
                moduleSpecs={moduleSpecs}
                fdi={kpi.dcAcRatio}
                totalKwpCC={totalKwpCC}
                totalKwCA={activeInverter.snapshot.nominalPower}
                tmin={tmin}
                tambMax={tamb_max}
              />
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 4: Diagnostics Terminal (Rodapé) */}
      <div className={cn(
        "w-full border-t border-slate-800 bg-slate-950 transition-all duration-300 flex flex-col shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        terminalOpen ? "h-[250px]" : "h-10"
      )}>
        {/* Terminal Header */}
        <button 
          onClick={() => setTerminalOpen(!terminalOpen)}
          className="w-full h-10 flex items-center justify-between px-4 hover:bg-slate-900/50 transition-colors border-b border-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <Terminal size={14} className={hasAlerts ? "text-amber-500" : "text-emerald-500"} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Terminal de Diagnóstico
            </span>
            {hasAlerts ? (
              <div className="flex items-center gap-2 ml-2">
                {errorCount > 0 && <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-sm">{errorCount} Erro{errorCount !== 1 && 's'}</span>}
                {warnCount > 0 && <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm">{warnCount} Alerta{warnCount !== 1 && 's'}</span>}
              </div>
            ) : (
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-sm ml-2">Sistema Nominal</span>
            )}
          </div>
          <div className="text-slate-500 flex items-center gap-2">
            {terminalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </button>

        {/* Terminal Body */}
        {terminalOpen && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D1117] p-2">
            {hasAlerts ? (
              <DiagnosticAlertsList alerts={dashboardData.alerts} onAlertClick={handleAlertClick} />
            ) : (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">
                &gt; Nenhuma anomalia de engenharia detectada no circuito elétrico ativo.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
