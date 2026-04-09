/**
 * =============================================================================
 * PANEL STORE — Estado de Layout dos Painéis (UX-002)
 * =============================================================================
 *
 * Zustand store para estado de layout do dock/center.
 * Sem persist, sem Zundo — estado transiente de UI.
 *
 * V2 (Fase 2): Completo com collapse + center swap.
 *
 * Invariantes (SPEC-000):
 * 1. Apenas um painel no center por vez — promoteToCenter substitui, não acumula
 * 2. O mapa nunca é destruído — display: none preserva Leaflet
 * 3. Colapsar grupo promovido é no-op (está maximizado no center)
 * 4. restoreMap quando centerContent === 'map' é no-op
 * =============================================================================
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

/**
 * IDs dos grupos registrados no dock.
 * Extensível — novos grupos podem ser adicionados sem alterar a store.
 */
export type PanelGroupId = 'site' | 'simulation' | 'electrical' | 'properties' | 'minimap';

// =============================================================================
// STORE
// =============================================================================

interface PanelState {
  /**
   * Qual conteúdo está renderizado no Center Slot.
   * Default: 'map' — o mapa Leaflet/WebGL.
   */
  centerContent: 'map' | PanelGroupId;

  /** Set de IDs de grupos atualmente colapsados no dock. */
  collapsedGroups: Set<PanelGroupId>;

  /** Promove um grupo ao center. O mapa automaticamente vai para o dock. */
  promoteToCenter: (groupId: PanelGroupId) => void;

  /** Restaura o mapa ao center. O grupo promovido volta ao dock. */
  restoreMap: () => void;

  /** Toggle collapse de um grupo no dock. */
  toggleCollapse: (id: PanelGroupId) => void;

  /** Fecha (colapsa) um grupo específico. */
  collapseGroup: (id: PanelGroupId) => void;

  /** Expande um grupo específico. */
  expandGroup: (id: PanelGroupId) => void;
}

/** Grupos que iniciam colapsados por default */
const INITIAL_COLLAPSED: PanelGroupId[] = ['electrical'];

export const usePanelStore = create<PanelState>((set) => ({
  centerContent: 'map',
  collapsedGroups: new Set<PanelGroupId>(INITIAL_COLLAPSED),

  promoteToCenter: (groupId) =>
    set((state) => {
      if (state.centerContent === groupId) return state; // já está promovido
      return { centerContent: groupId };
    }),

  restoreMap: () =>
    set((state) => {
      if (state.centerContent === 'map') return state; // já é o mapa
      return { centerContent: 'map' };
    }),

  toggleCollapse: (id) =>
    set((state) => {
      // Invariante 3: não colapsa grupo que está promovido ao center
      if (state.centerContent === id) return state;
      const next = new Set(state.collapsedGroups);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { collapsedGroups: next };
    }),

  collapseGroup: (id) =>
    set((state) => {
      if (state.collapsedGroups.has(id) || state.centerContent === id) return state;
      const next = new Set(state.collapsedGroups);
      next.add(id);
      return { collapsedGroups: next };
    }),

  expandGroup: (id) =>
    set((state) => {
      if (!state.collapsedGroups.has(id)) return state;
      const next = new Set(state.collapsedGroups);
      next.delete(id);
      return { collapsedGroups: next };
    }),
}));

// =============================================================================
// CONVENIENCE HOOKS (evita re-renders desnecessários)
// =============================================================================

/** Retorna o conteúdo do center (re-render só quando muda) */
export const useCenterContent = () => usePanelStore((s) => s.centerContent);

/** Retorna se um grupo específico está colapsado */
export const useIsCollapsed = (id: PanelGroupId) =>
  usePanelStore((s) => s.collapsedGroups.has(id));

/** Retorna se um grupo específico está promovido ao center */
export const useIsPromoted = (id: PanelGroupId) =>
  usePanelStore((s) => s.centerContent === id);
