import { useCallback, useEffect, useRef } from 'react';
import type { ProposalTemplate } from './types';

export interface AutosaveVersion {
  id: string;
  savedAt: string;   // ISO
  label: string;     // "Autosalvo às 14:32" or manual "Versão manual"
  layout: ProposalTemplate;
  isManual: boolean;
}

const STORAGE_KEY = 'kurupira-proposal-versions';
const MAX_AUTO_VERSIONS = 10;
const MAX_MANUAL_VERSIONS = 20;
const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds

export function loadVersions(): AutosaveVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AutosaveVersion[]) : [];
  } catch {
    return [];
  }
}

function saveVersions(versions: AutosaveVersion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  } catch {
    // localStorage full — drop oldest auto version and retry once
    const trimmed = versions.filter((v, i) => v.isManual || i > 0);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  }
}

export function useAutosave(
  activeLayout: ProposalTemplate | null,
  isDirty: boolean,
  onRestoreVersion: (layout: ProposalTemplate) => void,
) {
  const lastSavedLayoutRef = useRef<string>('');
  // Shadow activeLayout in a ref so the autosave interval callback always reads the
  // current layout without needing activeLayout in the dep array. Without this,
  // activeLayout (a Zustand value) gets a new object reference on every drag-frame
  // store update, causing the 30-second interval to clear and restart continuously
  // during drag strokes — effectively suppressing autosave while the user is dragging.
  const activeLayoutRef = useRef(activeLayout);
  activeLayoutRef.current = activeLayout;

  const saveVersion = useCallback((layout: ProposalTemplate, isManual = false) => {
    const serialized = JSON.stringify(layout);
    if (!isManual && serialized === lastSavedLayoutRef.current) return; // nothing changed
    lastSavedLayoutRef.current = serialized;

    const version: AutosaveVersion = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      label: isManual
        ? `Salvo manualmente às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : `Autosalvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      layout,
      isManual,
    };

    const existing = loadVersions();
    const autoVersions = existing.filter((v) => !v.isManual);
    const manualVersions = existing.filter((v) => v.isManual);

    let next: AutosaveVersion[];
    if (isManual) {
      next = [...manualVersions.slice(-(MAX_MANUAL_VERSIONS - 1)), version,
              ...autoVersions.slice(-MAX_AUTO_VERSIONS)];
    } else {
      next = [...manualVersions.slice(-MAX_MANUAL_VERSIONS),
              ...autoVersions.slice(-(MAX_AUTO_VERSIONS - 1)), version];
    }
    // Sort by savedAt descending
    next.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    saveVersions(next);
  }, []);

  // Autosave every 30s when dirty.
  // activeLayout is intentionally omitted from the dep array — it is read at fire time
  // via activeLayoutRef.current. Including it would reset the interval on every
  // drag-frame Zustand update, preventing the 30-second timer from ever expiring.
  useEffect(() => {
    if (!isDirty) return;
    const timer = setInterval(() => {
      const layout = activeLayoutRef.current;
      if (!layout) return;
      saveVersion(layout, false);
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isDirty, saveVersion]);

  return { saveVersion, loadVersions, onRestoreVersion };
}
