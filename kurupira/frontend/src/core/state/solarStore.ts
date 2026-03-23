/**
 * SOLAR-STORE.TS - Store Global Zustand para Lumi
 * 
 * Responsabilidade: Composição de todos os slices de estado da aplicação.
 * Gerencia persistência no localStorage e integração com DevTools.
 * 
 * ARQUITETURA V2.1.0 - Workflow de Alta Precisão:
 * - ClientSlice: Dados do cliente (CRM)
 * - TechSlice: Módulos, inversores e settings técnicos
 * - EngineeringSlice: Geometria solar (orientação, azimute, inclinação)
 * - ElectricalSlice: Inventário BOS (cabeamento, proteções)
 * - UIState: Estado da interface (role, módulo ativo)
 * 
 * // NOTA: Seguindo o padrão "Slices" do Zustand para separação de concerns
 * //       Cada slice é responsável por um domínio específico do negócio
 */

import { create, StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import throttle from 'lodash.throttle';

// Slices de domínio
import { ClientSlice, createClientSlice } from './slices/clientSlice';
import { TechSlice, createTechSlice } from './slices/techSlice';
import { EngineeringSlice, createEngineeringSlice } from './slices/engineeringSlice';
import { ElectricalSlice, createElectricalSlice } from './slices/electricalSlice';
import { ProjectSlice, createProjectSlice } from './slices/projectSlice';
import { CatalogSlice, createCatalogSlice } from './slices/catalogSlice';

// PRÉ-1: fromArray mantido para uso em actions do store (addModule, etc.)
import { fromArray } from '@/core/types/normalized.types';


/**
 * Interface do slice de UI
 * Gerencia estado transiente da interface (não persiste todos os campos)
 */
export interface UIState {
  /** Role do usuário logado (afeta visibilidade de abas/funcionalidades) */
  userRole: 'SALES' | 'ENGINEER' | 'ADMIN';

  /** Módulo/aba atualmente ativo no dashboard */
  activeModule: string;

  /** ID do projeto atual aberto (null se for novo) */
  activeProjectId: string | null;

  /** Actions */
  setUserRole: (role: 'SALES' | 'ENGINEER' | 'ADMIN') => void;
  setActiveModule: (module: string) => void;
  setActiveProjectId: (id: string | null) => void;
}

/**
 * Tipo composto de todo o estado da aplicação
 * União de todos os slices de domínio + UI
 * 
 * // IMPORTANTE: Esta tipagem é a "fonte de verdade" para o estado global
 * //             Todos os componentes consumem via useSolarStore()
 */
export type SolarState =
  & ClientSlice
  & TechSlice
  & EngineeringSlice
  & ElectricalSlice
  & ProjectSlice
  & CatalogSlice
  & UIState;

/**
 * Factory function para o slice de UI
 * Tipagem explícita para evitar `any` (mandato de arquitetura)
 */
const createUISlice: StateCreator<
  SolarState,
  [],
  [],
  UIState
> = (set) => ({
  userRole: 'SALES', // Default: perfil de vendas
  activeModule: 'hub', // Default: Project Explorer (UX-001 entry point)
  activeProjectId: null,
  setUserRole: (role) => set({ userRole: role }),
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
});

/**
 * Store principal da aplicação
 * 
 * Middlewares aplicados:
 * - devtools: Integração com Redux DevTools (debug)
 * - persist: Persistência no localStorage
 * 
 * // ATENÇÃO MIGRAÇÃO: Se a estrutura do estado mudar, dados antigos
 * //                   no localStorage podem causar inconsistências.
 * //                   Usuários devem limpar localStorage na V2.1.0
 */
export const useSolarStore = create<SolarState>()(
  devtools(
    persist(
      temporal(
        (set, get, api) => ({
          // Composição de todos os slices
          ...createClientSlice(set, get, api),
          ...createTechSlice(set, get, api),
          ...createEngineeringSlice(set, get, api),
          ...createElectricalSlice(set, get, api),
          ...createProjectSlice(set, get, api),
          ...createCatalogSlice(set, get, api),

          ...createUISlice(set, get, api),
        }),
        {
          /**
           * PRÉ-2: Partialize temporal — só rastreia estado de domínio.
           * Estado de UI (userRole, activeModule, activeProjectId) é excluído
           * para não poluir o histórico com mudanças de navegação.
           */
          partialize: (state) => ({
            modules: state.modules,
            inverters: state.inverters,
            simulatedItems: state.simulatedItems,
            engineeringData: state.engineeringData,
            bosInventory: state.bosInventory,
            settings: state.settings,
            clientData: state.clientData,
            legalData: state.legalData,
            project: state.project, // PGFX-02: Geometria reversível via Ctrl+Z
          }),
          /**
           * PRÉ-2: Throttle 500ms — agrupa edições contínuas (sliders, inputs)
           * em uma única entrada no histórico.
           */
          handleSet: (handleSet) =>
            throttle<typeof handleSet>((state) => {
              handleSet(state);
            }, 500),
          /**
           * PRÉ-2: Limita histórico a 50 estados para performance.
           */
          limit: 50,
        },
      ),
      {
        name: 'solar-flow-storage',

        /**
         * PRÉ-1: Versão do schema persistido.
         * V0 (implícito): arrays T[]
         * V1: NormalizedCollection { ids, entities }
         */
        version: 1,

        /**
         * PRÉ-1: Migração automática de localStorage antigo.
         * Converte arrays para estrutura normalizada na hidratação.
         */
        migrate: (persisted: any, version: number) => {
          if (version === 0 || !version) {
            // modules: T[] → { ids, entities }
            if (Array.isArray(persisted.modules)) {
              persisted.modules = fromArray(persisted.modules);
            }
            // inverters: T[] → { ids, entities }
            if (Array.isArray(persisted.inverters)) {
              persisted.inverters = fromArray(persisted.inverters);
            }
            // simulatedItems: T[] → { ids, entities }
            if (Array.isArray(persisted.simulatedItems)) {
              persisted.simulatedItems = fromArray(persisted.simulatedItems);
            }
          }
          return persisted as SolarState;
        },

        /**
         * Partialize: Define quais campos são persistidos
         * 
         * // NOTA: Não persistimos weatherData (cache de API)
         * //       porque pode ficar desatualizado e é facilmente re-fetched
         */
        partialize: (state) => ({
          // Cliente (CRM)
          clientData: state.clientData,
          legalData: state.legalData,
          simulatedItems: state.simulatedItems,

          // Técnico (Equipamentos) — PRÉ-1: agora NormalizedCollection
          modules: state.modules,
          inverters: state.inverters,
          settings: state.settings,

          // Engenharia (Geometria Solar) - NOVO V2.1.0
          engineeringData: state.engineeringData,

          // Elétrico (BOS) - NOVO V2.1.0
          bosInventory: state.bosInventory,

          // Projeto (Geometria do Sítio) - PGFX-02
          project: state.project,

          // UI (apenas role)
          userRole: state.userRole,
          // NÃO persistir activeModule - sempre começa no CRM
        }),
      }
    ),
    { name: 'Lumi Store' } // Nome no DevTools
  )
);

/**
 * Seletores tipados para acesso otimizado ao estado
 * 
 * PRÉ-1: selectModules e selectInverters retornam T[] via toArray()
 *        para backward-compatibility com consumidores existentes.
 *        selectSimulatedItems adicionado.
 * 
 * Exemplo: const modules = useSolarStore(selectModules); // ModuleSpecs[]
 */
export const selectClientData = (state: SolarState) => state.clientData;
export const selectLegalData = (state: SolarState) => state.legalData;
export const selectEngineeringData = (state: SolarState) => state.engineeringData;
export const selectBOSInventory = (state: SolarState) => state.bosInventory;
export const selectSettings = (state: SolarState) => state.settings;

// PRÉ-1 → PGFX-04: Seletores de compatibilidade ESTÁVEIS
// CORREÇÃO A9: toArray() criava novo array a cada chamada, causando
// infinite loop em React 18 (useSyncExternalStore detectava snapshot instável).
// Agora re-exporta de solarSelectors.ts com memoização por referência.
import {
  selectModulesStable as selectModules,
  selectInvertersStable as selectInverters,
  selectSimulatedItemsStable as selectSimulatedItems,
} from './solarSelectors';

export { selectModules, selectInverters, selectSimulatedItems };

export const selectUserRole = (state: SolarState) => state.userRole;
