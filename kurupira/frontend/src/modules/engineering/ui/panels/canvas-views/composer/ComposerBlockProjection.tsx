/**
 * =============================================================================
 * COMPOSER BLOCK — Projeção (LeftOutliner)
 * =============================================================================
 * Spec: spec-block-projection-2026-04-21.md
 * Posição: último bloco da pilha, após Inversor
 * Acento: Teal
 * Gate: isConsumptionValid && isModulesValid && isArrangementValid
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../../store/useTechStore';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export const ComposerBlockProjection: React.FC = () => {
  // ── Store ──────────────────────────────────────────────────────────────────
  const focusedBlock    = useUIStore((s) => s.activeFocusedBlock);
  const setFocusedBlock = useUIStore((s) => s.setFocusedBlock);

  const hsp            = useSolarStore((s) => s.clientData.monthlyIrradiation || Array(12).fill(0));
  const averageConsumption = useSolarStore((s) => s.clientData.averageConsumption || 0);
  const modules        = useSolarStore(selectModules);
  const placedModules  = useSolarStore((s) => s.project.placedModules);

  const techStrings             = useTechStore((s) => s.strings.entities);
  const getPerformanceRatio     = useTechStore((s) => s.getPerformanceRatio);
  const getAdditivePerformanceRatio = useTechStore((s) => s.getAdditivePerformanceRatio);
  const prCalculationMode       = useTechStore((s) => s.prCalculationMode);

  // ── Derived: PR ─────────────────────────────────────────────────────────────
  const prDecimal = prCalculationMode === 'additive'
    ? getAdditivePerformanceRatio()
    : getPerformanceRatio();

  // ── Derived: Potência Conectada (motor híbrido) ─────────────────────────────
  const modulesById = useMemo(() => {
    const map: Record<string, any> = {};
    modules.forEach((m) => { map[m.id] = m; });
    return map;
  }, [modules]);

  const totalPowerKw = useMemo(() => {
    let totalW = 0;
    const handled = new Set<string>();

    Object.values(techStrings).forEach((str) => {
      str.moduleIds.forEach((mid) => {
        const pm = placedModules.find((p) => p.id === mid);
        if (pm) {
          const spec = modulesById[pm.moduleSpecId];
          if (spec) { totalW += spec.power; handled.add(pm.id); }
        } else if (modulesById[mid]) {
          totalW += modulesById[mid].power;
        }
      });
    });

    placedModules.forEach((pm) => {
      if (pm.stringData && !handled.has(pm.id)) {
        const spec = modulesById[pm.moduleSpecId];
        if (spec) { totalW += spec.power; handled.add(pm.id); }
      }
    });

    if (totalW === 0 && placedModules.length > 0) {
      placedModules.forEach((pm) => {
        const spec = modulesById[pm.moduleSpecId];
        if (spec) totalW += spec.power;
      });
    }

    if (totalW === 0) {
      totalW = modules.reduce((acc, m) => acc + m.power, 0);
    }

    return totalW / 1000;
  }, [techStrings, placedModules, modulesById, modules]);

  // ── Derived: Geração Anual e Cobertura ─────────────────────────────────────
  const annualGeneration = useMemo(() => {
    if (totalPowerKw <= 0) return 0;
    return hsp.reduce((acc: number, hspVal: number, i: number) => {
      return acc + totalPowerKw * (hspVal || 0) * DAYS_IN_MONTH[i] * prDecimal;
    }, 0);
  }, [totalPowerKw, hsp, prDecimal]);

  const coverage = useMemo(() => {
    const annualConsumption = averageConsumption * 12;
    if (annualConsumption <= 0) return 0;
    return (annualGeneration / annualConsumption) * 100;
  }, [annualGeneration, averageConsumption]);

  // ── Estados visuais ─────────────────────────────────────────────────────────
  const isFocused = focusedBlock === 'projection';

  // ── Dados disponíveis? ──────────────────────────────────────────────────────
  const hasData = annualGeneration > 0;

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div
      onClick={() => setFocusedBlock('projection')}
      className={cn(
        'relative rounded-none border flex flex-col transition-all duration-300 cursor-pointer overflow-hidden shrink-0',
        isFocused
          ? 'border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
          : 'border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/15 to-transparent h-10 shrink-0">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner shrink-0">
          <TrendingUp size={11} />
        </div>
        <span className="text-[11px] font-black text-slate-100 uppercase tracking-widest leading-none truncate flex-1">
          Projeção
        </span>
      </div>

      {/* Summary Bar (Semi-Resumido) */}
      {!isFocused && hasData && (
        <div className="px-4 py-1.5 flex items-center gap-2 bg-teal-950/40 border-b border-teal-500/10 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                <span className={cn(
                    "text-[11px] font-black tracking-tighter",
                    coverage >= 100 ? "text-emerald-400" : "text-sky-400"
                )}>
                    {Math.round(coverage)}%
                </span>
            </div>
            <div className="flex items-baseline gap-1 px-1.5 py-0.5 rounded-[4px] bg-slate-900/80 border border-slate-700/30">
                <span className="text-[11px] font-black text-amber-400 tracking-tighter">
                    {(annualGeneration / 1000).toFixed(1)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MWh/a</span>
            </div>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
        </div>
      )}

      <div className={cn(
        "flex flex-col transition-all duration-300",
        isFocused ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none"
      )}>

        {/* ── Display de Instrumento ─────────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-800/60 bg-black/40 border-b border-teal-500/10 backdrop-blur-md">
          {/* Geração Estimada */}
          <div className="p-4 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] text-teal-400 font-black uppercase tracking-widest leading-none">Produção Anual</span>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-xl font-black text-amber-400 font-mono tabular-nums tracking-tighter leading-none">
                {hasData ? Math.round(annualGeneration).toLocaleString('pt-BR') : '—'}
              </span>
              {hasData && (
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">kWh/a</span>
              )}
            </div>
          </div>

          {/* Cobertura */}
          <div className="p-4 flex flex-col gap-1 items-end text-right min-w-[100px]">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Cobertura</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                'text-xl font-black font-mono tabular-nums tracking-tighter leading-none',
                !hasData ? 'text-slate-700' : coverage >= 100 ? 'text-emerald-400' : 'text-sky-400'
              )}>
                {hasData ? Math.round(coverage) : '—'}
              </span>
              {hasData && (
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">%</span>
              )}
            </div>
          </div>
        </div>

      {/* ── Rodapé de Premissas ────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center gap-2 bg-slate-950/40">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
          PR: {(prDecimal * 100).toFixed(1)}%
        </span>
        <span className="text-[11px] text-slate-700">·</span>
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
          {totalPowerKw > 0 ? `${totalPowerKw.toFixed(2)} kWp` : 'Sem módulos'}
        </span>
      </div>
    </div>
  </div>
);
};
