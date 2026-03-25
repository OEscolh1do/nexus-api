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

export type Tool = 'SELECT' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE';

export type EntityType = 'none' | 'module' | 'inverter' | 'string' | 'vertex' | 'polygon' | 'area';

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

interface UIState {
  /** Ferramenta ativa na Ribbon */
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  /** Entidade selecionada (sincroniza Inspector + Canvas + Outliner) */
  selectedEntity: SelectedEntity;
  selectEntity: (type: EntityType, id: string, label?: string) => void;
  toggleMultiSelection: (id: string, labelPrefix?: string) => void;
  clearSelection: () => void;

  /** Snapshot Snapshot Base64 para a Proposta (Passagem de contexto cross-module) */
  viewportSnapshot: string | null;
  setViewportSnapshot: (base64: string) => void;
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
  clearSelection: () => set({ selectedEntity: EMPTY_SELECTION }),

  viewportSnapshot: null,
  setViewportSnapshot: (base64) => set({ viewportSnapshot: base64 }),
}));

// =============================================================================
// CONVENIENCE HOOKS (evita re-renders desnecessários)
// =============================================================================

/** Retorna apenas a ferramenta ativa — re-render só quando muda */
export const useActiveTool = () => useUIStore(s => s.activeTool);

/** Retorna apenas a entidade selecionada — re-render só quando muda */
export const useSelectedEntity = () => useUIStore(s => s.selectedEntity);
