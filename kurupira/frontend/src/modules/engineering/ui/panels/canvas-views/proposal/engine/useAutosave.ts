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

  // Autosave every 30s when dirty
  useEffect(() => {
    if (!activeLayout || !isDirty) return;
    const timer = setInterval(() => saveVersion(activeLayout, false), AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeLayout, isDirty, saveVersion]);

  return { saveVersion, loadVersions, onRestoreVersion };
}
