/**
 * =============================================================================
 * COMPOSER BLOCK — Proposta (LeftOutliner)
 * =============================================================================
 * Spec: spec-view-proposal-2026-04-20.md
 * Posição: Etapa final da jornada do integrador
 * Acento: Indigo
 * Gate: variantStatus === 'APPROVED'
 * =============================================================================
 */

import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

export const ComposerBlockProposal: React.FC = () => {
  const focusedBlock    = useUIStore((s) => s.activeFocusedBlock);
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);
  
  // Status de aprovação (Gate para liberação da proposta)
  const projectStatus = useSolarStore((s) => s.project.projectStatus);
  const proposalData  = useSolarStore((s) => s.proposalData);
  
  const isApproved = projectStatus === 'approved';
  const isFocused = focusedBlock === 'proposal';

  return (
    <div
      onClick={() => setFocusedBlock('proposal')}
      className={cn(
        'relative rounded-none border flex flex-col transition-all duration-300 cursor-pointer overflow-hidden shrink-0',
        isFocused
          ? 'border-indigo-500 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50'
          : 'border-indigo-600/40 bg-indigo-950/70 hover:border-indigo-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-violet-500/10 bg-gradient-to-r from-violet-900/15 to-transparent h-10 shrink-0">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-inner shrink-0">
          <FileText size={11} />
        </div>
        <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
          Proposta Comercial
        </span>
      </div>

      {/* Summary Bar (Semi-Resumido) */}
      {!isFocused && (
        <div className="px-4 py-1.5 flex items-center gap-2 bg-indigo-950/40 border-b border-indigo-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                <span className={cn(
                    "text-[11px] font-black uppercase tracking-tighter",
                    isApproved ? "text-emerald-400" : "text-amber-400"
                )}>
                    {isApproved ? 'Pronta' : 'Pend.'}
                </span>
            </div>
            <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                <span className="text-[11px] font-black text-indigo-400 tracking-tighter">
                    {proposalData?.validityDays ?? 15}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">d</span>
            </div>
            <div className={cn("ml-auto w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]", isApproved ? "bg-emerald-400" : "bg-amber-400")} />
        </div>
      )}

      <div className={cn(
        "flex flex-col transition-all duration-300",
        isFocused ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none"
      )}>

        {/* ── Display de Status Comercial ─────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-800/60 bg-black/40 border-b border-violet-500/10 backdrop-blur-md">
          {/* Status de Aprovação */}
          <div className="p-4 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest leading-none">Comercial Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              {isApproved ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest truncate">
                    Aprovado
                  </span>
                </>
              ) : (
                <>
                  <Clock size={12} className="text-amber-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest truncate">
                    Pendente
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Validade */}
          <div className="p-4 flex flex-col gap-1 items-end text-right min-w-[100px]">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Validade</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-400 font-mono tabular-nums tracking-tighter leading-none">
                {proposalData?.validityDays ?? 15}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">dias</span>
            </div>
          </div>
        </div>

      {/* ── Rodapé ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center gap-2 bg-slate-950/40">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
          {proposalData?.lineItems?.length ?? 0} itens
        </span>
        <span className="text-[11px] text-slate-700">·</span>
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
          5 Páginas · A4
        </span>
      </div>
    </div>
  </div>
);
};
