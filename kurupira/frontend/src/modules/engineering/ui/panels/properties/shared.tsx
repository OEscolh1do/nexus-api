/**
 * =============================================================================
 * SHARED UI PRIMITIVES — Componentes reutilizáveis do Inspector/Drawer
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// SECTION HEADER
// =============================================================================

export const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-slate-600">{icon}</span>
    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
  </div>
);

// =============================================================================
// PROP ROW (Read-Only)
// =============================================================================

export const PropRow: React.FC<{ label: string; value: string; accent?: boolean; danger?: boolean }> = ({ label, value, accent, danger }) => (
  <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/50">
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className={cn(
        "text-[10px] font-bold",
        danger ? "text-red-400" : accent ? "text-emerald-400" : "text-slate-300"
    )}>{value}</span>
  </div>
);

// =============================================================================
// PROP ROW EDITABLE (P0-4 — edição inline)
// =============================================================================

export const PropRowEditable: React.FC<{
  label: string;
  value: string;
  onCommit: (value: string) => boolean | void;
  type?: 'text' | 'number';
}> = ({ label, value, onCommit, type = 'text' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleStartEdit = () => {
    setDraft(value);
    setHasError(false);
    setEditing(true);
  };

  const handleCommit = () => {
    if (draft !== value) {
      const accepted = onCommit(draft);
      if (accepted === false) {
        setHasError(true);
        setTimeout(() => {
          setHasError(false);
          setDraft(value);
          setEditing(false);
        }, 800);
        return;
      }
    }
    setEditing(false);
    setHasError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommit();
    if (e.key === 'Escape') {
      setDraft(value);
      setHasError(false);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/50">
      <span className="text-[10px] text-slate-500">{label}</span>
      {editing ? (
        <input
          type={type}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setHasError(false);
          }}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          autoFocus
           className={cn(
             "w-16 text-right text-[10px] font-bold rounded px-1 py-0.5 outline-none transition-colors",
             hasError 
               ? "bg-red-500/20 text-red-500 border border-red-500 animate-pulse" 
               : "text-emerald-400 bg-slate-800 border border-emerald-500/30 focus:border-emerald-500/60"
           )}
        />
      ) : (
        <button
          onClick={handleStartEdit}
          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-text transition-colors"
          title="Clique para editar"
        >
          {value}
        </button>
      )}
    </div>
  );
};
