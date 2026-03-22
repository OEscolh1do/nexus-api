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

// Slices de domínio
import { ClientSlice, createClientSlice } from './slices/clientSlice';
import { TechSlice, createTechSlice } from './slices/techSlice';
import { EngineeringSlice, createEngineeringSlice } from './slices/engineeringSlice';
import { ElectricalSlice, createElectricalSlice } from './slices/electricalSlice';


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
      (set, get, api) => ({
        // Composição de todos os slices
        ...createClientSlice(set, get, api),
        ...createTechSlice(set, get, api),
        ...createEngineeringSlice(set, get, api),
        ...createElectricalSlice(set, get, api),

        ...createUISlice(set, get, api),
      }),
      {
        name: 'solar-flow-storage',
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

          // Técnico (Equipamentos)
          modules: state.modules,
          inverters: state.inverters,
          settings: state.settings,

          // Engenharia (Geometria Solar) - NOVO V2.1.0
          engineeringData: state.engineeringData,

          // Elétrico (BOS) - NOVO V2.1.0
          bosInventory: state.bosInventory,



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
 * Use estes para evitar re-renders desnecessários
 * 
 * Exemplo de uso:
 * const clientData = useSolarStore(selectClientData);
 */
export const selectClientData = (state: SolarState) => state.clientData;
export const selectLegalData = (state: SolarState) => state.legalData;
export const selectEngineeringData = (state: SolarState) => state.engineeringData;
export const selectBOSInventory = (state: SolarState) => state.bosInventory;
export const selectSettings = (state: SolarState) => state.settings;
export const selectModules = (state: SolarState) => state.modules;
export const selectInverters = (state: SolarState) => state.inverters;


export const selectUserRole = (state: SolarState) => state.userRole;
