/**
 * CATALOG-SLICE.TS
 * @deprecated P8: Este slice foi substituído pelo `useCatalogStore` (Zustand standalone).
 * Mantido temporariamente para não quebrar a tipagem do solarStore combinado.
 * Migre consumidores para: import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
 * 
 * Os dados carregados aqui NÃO contêm MPPTs fiéis ao banco nem fallback de imagem.
 * Use `useCatalogStore` para dados completos e atualizados.
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
