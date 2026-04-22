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
  const isDeemphasized = focusedBlock !== null && focusedBlock !== 'proposal';

  return (
    <div
      onClick={() => setFocusedBlock('proposal')}
      className={cn(
        'relative rounded-none border-x border-b flex flex-col transition-all duration-300 cursor-pointer overflow-visible -mt-px',
        isFocused
          ? 'border-indigo-500 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50'
          : isDeemphasized
          ? 'border-indigo-900/30 bg-indigo-950/40 opacity-40 select-none'
          : 'border-indigo-600/40 bg-indigo-950/70 hover:border-indigo-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-indigo-500/10 bg-gradient-to-r from-indigo-900/15 to-transparent">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <FileText size={11} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider leading-none">
            Proposta
          </span>
          <span className="text-[7px] text-indigo-600 font-bold uppercase tracking-tight mt-0.5 opacity-70">
            Documento de Venda
          </span>
        </div>
      </div>

      {/* ── Display de Status Comercial ─────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md">
        {/* Status de Aprovação */}
        <div className="flex flex-col">
          <span className="text-[7px] text-indigo-500/80 font-bold uppercase tracking-[0.15em] mb-1">
            Status
          </span>
          <div className="flex items-center gap-1.5">
            {isApproved ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                  Aprovado
                </span>
              </>
            ) : (
              <>
                <Clock size={12} className="text-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                  Pendente
                </span>
              </>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-indigo-900/40 to-transparent" />

        {/* Validade */}
        <div className="flex flex-col items-end">
          <span className="text-[7px] text-indigo-500/80 font-bold uppercase tracking-[0.15em] mb-1">
            Validade
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-indigo-400 font-mono tabular-nums tracking-tighter leading-none">
              {proposalData.validityDays}
            </span>
            <span className="text-[9px] font-bold text-indigo-600/80 uppercase">dias</span>
          </div>
        </div>
      </div>

      {/* ── Rodapé ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center gap-2 border-t border-indigo-900/20 bg-slate-950/40">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
          Garantia: {proposalData.warrantyYears} anos
        </span>
        <span className="text-[8px] text-slate-700">·</span>
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          Template: Neonorte A4
        </span>
      </div>
    </div>
  );
};
