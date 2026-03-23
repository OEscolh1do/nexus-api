/**
 * NORMALIZED.TYPES.TS
 * Estrutura normalizada para coleções de entidades no Zustand Store.
 * 
 * Motivação (PRÉ-1 — Auditoria 22/03/2026):
 *   Arrays (T[]) causam O(n) em lookups e geram nova referência
 *   do array inteiro em qualquer update, disparando re-renders
 *   em todos os consumidores.
 * 
 *   A estrutura { ids, entities } permite O(1) em lookup/update
 *   e gera nova referência apenas da entidade modificada.
 */

// ─── Core Type ──────────────────────────────────────────────

export interface NormalizedCollection<T extends { id: string }> {
  /** Lista ordenada de IDs (preserva ordem de inserção) */
  ids: string[];
  /** Mapa de entidades por ID (O(1) lookup) */
  entities: Record<string, T>;
}

// ─── Factory ────────────────────────────────────────────────

/** Cria uma coleção vazia tipada */
export const createEmptyCollection = <T extends { id: string }>(): NormalizedCollection<T> => ({
  ids: [],
  entities: {},
});

// ─── Conversores ────────────────────────────────────────────

/** NormalizedCollection → T[] (para seletores e componentes legados) */
export const toArray = <T extends { id: string }>(collection: NormalizedCollection<T>): T[] =>
  collection.ids.map(id => collection.entities[id]).filter(Boolean);

/** T[] → NormalizedCollection (para migração e setters bulk) */
export const fromArray = <T extends { id: string }>(arr: T[]): NormalizedCollection<T> => ({
  ids: arr.map(item => item.id),
  entities: Object.fromEntries(arr.map(item => [item.id, item])) as Record<string, T>,
});
