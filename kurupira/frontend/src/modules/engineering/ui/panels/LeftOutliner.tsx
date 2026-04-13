import React, { useState, useCallback, useMemo } from 'react';
import { Cpu, Plus, Trash2, AlertTriangle, Layers, Zap, Sparkles, Sun } from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';
import { toArray } from '@/core/types/normalized.types';
import { AddInverterPrompt, AddInverterInline, AddModuleInline } from '../../components/CatalogSelectors';
import { mapCatalogToSpecs } from '../../utils/catalogMappers';
import { useAutoSizing } from '../../hooks/useAutoSizing';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';

// =============================================================================
// INVERTER BLOCK COMPONENT (Smart Auto-Balancing)
// =============================================================================

const InverterBlock: React.FC<{
  techInv: any;
  projectInv: any;
  electrical: any;
  onRemove: () => void;
}> = ({ techInv, projectInv, electrical, onRemove }) => {
  const techState = useTechStore();
  const modules = useSolarStore(selectModules);
  const addModule = useSolarStore(state => state.addModule);
  const removeModule = useSolarStore.getState().removeModule;

  const [showSelector, setShowSelector] = useState(false);

  // ── 1. Leitura REATIVA — subscribir ao techStore completo para garantir re-render ──
  const techStrings = useTechStore(s => s.strings);
  const techInverters = useTechStore(s => s.inverters);

  const inverterEntries = electrical?.entries?.filter((e: any) => e.inverterId === techInv.id) || [];
  const hasError = inverterEntries.some((e: any) => e.status === 'error');
  const hasWarning = inverterEntries.some((e: any) => e.status === 'warning');
  
  const allMessages = Array.from(new Set(
      inverterEntries.flatMap((e: any) => e.messages || [])
  )).slice(0, 3);

  // Computar grupos inline — sem useMemo para evitar stale closures
  // Usar liveTechInv do state reativo (não da prop)
  const liveTechInv = techInverters.entities[techInv.id];
  const currentMpptConfigs = liveTechInv?.mpptConfigs || [];

  const modulesById: Record<string, any> = {};
  modules.forEach(m => { modulesById[m.id] = m; });

  const groupsMap: Record<string, { specs: any; quantity: number; ids: string[] }> = {};
  currentMpptConfigs.forEach((mppt: any) => {
    mppt.stringIds.forEach((sid: string) => {
      const str = techStrings.entities[sid];
      if (str) {
        str.moduleIds.forEach((mid: string) => {
          const mod = modulesById[mid];
          if (mod) {
            const key = `${mod.manufacturer}-${mod.model}-${mod.power}`;
            if (!groupsMap[key]) {
              groupsMap[key] = { specs: mod, quantity: 0, ids: [] };
            }
            groupsMap[key].quantity += 1;
            groupsMap[key].ids.push(mid);
          }
        });
      }
    });
  });
  const moduleGroups = Object.values(groupsMap);
  const totalModules = moduleGroups.reduce((sum, g) => sum + g.quantity, 0);

  // ── 2. Handlers ──
  const handleAddModules = (catalogItem: ModuleCatalogItem, qty: number) => {
      const mappedSpecs = mapCatalogToSpecs(catalogItem);
      const freshInv = useTechStore.getState().inverters.entities[techInv.id];
      if (!freshInv) return;
      const configs = freshInv.mpptConfigs;
      const mpptCount = configs.length;
      
      const basePerMppt = Math.floor(qty / mpptCount);
      const remainder = qty % mpptCount;

      configs.forEach((mppt: any, index: number) => {
          const count = basePerMppt + (index < remainder ? 1 : 0);
          if (count > 0) {
              const moduleIds: string[] = [];
              for(let i = 0; i < count; i++) {
                  const mid = Math.random().toString(36).substr(2, 9);
                  addModule({ ...mappedSpecs, id: mid, quantity: 1 });
                  moduleIds.push(mid);
              }
              techState.assignModulesToNewString(moduleIds, techInv.id, mppt.mpptId);
          }
      });
      setShowSelector(false);
  };

  const handleIncrement = (group: any) => {
    const freshInv = useTechStore.getState().inverters.entities[techInv.id];
    if (!freshInv) return;
    const freshStrings = useTechStore.getState().strings.entities;
    const configs = freshInv.mpptConfigs;
    
    let targetMppt = configs[0];
    let minModules = Infinity;
    
    configs.forEach((mppt: any) => {
        let count = 0;
        mppt.stringIds.forEach((sid: string) => {
            count += freshStrings[sid]?.moduleIds.length || 0;
        });
        if (count < minModules) {
            minModules = count;
            targetMppt = mppt;
        }
    });

    const mid = Math.random().toString(36).substr(2, 9);
    addModule({ ...group.specs, id: mid });
    
    if (targetMppt.stringIds.length === 0) {
        techState.assignModulesToNewString([mid], techInv.id, targetMppt.mpptId);
    } else {
        techState.addModulesToString(targetMppt.stringIds[0], [mid]);
    }
  };

  const handleDecrement = (group: any) => {
    if (group.ids.length === 0) return;
    const midToRemove = group.ids[group.ids.length - 1];
    removeModule(midToRemove);
    techState.removeModules([midToRemove]);
  };

  const handleRemoveGroup = (group: any) => {
    group.ids.forEach((mid: string) => removeModule(mid));
    techState.removeModules(group.ids);
  };

  const headerColor = hasError ? 'border-red-500/50 bg-red-500/5' : 
                      hasWarning ? 'border-amber-500/50 bg-amber-500/5' : 
                      'border-slate-800 bg-slate-900/80';

  return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className={cn("px-3 py-2 flex items-center justify-between border-b transition-colors", headerColor)}>
              <div className="flex items-center gap-2.5">
                  <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center border",
                      hasError ? "bg-red-500/10 text-red-400 border-red-500/30" : 
                      hasWarning ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : 
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  )}>
                      <Cpu size={12} />
                  </div>
                  <div>
                      <div className="text-[11px] font-bold text-slate-200">
                          {projectInv.manufacturer} {projectInv.model}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1.5">
                          <span>{projectInv.nominalPower}kW</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="text-emerald-500 flex items-center gap-0.5">
                              {techInv.mpptConfigs.length} MPPTs
                          </span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-1">
                  <button onClick={onRemove} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" title="Deletar Inversor">
                      <Trash2 size={12} />
                  </button>
              </div>
          </div>

          {/* Área Detalhada de Módulos */}
          <div className="flex flex-col bg-slate-950/20 divide-y divide-slate-800/40">
              {moduleGroups.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2.5 group/mod">
                      <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                              <Zap size={11} className="drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-white tracking-wide truncate uppercase">
                                  {group.specs.manufacturer} {group.specs.model}
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium">
                                  {group.specs.power}Wp • {group.quantity} un.
                              </span>
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded overflow-hidden">
                              <button 
                                onClick={() => handleDecrement(group)}
                                className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px] transition-colors"
                              >−</button>
                              <span className="px-2 py-0.5 text-[9px] font-bold text-slate-200 bg-slate-950/50 min-w-[20px] text-center tabular-nums">
                                  {group.quantity}
                              </span>
                              <button 
                                onClick={() => handleIncrement(group)}
                                className="px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 text-[10px] transition-colors"
                              >+</button>
                          </div>
                          <button 
                              onClick={() => handleRemoveGroup(group)}
                              className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover/mod:opacity-100"
                              title="Remover este modelo"
                          >
                              <Trash2 size={11} />
                          </button>
                      </div>
                  </div>
              ))}

              <div className="px-3 py-1.5 flex items-center justify-between bg-slate-900/40 border-t border-slate-800/40">
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                      {totalModules > 0 ? 'Adicionar Diferentes' : 'Nenhum Módulo'}
                  </span>
                  <button 
                      onClick={() => setShowSelector(!showSelector)}
                      className={cn(
                          "px-2 py-1 text-[9px] rounded font-bold transition-all flex items-center gap-1.5 border shadow-sm",
                          showSelector 
                              ? "bg-slate-800 text-slate-300 border-slate-700" 
                              : totalModules > 0
                                ? "text-slate-400 hover:text-emerald-400 border-slate-800"
                                : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 border-emerald-400/50"
                      )}
                  >
                      {showSelector ? 'Cancelar' : <><Plus size={10} strokeWidth={3} /> {totalModules > 0 ? 'Nova Marca/Modelo' : 'Adicionar Módulos'}</>}
                  </button>
              </div>
          </div>

          {/* Validation Status */}
          {(hasError || hasWarning) && allMessages.length > 0 && (
              <div className={cn("px-3 py-2 border-t border-slate-800/50 text-[9px] flex items-start gap-1.5 font-medium", 
                  hasError ? 'bg-red-950/20 text-red-400' : 'bg-amber-950/20 text-amber-500'
              )}>
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                      {allMessages.map((msg: any, idx) => <span key={idx}>{String(msg)}</span>)}
                  </div>
              </div>
          )}

          {/* Inline Selection Dropdown */}
          {showSelector && (
              <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 shadow-inner">
                  <AddModuleInline onAdd={handleAddModules} onClose={() => setShowSelector(false)} />
              </div>
          )}
      </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const LeftOutliner: React.FC = () => {
  const inverters = useSolarStore(selectInverters);
  const addProjectInverter = useSolarStore(state => state.addInverter);
  const addModule = useSolarStore(state => state.addModule);
  const removeInverter = useSolarStore(state => state.removeInverter);

  // Granular selectors — re-render only when inverters collection changes
  const techInvertersCollection = useTechStore(s => s.inverters);
  const techInvertersList = useMemo(() => toArray(techInvertersCollection), [techInvertersCollection]);
  
  const { electrical } = useElectricalValidation();

  // ── Smart Sizing: Estado do módulo escolhido pelo usuário ──
  const catalogModules = useCatalogStore(state => state.modules);
  const catalogInverters = useCatalogStore(state => state.inverters);
  const [sizingModuleBrand, setSizingModuleBrand] = useState('');
  const [sizingModuleId, setSizingModuleId] = useState('');
  const [sizingInverterBrand, setSizingInverterBrand] = useState('');

  const sizingModuleBrands = useMemo(() =>
    [...new Set(catalogModules.map(m => m.manufacturer))].sort(),
    [catalogModules]
  );
  const sizingModelsForBrand = useMemo(() =>
    catalogModules.filter(m => m.manufacturer === sizingModuleBrand),
    [catalogModules, sizingModuleBrand]
  );
  const selectedSizingModule = useMemo(() =>
    catalogModules.find(m => m.id === sizingModuleId) || null,
    [catalogModules, sizingModuleId]
  );
  const sizingInverterBrands = useMemo(() =>
    [...new Set(catalogInverters.map(i => i.manufacturer))].sort(),
    [catalogInverters]
  );

  const autoSizing = useAutoSizing(selectedSizingModule, sizingInverterBrand);

  const handleAddInverter = useCallback((catalogItem: any) => {
      const newId = Math.random().toString(36).substr(2, 9);
      const mpptArray = Array.isArray(catalogItem.mppts) ? catalogItem.mppts : null;
      const mpptCount = mpptArray ? mpptArray.length : (catalogItem.mppts || 1);

      const mapped = {
          id: newId,
          quantity: 1,
          manufacturer: catalogItem.manufacturer,
          model: catalogItem.model,
          imageUrl: catalogItem.imageUrl,
          nominalPower: catalogItem.nominalPowerW ? catalogItem.nominalPowerW / 1000 : catalogItem.nominalPower || 0,
          maxEfficiency: catalogItem.efficiency?.euro || catalogItem.efficiency || 0,
          maxInputVoltage: catalogItem.maxInputVoltage || (mpptArray ? mpptArray[0]?.maxInputVoltage : 600) || 600,
          minInputVoltage: mpptArray ? mpptArray[0]?.minMpptVoltage || 40 : 40,
          maxInputCurrent: mpptArray ? Math.round(mpptArray.reduce((sum: number, m: any) => sum + (m.maxCurrentPerMPPT || 0), 0) * 10) / 10 : 0,
          outputVoltage: catalogItem.outputVoltage || 220,
          outputFrequency: catalogItem.outputFrequency || 60,
          maxOutputCurrent: catalogItem.maxOutputCurrent || 0,
          weight: catalogItem.weight || 0,
          connectionType: catalogItem.connectionType || 'Monofásico',
          mppts: mpptCount,
      };
      addProjectInverter(mapped);
      useTechStore.getState().addInverter(catalogItem, newId);
      return newId;
  }, [addProjectInverter]);

  const handleRemoveInverter = useCallback((inverterId: string) => {
      removeInverter(inverterId);
      useTechStore.getState().removeInverter(inverterId);
  }, [removeInverter]);

  // ── Dimensionamento Inteligente (One-Click) ──
  const handleAutoSizing = useCallback(() => {
      if (!autoSizing.isCalculable || !autoSizing.recommendedInverter || !selectedSizingModule) return;

      // 1. Adicionar o Inversor recomendado
      const invId = handleAddInverter(autoSizing.recommendedInverter);

      // 2. Aguardar o state propagar e adicionar os módulos com round-robin
      setTimeout(() => {
          const currentTechState = useTechStore.getState();
          const techInv = currentTechState.inverters.entities[invId];
          if (!techInv) return;

          const qty = autoSizing.requiredModuleQty;
          const mpptCount = techInv.mpptConfigs.length;
          const basePerMppt = Math.floor(qty / mpptCount);
          const remainder = qty % mpptCount;
          const mappedSpecs = mapCatalogToSpecs(selectedSizingModule);

          techInv.mpptConfigs.forEach((mppt: any, index: number) => {
              const count = basePerMppt + (index < remainder ? 1 : 0);
              if (count > 0) {
                  const moduleIds: string[] = [];
                  for (let i = 0; i < count; i++) {
                      const mid = Math.random().toString(36).substr(2, 9);
                      addModule({ ...mappedSpecs, id: mid, quantity: 1 });
                      moduleIds.push(mid);
                  }
                  currentTechState.assignModulesToNewString(moduleIds, invId, mppt.mpptId);
              }
          });
      }, 50);
  }, [autoSizing, selectedSizingModule, handleAddInverter, addModule]);

  return (
      <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50 shadow-sm z-10">
              <div className="flex items-center gap-2">
                  <Layers size={14} className="text-emerald-500" />
                  <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Gerador Solar
                  </h3>
              </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {techInvertersList.length === 0 ? (
                  <div className="mt-2 space-y-4">
                      {/* ⚡ Dimensionamento Inteligente — com seletor de módulo */}
                      {autoSizing.isCalculable && (
                          <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
                              {/* Header do card */}
                              <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                                      <Sparkles size={16} className="text-amber-400" />
                                  </div>
                                  <div>
                                      <p className="text-[11px] font-bold text-amber-300">Dimensionamento Inteligente</p>
                                      <p className="text-[8px] text-slate-500">
                                          Potência alvo: {autoSizing.requiredKwp.toFixed(2)} kWp
                                      </p>
                                  </div>
                              </div>

                              {/* Step 1: Escolha do Módulo */}
                              <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                      <Sun size={10} className="text-amber-500" />
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">1. Escolha o Painel</span>
                                  </div>
                                  <select
                                      value={sizingModuleBrand}
                                      onChange={(e) => { setSizingModuleBrand(e.target.value); setSizingModuleId(''); }}
                                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors"
                                  >
                                      <option value="">Marca do módulo...</option>
                                      {sizingModuleBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                  </select>

                                  {sizingModuleBrand && (
                                      <select
                                          value={sizingModuleId}
                                          onChange={(e) => setSizingModuleId(e.target.value)}
                                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-200 outline-none focus:border-amber-500/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-150"
                                      >
                                          <option value="">Modelo...</option>
                                          {sizingModelsForBrand.map(mod => (
                                              <option key={mod.id} value={mod.id}>
                                                  {mod.model} — {mod.electrical?.pmax || 0}W
                                              </option>
                                          ))}
                                      </select>
                                  )}
                              </div>

                              {/* Step 2: Escolha da Marca do Inversor (após módulo) */}
                              {selectedSizingModule && (
                                  <div className="space-y-1.5 pt-2 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-1 duration-150">
                                      <div className="flex items-center gap-1.5">
                                          <Cpu size={10} className="text-emerald-500" />
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Escolha o Inversor</span>
                                      </div>
                                      <select
                                          value={sizingInverterBrand}
                                          onChange={(e) => setSizingInverterBrand(e.target.value)}
                                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                                      >
                                          <option value="">Marca do inversor...</option>
                                          {sizingInverterBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                      </select>
                                      {/* Info: quantidade de módulos calculada */}
                                      <div className="flex items-center justify-between px-1">
                                          <span className="text-[8px] text-slate-500">Módulos necessários</span>
                                          <span className="text-[9px] font-bold text-amber-400">
                                              {autoSizing.requiredModuleQty}x {selectedSizingModule.model} ({selectedSizingModule.electrical.pmax}W)
                                          </span>
                                      </div>
                                  </div>
                              )}

                              {/* Step 3: Resultado Automático (após escolha do inversor) */}
                              {selectedSizingModule && sizingInverterBrand && autoSizing.recommendedInverter && (
                                  <div className="space-y-2.5 pt-2 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="flex items-center gap-1.5">
                                          <Zap size={10} className="text-amber-500" />
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">3. Resultado</span>
                                      </div>
                                      <div className="rounded-lg bg-slate-900/60 border border-slate-800/60 p-2.5 space-y-1">
                                          <div className="flex items-center justify-between">
                                              <span className="text-[9px] text-slate-500">Inversor</span>
                                              <span className="text-[10px] font-bold text-emerald-400">
                                                  {autoSizing.recommendedInverter.manufacturer} {autoSizing.recommendedInverter.model}
                                              </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <span className="text-[9px] text-slate-500">Módulos</span>
                                              <span className="text-[10px] font-bold text-amber-400">
                                                  {autoSizing.requiredModuleQty}x {selectedSizingModule.model}
                                              </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <span className="text-[9px] text-slate-500">Potência DC</span>
                                              <span className="text-[10px] font-bold text-slate-300">
                                                  {((autoSizing.requiredModuleQty * selectedSizingModule.electrical.pmax) / 1000).toFixed(2)} kWp
                                              </span>
                                          </div>
                                      </div>

                                      <button
                                          onClick={handleAutoSizing}
                                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.98]"
                                      >
                                          <Zap size={12} strokeWidth={3} /> Aplicar Dimensionamento
                                      </button>
                                  </div>
                              )}

                              {/* Feedback: marca escolhida mas sem modelo compatível */}
                              {selectedSizingModule && sizingInverterBrand && !autoSizing.recommendedInverter && (
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 animate-in fade-in duration-200">
                                      <AlertTriangle size={10} className="text-red-400 shrink-0" />
                                      <span className="text-[9px] text-red-400">
                                          Nenhum modelo {sizingInverterBrand} compatível para {autoSizing.requiredKwp.toFixed(1)} kWp
                                      </span>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Divider */}
                      {autoSizing.isCalculable && (
                          <div className="flex items-center gap-2">
                              <div className="flex-1 h-px bg-slate-800" />
                              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">ou manualmente</span>
                              <div className="flex-1 h-px bg-slate-800" />
                          </div>
                      )}

                      <AddInverterPrompt onAdd={handleAddInverter} />
                  </div>
              ) : (
                  <div className="space-y-4 pb-12">
                      {techInvertersList.map(techInv => {
                          const projectInv = inverters.find(i => i.id === techInv.id);
                          if (!projectInv) return null;
                          return (
                              <InverterBlock 
                                  key={techInv.id} 
                                  techInv={techInv} 
                                  projectInv={projectInv}
                                  electrical={electrical}
                                  onRemove={() => handleRemoveInverter(techInv.id)}
                              />
                          )
                      })}
                      
                      <div className="pt-2 border-t border-slate-800/50 mt-4">
                          <AddInverterInline onAdd={handleAddInverter} />
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};
