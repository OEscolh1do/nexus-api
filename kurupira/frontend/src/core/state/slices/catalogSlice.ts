/**
 * CATALOG-SLICE.TS
 * P4-3: Slice para dados de catálogo (módulos e inversores disponíveis)
 * 
 * REGRA CRÍTICA: Este slice é EXCLUÍDO do partialize do Zundo (temporal)
 * e do persist (localStorage). Filtragens e navegações no catálogo
 * NUNCA devem poluir o histórico de Undo/Redo do projeto.
 * 
 * Os dados são carregados sob demanda via InMemoryEquipmentRepo.
 */

import { StateCreator } from 'zustand';
import { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { InverterSpecs } from '@/core/schemas/equipment.schemas';
import { InMemoryEquipmentRepo } from '@/services/adapters/InMemoryEquipmentRepo';

export interface CatalogSlice {
  /** Lista completa de módulos disponíveis para seleção */
  catalogModules: ModuleCatalogItem[];

  /** Lista completa de inversores disponíveis para seleção */
  catalogInverters: InverterSpecs[];

  /** Flag para evitar recarregamento desnecessário */
  isCatalogLoaded: boolean;

  /** Carrega todos os equipamentos do repositório */
  loadCatalog: () => Promise<void>;
}

const repo = new InMemoryEquipmentRepo();

export const createCatalogSlice: StateCreator<
  CatalogSlice,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  catalogModules: [],
  catalogInverters: [],
  isCatalogLoaded: false,

  loadCatalog: async () => {
    // Evita recarregamento se já foi carregado
    if (get().isCatalogLoaded) return;

    const [modules, inverters] = await Promise.all([
      repo.getModules(),
      repo.getInverters(),
    ]);

    set({
      catalogModules: modules,
      catalogInverters: inverters,
      isCatalogLoaded: true,
    });
  },
});
