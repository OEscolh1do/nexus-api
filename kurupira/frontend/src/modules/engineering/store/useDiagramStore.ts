/**
 * =============================================================================
 * DIAGRAM STORE — Persistência do Layer 2 (DiagramCanvasView)
 * =============================================================================
 * Armazena wires e blockPositions por inverterId para que o diagrama de blocos
 * sobreviva a trocas de aba e recarregamentos de página.
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

  setWires: (inverterId: string, wires: PersistedWire[]) => void;
  setBlockPositions: (inverterId: string, positions: PersistedBlockPositions) => void;
  clearDiagram: (inverterId: string) => void;
}

export const useDiagramStore = create<DiagramStoreState>()(
  persist(
    (set) => ({
      wiresMap: {},
      blockPositionsMap: {},

      setWires: (inverterId, wires) =>
        set(s => ({ wiresMap: { ...s.wiresMap, [inverterId]: wires } })),

      setBlockPositions: (inverterId, positions) =>
        set(s => ({ blockPositionsMap: { ...s.blockPositionsMap, [inverterId]: positions } })),

      clearDiagram: (inverterId) =>
        set(s => {
          const { [inverterId]: _w, ...restW } = s.wiresMap;
          const { [inverterId]: _p, ...restP } = s.blockPositionsMap;
          return { wiresMap: restW, blockPositionsMap: restP };
        }),
    }),
    { name: 'kurupira-diagram-v1' }
  )
);
