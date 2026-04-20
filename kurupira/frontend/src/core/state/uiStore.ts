/**
 * =============================================================================
 * UI STORE — Estado Transiente de Interface (PGFX-03)
 * =============================================================================
 *
 * Store Zustand independente para estado de UI.
 * Sem persist, sem zundo, sem middleware.
 *
 * Motivação:
 * - activeTool e selectedEntity estavam em useState local no WorkspaceLayout
 * - Isso impedia consumo cross-component (SolarLayer não conseguia ler
 *   a ferramenta ativa sem prop drilling)
 * - O uiStore resolve isso com acesso global via hooks
 *
 * Corrige:
 * - A7: activeTool/selectedEntity inacessíveis cross-component
 * =============================================================================
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type Tool = 'SELECT' | 'MOVE' | 'PAN' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE' | 'STRINGING' | 'SUBTRACT' | 'DROP_POINT';

export type WorkspaceMode = 'SIMULATION' | 'ELECTRICAL' | 'REPORTS' | 'PROPOSAL';

export type CanvasViewMode = 'CONTEXT' | 'BLUEPRINT' | 'DIAGRAM' | 'UNIFILAR';

export type FocusedBlock = 'consumption' | 'module' | 'arrangement' | 'inverter' | 'simulation' | 'site' | 'proposal' | 'map' | null;

/** Etapa da animação do Dimensionamento Inteligente (Spec 03 §2.3) */
export type AutoSizingStep = 'idle' | 'consumption' | 'module' | 'inverter' | 'done';

export type EntityType = 'none' | 'module' | 'inverter' | 'string' | 'vertex' | 'polygon' | 'area' | 'placed-module' | 'site';

export interface SelectedEntity {
  type: EntityType;
  id: string | null;
  label: string;
  multiIds: string[]; // Suporte para seleção múltipla
}

const EMPTY_SELECTION: SelectedEntity = { type: 'none', id: null, label: '', multiIds: [] };

// =============================================================================
// STORE
// =============================================================================

export interface UIState {
  /** Ferramenta ativa na Ribbon */
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  /** Entidade selecionada (sincroniza Inspector + Canvas + Outliner) */
  selectedEntity: SelectedEntity;
  selectEntity: (type: EntityType, id: string, label?: string) => void;
  toggleMultiSelection: (id: string, labelPrefix?: string) => void;
  setMultiSelection: (ids: string[], labelPrefix?: string) => void;
  clearSelection: () => void;

  /** Snapshot Snapshot Base64 para a Proposta (Passagem de contexto cross-module) */
  viewportSnapshot: string | null;
  setViewportSnapshot: (base64: string) => void;

  /** Modo visual ativo no Workspace (substitui navegação por abas globais) */
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  /** Nó da Jornada (LeftOutliner) focado, serve de gatilho para atualizar abas e Views do CenterCanvas */
  activeFocusedBlock: FocusedBlock;
  setFocusedBlock: (block: FocusedBlock) => void;

  /** Modo de Visualização do Canvas (estilo Blender: Context/Blueprint/Diagram/Unifilar) */
  canvasViewMode: CanvasViewMode;
  setCanvasViewMode: (mode: CanvasViewMode) => void;

  /** Etapa da animação do Dimensionamento Inteligente */
  autoSizingStep: AutoSizingStep;
  setAutoSizingStep: (step: AutoSizingStep) => void;
  /**
   * Dispara a animação sequencial de lego-snap:
   * idle → consumption → module → inverter → done → setFocusedBlock('module')
   */
  triggerAutoSizing: () => void;

  /** Tipo de mapa base (Satélite Mapbox/Esri, Google Satellite ou Padrão/Rua) */
  mapType: 'SATELLITE' | 'STREET' | 'GOOGLE_SATELLITE';
  setMapType: (type: 'SATELLITE' | 'STREET' | 'GOOGLE_SATELLITE') => void;

  /** Estado do Modal/Drawer Suspenso de Premissas (Menu Configurações do Projeto) */
  isSettingsDrawerOpen: boolean;
  toggleSettingsDrawer: () => void;
  closeSettingsDrawer: () => void;

  /** Painel lateral de Anatomia do Suporte (D4: migrado de useState local → Zustand) */
  isAnatomyPanelOpen: boolean;
  toggleAnatomyPanel: () => void;
  closeAnatomyPanel: () => void;
  
