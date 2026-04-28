import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { mapCatalogToSpecs } from '../../../utils/catalogMappers';
import { parsePanOnd } from '@/utils/pvsystParser';
import { mapPanToModule } from '@/utils/panToModuleMapper';
import { useGenerationEstimate } from '../../../hooks/useGenerationEstimate';

import { ModuleSelectorHub } from './module/ModuleSelectorHub';
import { ModuleContextStrip } from './module/ModuleContextStrip';
import { ModuleInsightsArea } from './module/ModuleInsightsArea';
import { TechnicalProfile } from './module/TechnicalProfile';
import { PANReviewModal } from './module/PANReviewModal';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';

// =============================================================================
// MODULE CANVAS VIEW — Redesign v2: Dashboard de Engenharia
// =============================================================================
// Layout: Hub (top) → Context Strip → Content (Chart + Technical Profile)
// Mirrors ConsumptionCanvasView architecture for consistency.
// =============================================================================

export const ModuleCanvasView: React.FC = () => {
  const projectModules = useSolarStore(selectModules);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const setModules = useSolarStore(s => s.setModules);

  const {
    modules: catalogModules,
    isLoading,
    fetchCatalog,
    addCustomModule
  } = useCatalogStore();

  const [comparingIds, setComparingIds] = useState<string[]>([]);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [pendingPANModule, setPendingPANModule] = useState<{ module: ModuleCatalogItem; duplicate?: ModuleCatalogItem } | null>(null);

  // Generation estimate hook
  const estimate = useGenerationEstimate();

  // ── Derive arrays from global state ──
  const arrays = useMemo(() => {
    const grouped = projectModules.reduce((acc, mod) => {
      if (!acc[mod.model]) {
        acc[mod.model] = {
          id: mod.model,
          name: `Arranjo ${mod.model}`,
          moduleBase: mod,
          quantity: 0,
          ids: [] as string[],
        };
      }
      acc[mod.model].quantity += 1;
      acc[mod.model].ids.push(mod.id);
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped) as Array<{
      id: string;
      name: string;
      moduleBase: any;
      quantity: number;
      ids: string[];
    }>;
  }, [projectModules]);

  // Auto-select first chip
  useEffect(() => {
    if (arrays.length > 0 && (!activeChipId || !arrays.find(a => a.id === activeChipId))) {
      setActiveChipId(arrays[0].id);
    }
    if (arrays.length === 0) {
      setActiveChipId(null);
    }
  }, [arrays, activeChipId]);

  const activeArray = arrays.find(a => a.id === activeChipId);
  const activeModuleModels = arrays.map(a => a.moduleBase.model);
  const totalDcKwp = arrays.reduce((sum, a) => sum + (a.quantity * a.moduleBase.power), 0) / 1000;

  // ── Chips data ──
  const arrayChips = useMemo(() =>
    arrays.map(a => ({
      id: a.id,
      model: a.moduleBase.model,
      manufacturer: a.moduleBase.manufacturer,
      power: a.moduleBase.power,
      quantity: a.quantity,
      totalKwp: (a.quantity * a.moduleBase.power) / 1000,
    })),
  [arrays]);

  // ── Fetch catalog ──
  useEffect(() => {
    if (catalogModules.length === 0) fetchCatalog();
  }, [catalogModules.length, fetchCatalog]);

  // ── .PAN Upload ──
  const handlePanUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parsePanOnd(text);
      const mappedModule = mapPanToModule(parsed, file.name);
      const duplicate = catalogModules.find(m =>
        m.manufacturer.toLowerCase() === mappedModule.manufacturer.toLowerCase() &&
        m.model.toLowerCase() === mappedModule.model.toLowerCase()
      );
      setPendingPANModule({ module: mappedModule, duplicate });
    } catch (err) {
      console.error("Falha ao parsear .PAN", err);
      alert("Arquivo .PAN inválido ou corrompido.");
    } finally {
      e.target.value = '';
    }
  }, [catalogModules]);

  const handleConfirmPAN = (asCopy: boolean = false) => {
    if (pendingPANModule) {
      let moduleToAdd = { ...pendingPANModule.module };
      if (asCopy) moduleToAdd.model = `${moduleToAdd.model} (Importado)`;
      addCustomModule(moduleToAdd);
      setPendingPANModule(null);
    }
  };

  // ── Module selection (from ComboBox) ──
  const handleSelectModule = useCallback((item: ModuleCatalogItem) => {
    if (activeModuleModels.includes(item.model)) return;
    const pmod = item.electrical.pmax;
    const targetWp = (kWpAlvo ?? 0) * 1000;
    const currentWp = arrays.reduce((sum, a) => sum + (a.quantity * a.moduleBase.power), 0);
    const missingWp = Math.max(0, targetWp - currentWp);
    const suggested = Math.max(1, Math.ceil(missingWp / pmod));
    const specs = mapCatalogToSpecs(item);
    const newInstances = Array.from({ length: suggested }).map(() => ({
      ...specs,
      id: Math.random().toString(36).substring(2, 9)
    }));
    setModules([...projectModules, ...newInstances]);
    // Auto-select the new chip
    setActiveChipId(item.model);
  }, [activeModuleModels, kWpAlvo, arrays, projectModules, setModules]);

  // ── Quantity update ──
  const handleUpdateQty = useCallback((modelId: string, targetQty: number) => {
    const firstInstance = projectModules.find(m => m.model === modelId);
    if (firstInstance) {
      useSolarStore.getState().updateModuleQty(firstInstance.id, targetQty);
    }
  }, [projectModules]);

  // ── Remove array ──
  const handleRemoveArray = useCallback((modelId: string) => {
    const remaining = projectModules.filter(m => m.model !== modelId);
    setModules(remaining);
  }, [projectModules, setModules]);

  // ── (Compare feature uses comparingIds, but toggling is handled elsewhere or disabled for now) ──

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">

      {/* LEVEL 1: Module Selector Hub */}
      <ModuleSelectorHub
        arrayChips={arrayChips}
        activeChipId={activeChipId}
        onChipSelect={setActiveChipId}
        onChipRemove={handleRemoveArray}
        catalogModules={catalogModules}
        isLoading={isLoading}
        onSelectModule={handleSelectModule}
        activeModuleModels={activeModuleModels}
        kWpAlvo={kWpAlvo ?? 0}
        kWpInstalado={totalDcKwp}
        onUploadPan={handlePanUpload}
      />

      {/* LEVEL 2: Context Strip */}
      <ModuleContextStrip
        manufacturer={activeArray?.moduleBase.manufacturer}
        model={activeArray?.moduleBase.model}
        power={activeArray?.moduleBase.power}
        quantity={activeArray?.quantity}
        totalKwp={activeArray ? (activeArray.quantity * activeArray.moduleBase.power) / 1000 : undefined}
        totalArea={activeArray ? activeArray.quantity * (activeArray.moduleBase.area || 2.5) : undefined}
        onUpdateQty={activeArray ? (qty) => handleUpdateQty(activeArray.id, qty) : () => {}}
      />

      {/* LEVEL 3: Main Content (Chart + Technical Profile) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-950 overflow-y-auto lg:overflow-hidden @container p-3 gap-3">
        <div className="flex-1 flex flex-col min-h-[600px] lg:min-h-0 min-w-0 bg-slate-900/20 border border-slate-800/40 rounded-sm overflow-hidden shadow-2xl">
          <ModuleInsightsArea
            estimate={estimate}
            comparingIds={comparingIds}
            onSelectFromCompare={(item) => {
              handleSelectModule(item);
              setComparingIds([]);
            }}
          />
        </div>

        {/* Technical Profile */}
        <div className="w-full lg:w-[340px] shrink-0 border border-slate-800/40 rounded-sm overflow-hidden shadow-2xl bg-slate-900/20">
          <TechnicalProfile
            module={activeArray?.moduleBase}
            quantity={activeArray?.quantity}
          />
        </div>
      </div>

      {/* PAN Review Modal */}
      {pendingPANModule && (
        <PANReviewModal
          module={pendingPANModule.module}
          duplicate={pendingPANModule.duplicate}
          onConfirm={(asCopy) => handleConfirmPAN(asCopy)}
          onCancel={() => setPendingPANModule(null)}
          onUseExisting={() => {
            if (pendingPANModule.duplicate) {
              setPendingPANModule(null);
            }
          }}
        />
      )}
    </div>
  );
};
