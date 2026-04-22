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
  const isDeemphasized = focusedBlock !== null && focusedBlock !== 'projection';

  // ── Dados disponíveis? ──────────────────────────────────────────────────────
  const hasData = annualGeneration > 0;

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div
      onClick={() => setFocusedBlock('projection')}
      className={cn(
        'relative rounded-none border-x border-b flex flex-col transition-all duration-300 cursor-pointer overflow-visible -mt-px',
        isFocused
          ? 'border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
          : isDeemphasized
          ? 'border-amber-900/30 bg-amber-950/40 opacity-40 select-none'
          : 'border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/15 to-transparent">
        <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
          <TrendingUp size={11} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">
            Projeção
          </span>
          {hasData && (
            <span className="text-[7px] text-amber-600 font-bold uppercase tracking-tight mt-0.5 opacity-70">
              Est. {Math.round(annualGeneration).toLocaleString('pt-BR')} kWh/ano
            </span>
          )}
        </div>
      </div>

      {/* ── Display de Instrumento ─────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md">
        {/* Geração Estimada */}
        <div className="flex flex-col">
          <span className="text-[7px] text-amber-500/80 font-bold uppercase tracking-[0.15em] mb-1">
            Geração Est.
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-amber-400 font-mono tabular-nums tracking-tighter leading-none">
              {hasData ? Math.round(annualGeneration).toLocaleString('pt-BR') : '—'}
            </span>
            {hasData && (
              <span className="text-[9px] font-bold text-amber-600/80 uppercase">kWh</span>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-900/40 to-transparent" />

        {/* Cobertura */}
        <div className="flex flex-col items-end">
          <span className="text-[7px] text-sky-500/80 font-bold uppercase tracking-[0.15em] mb-1">
            Cobertura
          </span>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              'text-lg font-black font-mono tabular-nums tracking-tighter leading-none',
              !hasData ? 'text-slate-700' : coverage >= 100 ? 'text-emerald-400' : 'text-sky-400'
            )}>
              {hasData ? Math.round(coverage) : '—'}
            </span>
            {hasData && (
              <span className="text-[9px] font-bold text-sky-600/80 uppercase">%</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Rodapé de Premissas ────────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center gap-2 border-t border-amber-900/20 bg-slate-950/40">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
          PR: {(prDecimal * 100).toFixed(1)}%
        </span>
        <span className="text-[8px] text-slate-700">·</span>
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
          {totalPowerKw > 0 ? `${totalPowerKw.toFixed(2)} kWp` : 'Sem módulos'}
        </span>
      </div>
    </div>
  );
};
