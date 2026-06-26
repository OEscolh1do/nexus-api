import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { useThermalPremises } from '../../../hooks/useThermalPremises';
import { useElectricalDashboard } from '../../../hooks/useElectricalDashboard';
import { useInverterUIStore } from '../../../store/useInverterUIStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { toArray } from '@/core/types/normalized.types';
import { Zap, Cpu, Sun, Terminal, ChevronUp, ChevronDown, GitBranch } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { cn } from '@/lib/utils';


// Componentes do Hub + Strip + Canvas
import { InverterHub, type InverterChipData, type ValidationPill } from './electrical/InverterHub';
import { MPPTInspectorPanel } from './electrical/MPPTInspectorPanel';
import { getModuleSpecs } from '../../../utils/specAdapter';
import { OversizingPanel } from './electrical/OversizingPanel';
import { CalculationAuditPanel } from './electrical/components/CalculationAuditPanel';
import { DiagnosticAlertsList } from './electrical/components/DiagnosticAlertsList';
import { TemperatureTab } from './electrical/TemperatureTab';
import { parsePanOnd } from '@/utils/pvsystParser';
import { mapOndToInverter } from '../../../utils/ondAdapter';

import { UnifilarSchematicCanvas, type MpptValidationError } from './electrical/UnifilarSchematicCanvas';

