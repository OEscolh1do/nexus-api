import React, { useEffect, useState, useMemo } from 'react';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { useCatalogStore } from '../../../store/useCatalogStore';
import { mapCatalogToSpecs } from '../../../utils/catalogMappers';
import { parsePanOnd } from '@/utils/pvsystParser';
import { mapPanToModule } from '@/utils/panToModuleMapper';

import { PVArrayBuilder } from './module/PVArrayBuilder';
import { HardwareLibraryPanel } from './module/HardwareLibraryPanel';
import { ComparisonDrawer } from './module/ComparisonDrawer';
import { PANReviewModal } from './module/PANReviewModal';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [comparingIds, setComparingIds] = useState<string[]>([]);
  const [pendingPANModule, setPendingPANModule] = useState<{ module: ModuleCatalogItem; duplicate?: ModuleCatalogItem } | null>(null);
  
  // Derivando os Arrays do estado global
  const arrays = useMemo(() => {
    const grouped = projectModules.reduce((acc, mod) => {
      if (!acc[mod.model]) {
        acc[mod.model] = {
          id: mod.model, // Usando o modelo como ID do array
          name: `Arranjo ${mod.model}`,
          moduleBase: mod,
          quantity: 0
        };
      }
      acc[mod.model].quantity += 1;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped);
  }, [projectModules]);

  const activeModuleModels = arrays.map(a => a.moduleBase.model);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const parsed = parsePanOnd(text);
      const mappedModule = mapPanToModule(parsed, file.name);
      
      // Busca duplicata no catálogo (Case Insensitive)
      const duplicate = catalogModules.find(m => 
        m.manufacturer.toLowerCase() === mappedModule.manufacturer.toLowerCase() &&
        m.model.toLowerCase() === mappedModule.model.toLowerCase()
      );

      setPendingPANModule({ 
        module: mappedModule, 
        duplicate 
      });
    } catch (err) {
      console.error("Falha ao parsear .PAN", err);
      alert("Arquivo .PAN inválido ou corrompido.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmPAN = (asCopy: boolean = false) => {
    if (pendingPANModule) {
      let moduleToAdd = { ...pendingPANModule.module };
      
      if (asCopy) {
        moduleToAdd.model = `${moduleToAdd.model} (Importado)`;
      }

      addCustomModule(moduleToAdd);
      setSearchTerm(moduleToAdd.model);
      setPendingPANModule(null);
    }
  };

  useEffect(() => {
    if (catalogModules.length === 0) {
      fetchCatalog();
    }
  }, [catalogModules.length, fetchCatalog]);

  const filteredModules = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return catalogModules.filter(m => 
      m.model.toLowerCase().includes(term) || 
      m.manufacturer.toLowerCase().includes(term) ||
      m.electrical.pmax.toString().includes(term)
    );
  }, [catalogModules, searchTerm]);

  const handleSelectModule = (item: any) => {
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
  };

  const handleUpdateQty = (modelId: string, targetQty: number) => {
    const firstInstance = projectModules.find(m => m.model === modelId);
    if (firstInstance) {
       useSolarStore.getState().updateModuleQty(firstInstance.id, targetQty);
    }
  };

  const handleRemoveArray = (modelId: string) => {
    const remaining = projectModules.filter(m => m.model !== modelId);
    setModules(remaining);
  };

  const handleToggleCompare = (id: string) => {
    setComparingIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="w-full h-full flex bg-slate-950 overflow-hidden relative">
      <HardwareLibraryPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredModules={filteredModules}
        activeModuleModels={activeModuleModels}
        isLoading={isLoading}
        onSelect={handleSelectModule}
        onHover={() => {}}
        comparingIds={comparingIds}
        onToggleCompare={handleToggleCompare}
        onUploadPan={handlePanUpload}
      />

      <PVArrayBuilder
        arrays={arrays}
        onUpdateQty={handleUpdateQty}
        onRemoveArray={handleRemoveArray}
        targetWp={(kWpAlvo ?? 0) * 1000}
      />

      {comparingIds.length > 0 && (
        <ComparisonDrawer 
          ids={comparingIds} 
          onClose={() => setComparingIds([])}
          onRemove={handleToggleCompare}
          onSelect={(item) => {
             handleSelectModule(item);
             setComparingIds([]);
          }}
        />
      )}

      {/* Modal de Revisão Técnica */}
      {pendingPANModule && (
        <PANReviewModal 
          module={pendingPANModule.module}
          duplicate={pendingPANModule.duplicate}
          onConfirm={(asCopy) => handleConfirmPAN(asCopy)}
          onCancel={() => setPendingPANModule(null)}
          onUseExisting={() => {
             if (pendingPANModule.duplicate) {
                setSearchTerm(pendingPANModule.duplicate.model);
                setPendingPANModule(null);
             }
          }}
        />
      )}
    </div>
  );
};
