/**
 * symbolEditorLibrary — useRemoteLibrary hook for SymbolEditorCanvas
 *
 * Extracted from SymbolEditorCanvas.tsx (H2).
 * Manages symbol catalog persistence: API-first, localStorage fallback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { KurupiraClient } from '../../../../../../services/NexusClient';
import type { LibraryEntry, SymElem } from './symbolEditorTypes';

export type { LibraryEntry };

const LIBRARY_KEY = 'kurupira-symbol-library';

/** Converte uma entrada da API para o formato interno LibraryEntry */
export function apiEntryToLocal(e: {
  id: string; name: string; symId: string; vbW: number; vbH: number;
  elements: unknown; createdAt: string;
}): LibraryEntry {
  return {
    id:       e.id,
    name:     e.name,
    symId:    e.symId,
    vbW:      e.vbW,
    vbH:      e.vbH,
    elements: (e.elements as SymElem[]) ?? [],
    savedAt:  new Date(e.createdAt).getTime(),
  };
}

export function useRemoteLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? '[]'); }
    catch { return []; }
  });
  const entriesRef = useRef<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
  }, [entries]);

  const commitEntries = useCallback((updater: (prev: LibraryEntry[]) => LibraryEntry[]) => {
    setEntries(prev => {
      const next = updater(prev);
      entriesRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    KurupiraClient.symbolCatalog.list()
      .then(apiEntries => {
        if (cancelled) return;
        setError(null);
        const fromApi = apiEntries.map(apiEntryToLocal);
        const apiIds  = new Set(fromApi.map(e => e.id));
        commitEntries(prev => {
          const localOnly = prev.filter(e => !apiIds.has(e.id));
          return [...fromApi, ...localOnly];
        });
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[SymbolEditor] Falha ao carregar biblioteca remota — usando cache local:', err.message);
        setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commitEntries]);

  const save = useCallback(async (
    entry: Omit<LibraryEntry, 'id' | 'savedAt'>,
  ): Promise<'remote' | 'local'> => {
    try {
      const created = await KurupiraClient.symbolCatalog.create({
        name:     entry.name,
        symId:    entry.symId,
        vbW:      entry.vbW,
        vbH:      entry.vbH,
        elements: entry.elements as unknown[],
      });
      commitEntries(prev => [...prev, apiEntryToLocal(created)]);
      return 'remote';
    } catch (err: unknown) {
      const fallback: LibraryEntry = {
        ...entry,
        id:      `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        savedAt: Date.now(),
      };
      console.warn('[SymbolEditor] Salvou apenas localmente (API indisponível):', (err as Error).message);
      commitEntries(prev => [...prev, fallback]);
      return 'local';
    }
  }, [commitEntries]);

  const remove = useCallback(async (id: string): Promise<void> => {
    const snapshot = entriesRef.current.find(e => e.id === id);
    commitEntries(prev => prev.filter(e => e.id !== id));
    const isLocalOnly = id.startsWith('local-') || id.startsWith('lib-');
    if (!isLocalOnly) {
      try {
        await KurupiraClient.symbolCatalog.remove(id);
      } catch (err) {
        console.warn('[SymbolEditor] Falha ao remover entrada remota — revertendo:', (err as Error).message);
        if (snapshot) {
          commitEntries(prev =>
            [...prev, snapshot].sort((a, b) => b.savedAt - a.savedAt),
          );
        }
      }
    }
  }, [commitEntries]);

  return { entries, loading, error, save, remove };
}
