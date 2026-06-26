/**
 * TopologyEditor.tsx — Orchestrates BlockDiagramCanvas ↔ UnifileCanvas.
 *
 * Flow:
 *   1. User builds block diagram (BlockDiagramCanvas).
 *   2. Clicks "Gerar Unifilar" → generateUnifilar() clones + enriches the config.
 *   3. UnifileCanvas opens with the generated topology; user can edit freely.
 *   4. "Regenerar" re-applies generateUnifilar() from the current block config
 *      (overwrites unifilar edits — user is warned via inline modal).
 *   5. "← Diagrama de Blocos" switches back; block config is preserved.
 *
 * Both configs are lifted to the parent via onBlockChange / onUnifileChange.
 */

import { useState, useCallback, useMemo } from 'react';
import { Zap, AlertTriangle, X } from 'lucide-react';

import BlockDiagramCanvas from './BlockDiagramCanvas';
import UnifileCanvas       from './UnifileCanvas';
import { generateUnifilar }  from './generateUnifilar';
import { validateTopology } from '@/lib/types/topology';
import type { TopologyConfig } from '@/lib/types/topology';

// ─── View state ───────────────────────────────────────────────────────────────

type View = 'block' | 'unfile';

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel:  () => void;
}

function RegenerateConfirmModal({ onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col gap-4 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 flex items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
              Regenerar Unifilar
            </span>
          </div>
          <button onClick={onCancel} className="text-slate-600 hover:text-slate-400 transition-colors mt-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Regenerar irá <span className="text-amber-400 font-bold">sobrescrever todas as edições manuais</span> feitas
          no diagrama unifilar. Esta ação não pode ser desfeita.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded border border-slate-700 text-[10px] font-black text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded bg-amber-600 text-[10px] font-black text-white hover:bg-amber-500 transition-colors uppercase tracking-widest flex items-center gap-1.5"
          >
            <Zap className="h-3 w-3" />
            Regenerar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TopologyEditorProps {
  /** Initial / controlled block diagram config */
  blockConfig?:    TopologyConfig | null;
  /** Initial / controlled unifilar config */
  unifileConfig?:  TopologyConfig | null;
  /** Called whenever the block diagram changes */
  onBlockChange?:  (c: TopologyConfig) => void;
  /** Called whenever the unifilar changes */
  onUnifileChange?: (c: TopologyConfig) => void;
  /** Initial view; defaults to 'block' */
  initialView?:    View;
  /** Read-only mode for both canvases */
  readOnly?:       boolean;
  className?:      string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopologyEditor({
  blockConfig:   blockProp   = null,
  unifileConfig: unifileProp = null,
  onBlockChange,
  onUnifileChange,
  initialView = 'block',
  readOnly    = false,
  className   = '',
}: TopologyEditorProps) {
  const [view,          setView]          = useState<View>(initialView);
  const [blockConfig,   setBlockConfig]   = useState<TopologyConfig | null>(blockProp);
  const [unifileConfig, setUnifileConfig] = useState<TopologyConfig | null>(unifileProp);
  const [confirmOpen,   setConfirmOpen]   = useState(false);

  // ── Block diagram changes ─────────────────────────────────────────────
  const handleBlockChange = useCallback((c: TopologyConfig) => {
    setBlockConfig(c);
    onBlockChange?.(c);
  }, [onBlockChange]);

  // ── Unifilar changes ──────────────────────────────────────────────────
  const handleUnifileChange = useCallback((c: TopologyConfig) => {
    setUnifileConfig(c);
    onUnifileChange?.(c);
  }, [onUnifileChange]);

  // ── Generate unifilar from block diagram ──────────────────────────────
  const handleGenerate = useCallback(() => {
    if (!blockConfig || blockConfig.nodes.length === 0) return;
    const generated = generateUnifilar(blockConfig);
    setUnifileConfig(generated);
    onUnifileChange?.(generated);
    setView('unfile');
  }, [blockConfig, onUnifileChange]);

  // ── Regenerate — show confirm modal if unifilar has content ──────────
  const handleRegenerate = useCallback(() => {
    if (!blockConfig || blockConfig.nodes.length === 0) return;
    if (unifileConfig && unifileConfig.nodes.length > 0) {
      setConfirmOpen(true);
    } else {
      const generated = generateUnifilar(blockConfig);
      setUnifileConfig(generated);
      onUnifileChange?.(generated);
    }
  }, [blockConfig, unifileConfig, onUnifileChange]);

  const confirmRegenerate = useCallback(() => {
    setConfirmOpen(false);
    if (!blockConfig) return;
    const generated = generateUnifilar(blockConfig);
    setUnifileConfig(generated);
    onUnifileChange?.(generated);
  }, [blockConfig, onUnifileChange]);

  // ── Validation status (derived — no extra state) ──────────────────────
  const blockIssues   = useMemo(() => blockConfig   ? validateTopology(blockConfig)   : [], [blockConfig]);
  const unifileIssues = useMemo(() => unifileConfig ? validateTopology(unifileConfig) : [], [unifileConfig]);

  const blockErrors   = blockIssues.filter(i => i.severity === 'error').length;
  const blockWarnings = blockIssues.filter(i => i.severity === 'warning').length;
  const unifileErrors   = unifileIssues.filter(i => i.severity === 'error').length;
  const unifileWarnings = unifileIssues.filter(i => i.severity === 'warning').length;

  // ── Render ────────────────────────────────────────────────────────────
  const hasBlock   = (blockConfig?.nodes.length ?? 0) > 0;
  const hasUnifile = (unifileConfig?.nodes.length ?? 0) > 0;

  return (
    <div className={`relative flex h-full w-full flex-col ${className}`}>
      {/* ── Confirm modal (portal-free, positioned over canvas) ─── */}
      {confirmOpen && (
        <RegenerateConfirmModal
          onConfirm={confirmRegenerate}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {/* ── Header tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-slate-800 bg-slate-950 flex-shrink-0">
        <button
          onClick={() => setView('block')}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
            view === 'block'
              ? 'border-sky-500 text-sky-400 bg-sky-950/20'
              : 'border-transparent text-slate-600 hover:text-slate-400'
          }`}
        >
          Diagrama de Blocos
          {hasBlock && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-sky-900/40 text-sky-500 font-black">
              {blockConfig!.nodes.length}
            </span>
          )}
          {blockErrors > 0 && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-red-900/50 text-red-400 font-black" title={`${blockErrors} erro(s)`}>
              {blockErrors}✕
            </span>
          )}
          {blockErrors === 0 && blockWarnings > 0 && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-amber-900/50 text-amber-400 font-black" title={`${blockWarnings} aviso(s)`}>
              {blockWarnings}⚠
            </span>
          )}
        </button>

        <button
          onClick={() => hasUnifile ? setView('unfile') : handleGenerate()}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
            view === 'unfile'
              ? 'border-violet-500 text-violet-400 bg-violet-950/20'
              : hasBlock
                ? 'border-transparent text-slate-600 hover:text-slate-400'
                : 'border-transparent text-slate-800 cursor-not-allowed'
          }`}
          disabled={!hasBlock && !hasUnifile}
          title={!hasBlock ? 'Construa o diagrama de blocos primeiro' : undefined}
        >
          Unifilar
          {hasUnifile && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-violet-900/40 text-violet-500 font-black">
              {unifileConfig!.nodes.length}
            </span>
          )}
          {!hasUnifile && hasBlock && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-slate-800 text-slate-600 font-black flex items-center gap-0.5">
              <Zap className="h-2 w-2" />Gerar
            </span>
          )}
          {unifileErrors > 0 && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-red-900/50 text-red-400 font-black" title={`${unifileErrors} erro(s)`}>
              {unifileErrors}✕
            </span>
          )}
          {unifileErrors === 0 && unifileWarnings > 0 && (
            <span className="text-[7px] px-1 py-0.5 rounded bg-amber-900/50 text-amber-400 font-black" title={`${unifileWarnings} aviso(s)`}>
              {unifileWarnings}⚠
            </span>
          )}
        </button>

        {/* Spacer + generate button (block view only, shortcut) */}
        <div className="flex-1" />
        {view === 'block' && hasBlock && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 mr-3 px-3 py-1.5 rounded-sm border border-violet-700/50 bg-violet-950/40 text-[9px] font-bold text-violet-400 hover:text-violet-200 hover:border-violet-500/50 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Gerar Unifilar
          </button>
        )}
      </div>

      {/* ── Canvas area ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {view === 'block' ? (
          <BlockDiagramCanvas
            config={blockConfig}
            onChange={handleBlockChange}
            readOnly={readOnly}
            className="h-full rounded-none border-none"
          />
        ) : (
          <UnifileCanvas
            config={unifileConfig}
            onChange={handleUnifileChange}
            onBack={() => setView('block')}
            onRegenerate={handleRegenerate}
            readOnly={readOnly}
            className="h-full rounded-none border-none"
          />
        )}
      </div>
    </div>
  );
}
