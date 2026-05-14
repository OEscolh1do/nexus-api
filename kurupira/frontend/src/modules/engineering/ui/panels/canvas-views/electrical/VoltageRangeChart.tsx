/**
 * VoltageRangeChart v2 — Mapa de Tensão Térmica Multi-MPPT
 * =========================================================
 * Redesign S1+S2+S3:
 *   S1 — Eixo X com ticks de tensão e rótulos permanentes por MPPT
 *   S2 — Barra em 3 segmentos semânticos (Risco Calor / Janela Op / Zona Voc)
 *   S3 — Badge de diagnóstico inline (NOMINAL / RISCO / VIOLAÇÃO)
 *
 * Norma: NBR 16690:2019, §4.3.1.2
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface MpptThermalProfile {
  mpptId: string | number;
  vocMax: number;     // Voc corrigido pelo frio (Tmin) — teto térmico
  vmpMin: number;     // Vmp @ frio — referência fria (mais alta)
  vmpMax: number;     // Vmp @ frio — extremo frio (reservado para uso futuro)
  vmpCalor?: number;  // Vmp @ Tmax — piso térmico (mais baixa)
}

interface VoltageRangeChartProps {
  mpptProfiles: MpptThermalProfile[];
  limitInversorVMax: number;
  limitMpptVMin: number;
  limitMpptVMax: number;
  limitVStart?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS POR MPPT
// ─────────────────────────────────────────────────────────────────────────────

type MpptStatus = 'unconfigured' | 'nominal' | 'warn_hot' | 'warn_voc' | 'error_voc';

function getMpptStatus(
  p: MpptThermalProfile,
  limitVMax: number,
  limitMpptVMin: number,
): MpptStatus {
  if (p.vmpMin === 0 && p.vocMax === 0) return 'unconfigured';
  if (p.vocMax > limitVMax)             return 'error_voc';
  if (p.vocMax > limitVMax * 0.95)      return 'warn_voc';
  if (p.vmpCalor != null && p.vmpCalor > 0 && p.vmpCalor < limitMpptVMin) return 'warn_hot';
  return 'nominal';
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB: Badge de Diagnóstico (S3)
// ─────────────────────────────────────────────────────────────────────────────

const DiagnosisBadge: React.FC<{ status: MpptStatus }> = ({ status }) => {
  const config = {
    nominal:      { icon: CheckCircle,   label: 'Nominal',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    warn_hot:     { icon: AlertTriangle, label: 'Risco Calor',  cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20'   },
    warn_voc:     { icon: AlertTriangle, label: 'Voc Limite',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20'   },
    error_voc:    { icon: XCircle,       label: 'Voc Violação', cls: 'text-rose-400    bg-rose-500/10    border-rose-500/20'    },
    unconfigured: { icon: MinusCircle,   label: 'Sem Config',   cls: 'text-slate-600   bg-slate-800      border-slate-700'      },
  }[status];

  const Icon = config.icon;
  return (
    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-wider shrink-0', config.cls)}>
      <Icon size={8} />
      {config.label}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: Ticks de Eixo (S1)
// ─────────────────────────────────────────────────────────────────────────────

const AxisTicks: React.FC<{ maxAxis: number; getPercent: (v: number) => string }> = ({ maxAxis, getPercent }) => {
  // Gera 5–7 ticks em valores "bonitos"
  const step = maxAxis <= 400 ? 50 : maxAxis <= 800 ? 100 : 200;
  const ticks: number[] = [];
  for (let v = 0; v <= maxAxis; v += step) ticks.push(v);

  return (
    <div className="relative w-full h-5 mt-1">
      {ticks.map(v => (
        <div
          key={v}
          className="absolute flex flex-col items-center"
          style={{ left: getPercent(v), transform: 'translateX(-50%)' }}
        >
          <div className="w-px h-1.5 bg-slate-700" />
          <span className="text-[8px] font-mono text-slate-600 tabular-nums">{v}V</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: Barra MPPT com 3 Segmentos (S2)
// ─────────────────────────────────────────────────────────────────────────────

interface MpptBarProps {
  p: MpptThermalProfile;
  limitVMax: number;
  limitMpptVMin: number;
  getPercent: (v: number) => string;
}

const MpptBar: React.FC<MpptBarProps> = ({ p, limitVMax, limitMpptVMin, getPercent }) => {
  if (p.vmpMin === 0 && p.vocMax === 0) return null;

  const vmpHot  = p.vmpCalor ?? limitMpptVMin; // piso térmico
  const vmpCold = p.vmpMin;                     // referência fria
  const vocCold = p.vocMax;                     // teto frio

  // Segmento A — Risco Calor: vmpHot → limitMpptVMin
  const hasRiskZone = vmpHot < limitMpptVMin;
  const segA = hasRiskZone
    ? { left: getPercent(vmpHot), width: getPercent(limitMpptVMin - vmpHot) }
    : null;

  // Segmento B — Janela Operacional: max(vmpHot, limitMpptVMin) → vmpCold
  const segBStart = Math.max(vmpHot, limitMpptVMin);
  const segB = vmpCold > segBStart
    ? { left: getPercent(segBStart), width: getPercent(vmpCold - segBStart) }
    : null;

  // Segmento C — Zona Voc: vmpCold → vocCold
  const vocOverLimit = vocCold > limitVMax;
  const segC = vocCold > vmpCold
    ? { left: getPercent(vmpCold), width: getPercent(vocCold - vmpCold) }
    : null;

  return (
    <div className="relative h-5 w-full">
      {/* Linha de eixo central */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800 -translate-y-1/2" />

      {/* S2 — Segmento A: Risco Calor (rose) */}
      {segA && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-rose-500/25 border border-rose-500/50 rounded-l-sm flex items-center justify-center overflow-hidden"
          style={{ left: segA.left, width: segA.width }}
          title={`Risco Desligamento: Vmp(calor) ${vmpHot.toFixed(0)}V abaixo do mínimo MPPT (${limitMpptVMin}V)`}
        >
          <span className="text-[7px] text-rose-400 font-black uppercase tracking-wider truncate px-0.5 hidden sm:block">Risco</span>
        </div>
      )}

      {/* S2 — Segmento B: Janela Operacional (emerald) */}
      {segB && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center overflow-hidden"
          style={{ left: segB.left, width: segB.width }}
          title={`Janela Operacional: ${segBStart.toFixed(0)}V → ${vmpCold.toFixed(0)}V`}
        >
          <span className="text-[7px] text-emerald-500/80 font-black uppercase tracking-wider truncate px-0.5 hidden sm:block">Janela Op.</span>
        </div>
      )}

      {/* S2 — Segmento C: Zona Voc (sky/rose se violação) */}
      {segC && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 h-3.5 flex items-center justify-center overflow-hidden rounded-r-sm',
            vocOverLimit
              ? 'bg-rose-500/30 border border-rose-500/60'
              : 'bg-sky-500/15 border border-sky-500/30'
          )}
          style={{ left: segC.left, width: segC.width }}
          title={`Zona Voc: ${vmpCold.toFixed(0)}V → ${vocCold.toFixed(0)}V${vocOverLimit ? ' ⚠ EXCEDE LIMITE INVERSOR' : ''}`}
        >
          <span className={cn('text-[7px] font-black uppercase tracking-wider truncate px-0.5 hidden sm:block', vocOverLimit ? 'text-rose-400' : 'text-sky-400/80')}>
            Voc
          </span>
        </div>
      )}

      {/* S1 — Rótulos permanentes: Vmp(calor) e Voc(frio) */}
      {p.vmpCalor != null && p.vmpCalor > 0 && (
        <div
          className="absolute bottom-full mb-0.5 -translate-x-1/2 text-[8px] font-mono tabular-nums text-slate-500 whitespace-nowrap"
          style={{ left: getPercent(p.vmpCalor) }}
        >
          {p.vmpCalor.toFixed(0)}
        </div>
      )}
      <div
        className={cn(
          'absolute top-full mt-0.5 -translate-x-1/2 text-[8px] font-mono font-bold tabular-nums whitespace-nowrap',
          vocOverLimit ? 'text-rose-400' : 'text-sky-400'
        )}
        style={{ left: getPercent(vocCold) }}
      >
        {vocCold.toFixed(0)}V
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const VoltageRangeChart: React.FC<VoltageRangeChartProps> = ({
  mpptProfiles,
  limitInversorVMax,
  limitMpptVMin,
  limitMpptVMax,
  limitVStart,
}) => {
  const configured = mpptProfiles.filter(p => p.vmpMin > 0 || p.vocMax > 0);

  // Ordena por criticidade — violações sobem (S3, Tier A2)
  const sortWeight = (p: MpptThermalProfile): number => {
    const s = getMpptStatus(p, limitInversorVMax, limitMpptVMin);
    return { error_voc: 0, warn_voc: 1, warn_hot: 2, nominal: 3, unconfigured: 99 }[s];
  };
  const sorted = [...mpptProfiles].sort((a, b) => sortWeight(a) - sortWeight(b));

  const overallVocMax = configured.reduce((m, p) => Math.max(m, p.vocMax), 0);
  const maxAxis = Math.max(limitInversorVMax * 1.12, overallVocMax * 1.05, 200);
  const getPercent = (v: number) => `${Math.min(100, Math.max(0, (v / maxAxis) * 100))}%`;

  // KPIs globais
  const globalVocMax   = overallVocMax;
  const globalVmpCalor = configured.reduce((mn, p) => p.vmpCalor && p.vmpCalor > 0 ? (mn === 0 ? p.vmpCalor : Math.min(mn, p.vmpCalor)) : mn, 0);
  const vocUsagePct    = globalVocMax > 0 ? (globalVocMax / limitInversorVMax) * 100 : 0;
  const errCount       = configured.filter(p => getMpptStatus(p, limitInversorVMax, limitMpptVMin) === 'error_voc').length;
  const warnCount      = configured.filter(p => ['warn_hot','warn_voc'].includes(getMpptStatus(p, limitInversorVMax, limitMpptVMin))).length;

  const globalStatus: MpptStatus = errCount > 0 ? 'error_voc' : warnCount > 0 ? 'warn_voc' : configured.length > 0 ? 'nominal' : 'unconfigured';

  if (configured.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-slate-900/40 border border-slate-800 rounded-sm">
        <span className="text-[11px] text-slate-600 font-mono">Configure strings nos MPPTs para visualizar o mapa térmico</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-sm p-4">

      {/* ── KPI Row narrativo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800/40 border border-slate-800/60 rounded-sm overflow-hidden shrink-0">
        {/* Saúde Global */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Saúde Geral</span>
            <DiagnosisBadge status={globalStatus} />
          </div>
        </div>

        {/* Maior Voc — com barra de uso % */}
        <div className="flex flex-col justify-center gap-1 px-3 py-2 bg-slate-900/60">
          <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Voc Máx / Limite</span>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-[12px] font-mono font-black tabular-nums leading-none',
              vocUsagePct > 100 ? 'text-rose-400' : vocUsagePct > 95 ? 'text-amber-400' : 'text-sky-400'
            )}>
              {globalVocMax > 0 ? globalVocMax.toFixed(0) : '—'}
            </span>
            {globalVocMax > 0 && <span className="text-[8px] text-slate-600">/ {limitInversorVMax}V</span>}
          </div>
          {globalVocMax > 0 && (
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', vocUsagePct > 100 ? 'bg-rose-500' : vocUsagePct > 95 ? 'bg-amber-500' : 'bg-sky-500')}
                style={{ width: `${Math.min(100, vocUsagePct)}%` }}
              />
            </div>
          )}
        </div>

        {/* Menor Vmp(calor) */}
        <div className="flex flex-col justify-center gap-1 px-3 py-2 bg-slate-900/60">
          <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Vmp Calor / Mín MPPT</span>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-[12px] font-mono font-black tabular-nums leading-none',
              globalVmpCalor > 0 && globalVmpCalor < limitMpptVMin ? 'text-rose-400' : 'text-emerald-400'
            )}>
              {globalVmpCalor > 0 ? globalVmpCalor.toFixed(0) : '—'}
            </span>
            {globalVmpCalor > 0 && <span className="text-[8px] text-slate-600">/ {limitMpptVMin}V</span>}
          </div>
          {globalVmpCalor > 0 && (
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', globalVmpCalor < limitMpptVMin ? 'bg-rose-500' : 'bg-emerald-500')}
                style={{ width: `${Math.min(100, (globalVmpCalor / limitMpptVMax) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* MPPTs em risco */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-2 bg-slate-900/60">
          <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Alertas / MPPTs</span>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-[12px] font-mono font-black tabular-nums leading-none',
              errCount > 0 ? 'text-rose-400' : warnCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {errCount + warnCount}
            </span>
            <span className="text-[8px] text-slate-600">/ {configured.length} MPPTs</span>
          </div>
        </div>
      </div>

      {/* ── Canvas Principal ── */}
      <div className="flex flex-col gap-0">

        {/* Zona MPPT + limite inversor sobrepostos às barras */}
        <div className="relative w-full" style={{ paddingLeft: '28px', paddingRight: '110px' }}>

          {/* Referências de fundo (zona MPPT, Vstart, Max Inversor) */}
          <div className="relative w-full" style={{ height: `${sorted.length * 40 + 8}px` }}>

            {/* Zona MPPT Ok */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/5 border-x border-emerald-500/15 z-0"
              style={{ left: getPercent(limitMpptVMin), width: getPercent(limitMpptVMax - limitMpptVMin) }}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-emerald-600/60 uppercase tracking-widest whitespace-nowrap font-black">
                Faixa MPPT
              </span>
            </div>

            {/* Vstart */}
            {limitVStart && (
              <div
                className="absolute top-0 bottom-0 w-px border-l border-dashed border-amber-500/40 z-0"
                style={{ left: getPercent(limitVStart) }}
              >
                <span className="absolute -bottom-4 left-1 text-[8px] text-amber-500/60 font-black whitespace-nowrap">
                  Vstart {limitVStart}V
                </span>
              </div>
            )}

            {/* Max Inversor */}
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500/70 z-10"
              style={{ left: getPercent(limitInversorVMax) }}
            >
              <span className="absolute -top-4 left-1 text-[8px] text-rose-500 font-black whitespace-nowrap">
                Max {limitInversorVMax}V
              </span>
              <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none" />
            </div>

            {/* Barras por MPPT */}
            {sorted.map((p, i) => {
              const status = getMpptStatus(p, limitInversorVMax, limitMpptVMin);
              return (
                <div
                  key={p.mpptId}
                  className="absolute w-full flex items-center"
                  style={{ top: `${i * 40 + 12}px`, height: '28px' }}
                >
                  {/* Label MPPT — à esquerda (fora do canvas) */}
                  <div
                    className="absolute text-[9px] font-mono font-black text-slate-500"
                    style={{ left: '-28px', width: '24px', textAlign: 'right' }}
                  >
                    M{p.mpptId}
                  </div>

                  {/* Barra 3 segmentos */}
                  <div className="relative w-full" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                    <MpptBar
                      p={p}
                      limitVMax={limitInversorVMax}
                      limitMpptVMin={limitMpptVMin}
                      getPercent={getPercent}
                    />
                  </div>

                  {/* Badge — à direita (fora do canvas) */}
                  <div
                    className="absolute"
                    style={{ right: '-110px', width: '100px' }}
                  >
                    <DiagnosisBadge status={status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* S1 — Eixo X com ticks */}
          <AxisTicks maxAxis={maxAxis} getPercent={getPercent} />
        </div>
      </div>

      {/* Legenda inline (minimalista — a barra já é auto-explicativa) */}
      <div className="flex flex-wrap gap-3 items-center text-[8px] text-slate-600 uppercase tracking-wider border-t border-slate-800/50 pt-3 mt-1">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-rose-500/30 border border-rose-500/50 inline-block" /> Risco Calor (Vmp &lt; VmpptMín)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500/25 border border-emerald-500/40 inline-block" /> Janela Operacional</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-sky-500/15 border border-sky-500/30 inline-block" /> Zona Voc (Frio)</span>
        <span className="flex items-center gap-1"><span className="w-px h-3 bg-rose-500/70 inline-block" /> Limite Máx Inversor</span>
      </div>
    </div>
  );
};
