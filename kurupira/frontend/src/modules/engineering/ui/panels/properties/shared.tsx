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
  <div className="flex items-center gap-1.5 py-1 mb-1 border-b border-slate-800/40">
    <span className="text-slate-600 scale-90">{icon}</span>
    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{label}</h4>
  </div>
);

// =============================================================================
// PROP ROW (Read-Only)
// =============================================================================

export const PropRow: React.FC<{ 
  label: string; 
  value: string | number; 
  accent?: boolean; 
  danger?: boolean;
  mono?: boolean;
}> = ({ label, value, accent, danger, mono = true }) => (
  <div className="flex items-center justify-between px-2 py-0.5 rounded-sm hover:bg-slate-800/30 transition-colors group">
    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">{label}</span>
    <span className={cn(
        "text-[10px] font-bold tabular-nums",
        mono && "font-mono tracking-tighter",
        danger ? "text-red-400" : accent ? "text-indigo-400" : "text-slate-300"
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
  unit?: string;
}> = ({ label, value, onCommit, type = 'text', unit }) => {
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
    <div className="flex items-center justify-between px-2 py-0.5 rounded-sm hover:bg-slate-800/30 transition-colors group">
      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
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
              "w-16 text-right text-[10px] font-bold font-mono rounded-none px-1 py-0 outline-none transition-colors",
              hasError 
                ? "bg-red-500/20 text-red-500 border-b border-red-500" 
                : "text-indigo-400 bg-slate-900 border-b border-indigo-500/50 focus:border-indigo-500"
            )}
          />
          {unit && <span className="text-[8px] text-slate-600 font-bold uppercase">{unit}</span>}
        </div>
      ) : (
        <button
          onClick={handleStartEdit}
          className="flex items-baseline gap-1 text-[10px] font-bold font-mono text-indigo-400 hover:text-indigo-300 transition-colors tabular-nums tracking-tighter"
          title="Clique para editar"
        >
          {value}
          {unit && <span className="text-[8px] text-slate-600 font-bold uppercase no-underline">{unit}</span>}
        </button>
      )}
    </div>
  );
};