  /** Busca de Endereço (Explorer) */
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'SELECT',
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedEntity: EMPTY_SELECTION,
  selectEntity: (type, id, label = '') => set({ selectedEntity: { type, id, label, multiIds: [id] } }),
  toggleMultiSelection: (id, labelPrefix = 'Módulos') => set((state) => {
    if (state.selectedEntity.type === 'none') return state; // Só faz sentido se já houver algo do tipo
    
    const currentMulti = state.selectedEntity.multiIds;
    const isSelected = currentMulti.includes(id);
    const newMulti = isSelected ? currentMulti.filter(x => x !== id) : [...currentMulti, id];
    
    if (newMulti.length === 0) return { selectedEntity: EMPTY_SELECTION };
    
    // O primary 'id' passa a ser o último adicionado, ou o primeiro restante
    const newPrimary = newMulti[newMulti.length - 1];
    const newLabel = newMulti.length > 1 ? `${newMulti.length} ${labelPrefix} Selecionados` : state.selectedEntity.label;
    
    return {
      selectedEntity: {
        ...state.selectedEntity,
        id: newPrimary,
        multiIds: newMulti,
        label: newLabel
      }
    };
  }),
  setMultiSelection: (ids, labelPrefix = 'Módulos') => set((state) => {
    if (state.selectedEntity.type === 'none' || ids.length === 0) return state;
    
    const newMulti = Array.from(new Set([...state.selectedEntity.multiIds, ...ids]));
    const newPrimary = newMulti[newMulti.length - 1];
    const newLabel = newMulti.length > 1 ? `${newMulti.length} ${labelPrefix} Selecionados` : state.selectedEntity.label;
    
    return {
      selectedEntity: {
        ...state.selectedEntity,
        id: newPrimary,
        multiIds: newMulti,
        label: newLabel
      }
    };
  }),
  clearSelection: () => set({ selectedEntity: EMPTY_SELECTION }),

  viewportSnapshot: null,
  setViewportSnapshot: (base64) => set({ viewportSnapshot: base64 }),

  workspaceMode: 'SIMULATION',
  setWorkspaceMode: (mode: WorkspaceMode) => set({ workspaceMode: mode }),

  activeFocusedBlock: 'site',
  setFocusedBlock: (block: FocusedBlock) => set({ activeFocusedBlock: block }),

  canvasViewMode: 'CONTEXT',
  setCanvasViewMode: (mode: CanvasViewMode) => set({ canvasViewMode: mode }),

  autoSizingStep: 'idle',
  setAutoSizingStep: (step: AutoSizingStep) => set({ autoSizingStep: step }),
  triggerAutoSizing: () => {
    // Animação sequencial: cada etapa dura 400ms (lego-snap)
    set({ autoSizingStep: 'consumption' });
    setTimeout(() => set({ autoSizingStep: 'module' }), 400);
    setTimeout(() => set({ autoSizingStep: 'inverter' }), 800);
    setTimeout(() => {
      set({ autoSizingStep: 'done', activeFocusedBlock: 'module' });
      setTimeout(() => set({ autoSizingStep: 'idle' }), 600);
    }, 1200);
  },


  isSettingsDrawerOpen: false,
  toggleSettingsDrawer: () => set((state) => ({ isSettingsDrawerOpen: !state.isSettingsDrawerOpen })),
  closeSettingsDrawer: () => set({ isSettingsDrawerOpen: false }),

  isAnatomyPanelOpen: false,
  toggleAnatomyPanel: () => set((state) => ({ isAnatomyPanelOpen: !state.isAnatomyPanelOpen })),
  closeAnatomyPanel: () => set({ isAnatomyPanelOpen: false }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  mapType: 'GOOGLE_SATELLITE',
  setMapType: (type) => set({ mapType: type }),
}));

// =============================================================================
// CONVENIENCE HOOKS (evita re-renders desnecessários)
// =============================================================================

/** Retorna apenas a ferramenta ativa — re-render só quando muda */
export const useActiveTool = () => useUIStore(s => s.activeTool);

/** Retorna apenas a entidade selecionada — re-render só quando muda */
export const useSelectedEntity = () => useUIStore(s => s.selectedEntity);

/** Hook de atalho para o bloco em foco pela Jornada do Integrador */
export const useFocusedBlock = () => useUIStore(s => s.activeFocusedBlock);