// ─────────────────────────────────────────────────────────────────────────────
// Importar componentes do canvas elétrico
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICAL CANVAS VIEW v2.0 — Hub + Strip + Canvas
// ─────────────────────────────────────────────────────────────────────────────
export const ElectricalCanvasView: React.FC = () => {
  const modules     = useSolarStore(selectModules);

  const invertersNorm    = useTechStore(state => state.inverters);
  const updateMPPTConfig = useTechStore(state => state.updateMPPTConfig);
  const addStringToMPPT = useTechStore(state => state.addStringToMPPT);
  const removeStringFromMPPT = useTechStore(state => state.removeStringFromMPPT);
  const updateStringInMPPT = useTechStore(state => state.updateStringInMPPT);
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


  // ── Premissas Térmicas — fonte única de verdade (useThermalPremises) ──────
  // Substitui resolveTemps() local que causava divergência com useElectricalValidation.
  const { tmin, tambMax: tamb_max, tcellMax, uf } = useThermalPremises();

  // BUG-07 fix: Verificar se há dados térmicos válidos
  const hasThermalData = tmin != null && tcellMax != null && !isNaN(tmin) && !isNaN(tcellMax);

  // ── Dashboard Data + MPPT Metrics (extracted to hook) ─────────────────────
  const { dashboardData, mpptMetrics, activeMpptCount } = useElectricalDashboard({
    activeInverter,
    modules,
    tmin: hasThermalData ? tmin : 25,
    tcellMax: hasThermalData ? tcellMax : 75,
    electrical,
  });

  // Catalog item do inversor ativo (para UnifilarSchematicCanvas)
  const activeCatalogItem = useMemo(
    () => catalogInverters.find((c: InverterCatalogItem) => c.id === activeInverter?.catalogId),
    [catalogInverters, activeInverter],
  );

  // ── Erros de validação por MPPT → marcadores no canvas unifilar ───────────
  const validationErrors = useMemo<Record<number, MpptValidationError>>(() => {
    const result: Record<number, MpptValidationError> = {};
    electrical?.entries?.forEach(entry => {
      if (entry.status !== 'ok' && entry.messages.length > 0) {
        result[entry.mpptId] = {
          severity: entry.status === 'error' ? 'error' : 'warn',
          messages: entry.messages,
        };
      }
    });
    return result;
  }, [electrical]);

  // ── Chips de validação para o Hub ─────────────────────────────────────────
   // Pills de status global (apenas se houver algo fora do normal ou informativo)
  const validationPills: ValidationPill[] = useMemo(() => {
    if (!dashboardData) return [];
    const pills: ValidationPill[] = [];

    // Se houver algum erro de inventário que não está no Hub, podemos colocar aqui
    // Mas por enquanto, o Hub já cobre FDI, Voc e Isc.
    
    return pills;
  }, [dashboardData]);

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
    // Q7: clear all placed module string assignments for this inverter
    useSolarStore.getState().clearOrphanStringData(id);
    useSolarStore.getState().removeInverter(id);
    removeInverterTech(id);
    if (activeInverterId === id) setActiveInverterId(null);
  }, [removeInverterTech, activeInverterId]);

  const handleRemoveStringFromMPPT = useCallback((inverterId: string, mpptId: number, stringId: string) => {
    // Q7: clear orphan PlacedModules before removing the StringDef
    useSolarStore.getState().clearOrphanStringData(inverterId, mpptId, stringId);
    removeStringFromMPPT(inverterId, mpptId, stringId);
  }, [removeStringFromMPPT]);

  // ── Scroll-to MPPT ao clicar em alerta ───────────────────────────────────
  const setHighlightMpptId = useInverterUIStore(s => s.setHighlightMpptId);

  // Estado local do Inspector — preferência de sessão, não precisa persistir no store
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  const handleAlertClick = useCallback((mpptId: string) => {
    const id = parseInt(mpptId);
    setHighlightMpptId(id);
    // Expandir o inspector se estiver colapsado para o scroll funcionar
    setInspectorCollapsed(false);
    // BUG-02 fix: RAF duplo garante DOM pintado antes do scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`mppt-inspector-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    setTimeout(() => setHighlightMpptId(null), 2800);
  }, [setHighlightMpptId]);

  // ── Chips de inversor para o Hub ─────────────────────────────────────────
  const inverterChips: InverterChipData[] = useMemo(() =>
    techInverters.map(inv => {
      const catalogItem = catalogInverters.find((c: InverterCatalogItem) => c.id === inv.catalogId);
      return {
        id:           inv.id,
        manufacturer: catalogItem?.manufacturer ?? inv.snapshot?.model?.split(' ')[0] ?? 'Inversor',
        model:        inv.snapshot?.model ?? 'Modelo desconhecido',
        powerKw:      inv.snapshot?.nominalPower ?? 0,
        mpptCount:    inv.snapshot?.mppts ?? 1,
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

  // I12: One-time rehydration validation
  useEffect(() => {
    const solarState = useSolarStore.getState();
    const placedModules = solarState.project.placedModules;
    const clearOrphanStringData = solarState.clearOrphanStringData;
    const techInverters = useTechStore.getState().inverters.entities;

    placedModules.forEach((m: any) => {
      if (!m.stringData) return;

      const inv = techInverters[m.stringData.inverterId];
      if (!inv) {
        // Inverter was deleted — clear the assignment
        clearOrphanStringData(m.stringData.inverterId, m.stringData.mpptId, m.stringData.stringId);
        return;
      }

      if (m.stringData.stringId) {
        const mpptConfig = inv.mpptConfigs.find(c => c.mpptId === m.stringData!.mpptId);
        const stringExists = (mpptConfig?.strings || []).some(
          s => s.id === m.stringData!.stringId || s.name === m.stringData!.stringId
        );
        if (!stringExists) {
          // String was deleted — clear the assignment but keep inverter+mppt association
          clearOrphanStringData(m.stringData.inverterId, m.stringData.mpptId, m.stringData.stringId);
        }
      }
    });
  // Run once on mount — intentionally empty deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        activeMpptCount={activeMpptCount}
        inventory={inventory}
        totalVocMax={dashboardData.totalVocMax}
        totalIscMax={dashboardData.totalIscMax}
        limitInverterVMax={dashboardData.limitInverterVMax}
        limitIscMaxMppt={dashboardData.limitIscMaxMppt}
      />

      {/* LEVEL 2: Body Principal — Canvas + Inspector (flex-row) */}
      <div className="flex-1 flex flex-row min-h-0">

        {/* MPPT Inspector Panel — esquerda, colapsível */}
        <MPPTInspectorPanel
          inverterId={activeInverter.id}
          mpptConfigs={activeInverter.mpptConfigs}
          mpptMetrics={mpptMetrics}
          updateMPPT={updateMPPTConfig}
          addStringToMPPT={addStringToMPPT}
          removeStringFromMPPT={handleRemoveStringFromMPPT}
          updateStringInMPPT={updateStringInMPPT}
          limitVMax={dashboardData.limitInverterVMax}
          limitVMpptMin={dashboardData.limitMpptVMin}
          limitIscMaxMppt={dashboardData.limitIscMaxMppt}
          startupVoltage={dashboardData.startupVoltage}
          tmin={tmin}
          module={repModule}
          isCollapsed={inspectorCollapsed}
          onToggle={() => setInspectorCollapsed(prev => !prev)}
        />

        {/* Canvas Principal — flex-1, ocupa toda a largura menos o inspector */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Tab Bar — unifilar é a tab padrão (esquema IEC em primeiro plano) */}
          <div className="flex items-center border-b border-slate-800 shrink-0 bg-slate-950/80 px-4">
            {(
              [
                { id: 'unifilar'    as const, label: 'Esquema Unifilar',      hasIcon: true  },
                { id: 'audit'       as const, label: 'Auditoria de Cálculo',  hasIcon: false },
                { id: 'temperatura' as const, label: 'Temperatura',            hasIcon: false },
                { id: 'oversizing'  as const, label: 'FDI / Oversizing',       hasIcon: false },
              ]
            ).map(tab => (
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
                {tab.hasIcon && <GitBranch size={10} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {/* B6 fix: UnifilarSchematicCanvas sempre montado com visibilidade CSS */}
          <div className={cn('flex-1 min-h-0', activeCanvasTab === 'unifilar' ? 'flex overflow-hidden' : 'hidden')}>
            {activeInverter && activeCatalogItem ? (
              <UnifilarSchematicCanvas
                inverter={activeInverter}
                catalogItem={activeCatalogItem}
                mpptMetrics={mpptMetrics}
                validationErrors={validationErrors}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <div className="text-slate-800 text-3xl">⚠</div>
                <p className="text-sm font-medium text-slate-300 text-center">Inversor não encontrado no catálogo</p>
                <p className="text-xs text-slate-500 text-center max-w-md">
                  O inversor selecionado não existe no catálogo. Verifique as configurações ou selecione outro inversor.
                </p>
              </div>
            )}
          </div>
          <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6', activeCanvasTab === 'audit' ? 'block' : 'hidden')}>
            {activeCanvasTab === 'audit' && (
              <div className="max-w-5xl mx-auto">
                <CalculationAuditPanel
                  mpptConfigs={activeInverter.mpptConfigs}
                  mpptMetrics={mpptMetrics}
                  dashboardData={dashboardData}
                  activeInverterSnapshot={activeInverter.snapshot}
                  moduleSpecs={getModuleSpecs(modules[0])}
                  fdi={kpi.dcAcRatio}
                  totalKwpCC={totalKwpCC}
                  totalKwCA={activeInverter.snapshot.nominalPower}
                  tmin={tmin}
                  tambMax={tamb_max}
                  highlightMpptId={highlightMpptId}
                />
              </div>
            )}
          </div>
          <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6', activeCanvasTab === 'temperatura' ? 'block' : 'hidden')}>
            {activeCanvasTab === 'temperatura' && (
              <div className="max-w-5xl mx-auto">
                <TemperatureTab
                  mpptProfiles={dashboardData.mpptProfiles}
                  mpptMetrics={mpptMetrics}
                  mpptConfigs={activeInverter.mpptConfigs}
                  moduleSpecs={getModuleSpecs(modules[0])}
                  activeInverterSnapshot={activeInverter.snapshot}
                  dashboardData={dashboardData}
                  fdi={kpi.dcAcRatio}
                  totalKwpCC={totalKwpCC}
                  totalKwCA={activeInverter.snapshot.nominalPower}
                />
              </div>
            )}
          </div>
          <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6', activeCanvasTab === 'oversizing' ? 'block' : 'hidden')}>
            {activeCanvasTab === 'oversizing' && (
              <div className="max-w-4xl mx-auto">
                <OversizingPanel
                  fdi={kpi.dcAcRatio}
                  totalKwpCC={totalKwpCC}
                  totalKwCA={activeInverter.snapshot.nominalPower}
                  uf={uf}
                />
              </div>
            )}
          </div>
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
                {errorCount > 0 && <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5">{errorCount} Erro{errorCount !== 1 && 's'}</span>}
              </div>
            ) : (
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 ml-2">Sistema Nominal</span>
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
