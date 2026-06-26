/**
 * =============================================================================
 * @deprecated useDiagramStore
 * =============================================================================
 * Este store é legado. Persiste `wiresMap` / `blockPositionsMap` do
 * DiagramCanvasView (Layer 2) que usa o antigo formato `blockDiagramFootprint`.
 *
 * O novo motor de topologia usa `TopologyConfig` (sumauma/frontend/src/lib/types/topology.ts)
 * armazenado em `useTechStore.projectTopologyConfig` e editado via `TopologyEditor`.
 *
 * TODO: Migrar DiagramCanvasView para TopologyEditor e remover este store.
 * Tracked em: Kurupira engineering canvases migration
 * =============================================================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos espelhados de DiagramCanvasView (sem re-exportar o componente inteiro)
export interface PersistedWire {
  id: string;
  fromBlockId: string;
  fromPortId: string;
  toBlockId: string;
  toPortId: string;
  color: string;
}

export type PersistedBlockPositions = Record<string, { x: number; y: number }>;

interface DiagramStoreState {
  /** Wires por inverterId */
  wiresMap: Record<string, PersistedWire[]>;
  /** Posições de blocos por inverterId */
  blockPositionsMap: Record<string, PersistedBlockPositions>;
  /** BUG 8.1 fix: Persist wireLabels (wire annotations) */
  wireLabelsMap: Record<string, Record<string, string>>;
  /** BUG 8.1 fix: Persist blockNotes (sticky notes) */
  blockNotesMap: Record<string, Record<string, string>>;
  /** BUG 8.1 fix: Persist lockedBlockIds (which blocks are locked) */
  lockedBlockIdsMap: Record<string, string[]>;

  setWires: (inverterId: string, wires: PersistedWire[]) => void;
  setBlockPositions: (inverterId: string, positions: PersistedBlockPositions) => void;
  setWireLabels: (inverterId: string, labels: Record<string, string>) => void;
  setBlockNotes: (inverterId: string, notes: Record<string, string>) => void;
  setLockedBlockIds: (inverterId: string, lockedIds: string[]) => void;
  clearDiagram: (inverterId: string) => void;
}

// Validation helpers
function isValidWire(w: unknown): w is PersistedWire {
  if (!w || typeof w !== 'object') return false;
  const wire = w as Record<string, unknown>;
  return typeof wire.id === 'string' &&
    typeof wire.fromBlockId === 'string' &&
    typeof wire.fromPortId === 'string' &&
    typeof wire.toBlockId === 'string' &&
    typeof wire.toPortId === 'string' &&
    typeof wire.color === 'string';
}

function isValidPosition(p: unknown): p is { x: number; y: number } {
  if (!p || typeof p !== 'object') return false;
  const pos = p as Record<string, unknown>;
  return typeof pos.x === 'number' && typeof pos.y === 'number';
}

export const useDiagramStore = create<DiagramStoreState>()(
  persist(
    (set) => ({
      wiresMap: {},
      blockPositionsMap: {},
      wireLabelsMap: {},
      blockNotesMap: {},
      lockedBlockIdsMap: {},

      setWires: (inverterId, wires) =>
        set(s => ({ wiresMap: { ...s.wiresMap, [inverterId]: wires } })),

      setBlockPositions: (inverterId, positions) =>
        set(s => ({ blockPositionsMap: { ...s.blockPositionsMap, [inverterId]: positions } })),

      setWireLabels: (inverterId, labels) =>
        set(s => ({ wireLabelsMap: { ...s.wireLabelsMap, [inverterId]: labels } })),

      setBlockNotes: (inverterId, notes) =>
        set(s => ({ blockNotesMap: { ...s.blockNotesMap, [inverterId]: notes } })),

      setLockedBlockIds: (inverterId, lockedIds) =>
        set(s => ({ lockedBlockIdsMap: { ...s.lockedBlockIdsMap, [inverterId]: lockedIds } })),

      clearDiagram: (inverterId) =>
        set(s => {
          const { [inverterId]: _w, ...restW } = s.wiresMap;
          const { [inverterId]: _p, ...restP } = s.blockPositionsMap;
          const { [inverterId]: _wl, ...restWL } = s.wireLabelsMap;
          const { [inverterId]: _bn, ...restBN } = s.blockNotesMap;
          const { [inverterId]: _lb, ...restLB } = s.lockedBlockIdsMap;
          return {
            wiresMap: restW,
            blockPositionsMap: restP,
            wireLabelsMap: restWL,
            blockNotesMap: restBN,
            lockedBlockIdsMap: restLB
          };
        }),
    }),
    {
      name: 'kurupira-diagram-v1',
      // BUG-01 fix: Validate persisted data on hydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Validate and filter wiresMap
        const validWiresMap: Record<string, PersistedWire[]> = {};
        Object.entries(state.wiresMap).forEach(([key, wires]) => {
          if (Array.isArray(wires)) {
            const validWires = wires.filter(isValidWire);
            if (validWires.length > 0) validWiresMap[key] = validWires;
          }
        });
        state.wiresMap = validWiresMap;

        // Validate and filter blockPositionsMap
        const validPositionsMap: Record<string, PersistedBlockPositions> = {};
        Object.entries(state.blockPositionsMap).forEach(([key, positions]) => {
          if (positions && typeof positions === 'object') {
            const validPositions: PersistedBlockPositions = {};
            Object.entries(positions).forEach(([blockId, pos]) => {
              if (isValidPosition(pos)) validPositions[blockId] = pos;
            });
            if (Object.keys(validPositions).length > 0) validPositionsMap[key] = validPositions;
          }
        });
        state.blockPositionsMap = validPositionsMap;

        // BUG 8.1 fix: Initialize new maps if they don't exist (migration from older persisted state)
        if (!state.wireLabelsMap) state.wireLabelsMap = {};
        if (!state.blockNotesMap) state.blockNotesMap = {};
        if (!state.lockedBlockIdsMap) state.lockedBlockIdsMap = {};
      },
    }
  )
);
