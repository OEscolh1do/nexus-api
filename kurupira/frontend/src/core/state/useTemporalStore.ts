/**
 * useTemporalStore.ts — Hook reativo para Undo/Redo (PRÉ-2)
 *
 * Converte o temporal store (vanilla) do zundo em um hook React reativo.
 * Componentes que usam este hook re-renderizam quando pastStates/futureStates mudam.
 *
 * Uso:
 *   const { undo, redo, clear } = useTemporalStore(state => state);
 *   const canUndo = useTemporalStore(state => state.pastStates.length > 0);
 */

import { useStore } from 'zustand';
import type { TemporalState } from 'zundo';
import { useSolarStore, type SolarState } from './solarStore';

/**
 * Tipo parcializado rastreado pelo temporal.
 * Espelha exatamente o que é retornado pelo `partialize` do temporal em solarStore.
 */
export type TrackedSolarState = Pick<
  SolarState,
  | 'modules'
  | 'inverters'
  | 'simulatedItems'
  | 'engineeringData'
  | 'bosInventory'
  | 'settings'
  | 'clientData'
  | 'legalData'
>;

/**
 * Hook reativo para o temporal store.
 * Permite consumir undo/redo/clear/pastStates/futureStates em componentes React.
 */
export function useTemporalStore<T>(
  selector: (state: TemporalState<TrackedSolarState>) => T,
): T {
  return useStore(useSolarStore.temporal, selector);
}
