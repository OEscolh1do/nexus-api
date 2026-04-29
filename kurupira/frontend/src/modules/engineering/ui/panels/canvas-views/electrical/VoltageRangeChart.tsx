import React from 'react';

export interface MpptThermalProfile {
  mpptId: string | number;
  vocMax: number;    // Voc corrigido pelo frio (Tmin)
  vmpMin: number;    // Vmp operacional mínimo (temperatura fria)
  vmpMax: number;    // Vmp operacional máximo (temperatura fria)
  vmpCalor?: number; // [NEW] Vmp corrigido pela temperatura máxima da célula
}

interface VoltageRangeChartProps {
  mpptProfiles: MpptThermalProfile[];
  limitInversorVMax: number;
  limitMpptVMin: number;
  limitMpptVMax: number;
  limitVStart?: number;
}

export const VoltageRangeChart: React.FC<VoltageRangeChartProps> = ({
  mpptProfiles,
  limitInversorVMax,
  limitMpptVMin,
  limitMpptVMax,
  limitVStart,
}) => {
  let overallVocMax = 0;
  mpptProfiles.forEach(p => {
    if (p.vocMax > overallVocMax) overallVocMax = p.vocMax;
  });

  const maxAxis = Math.max(limitInversorVMax * 1.15, overallVocMax * 1.05, 100);
  const getPercent = (value: number) => `${Math.min(100, Math.max(0, (value / maxAxis) * 100))}%`;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 relative flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
          Análise Termodinâmica Multi-MPPT
        </span>
      </div>

      <div className="relative w-full border-l border-slate-700/50 min-h-[64px] flex flex-col justify-center gap-3 py-2">

        {/* Zona MPPT Ótima */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-emerald-500/20 z-0"
          style={{ left: getPercent(limitMpptVMin), width: getPercent(limitMpptVMax - limitMpptVMin) }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] text-emerald-500/60 uppercase tracking-widest whitespace-nowrap">
            Faixa MPPT
          </div>
        </div>

        {/* Tensão de Partida (Vstart) */}
        {limitVStart && (
          <div
            className="absolute top-0 bottom-0 w-px border-l border-dashed border-amber-500/50 z-0"
            style={{ left: getPercent(limitVStart) }}
          >
            <div className="absolute -bottom-3 left-1 text-[9px] text-amber-500/70 uppercase font-bold whitespace-nowrap">
              Vstart {limitVStart}V
            </div>
          </div>
        )}

        {/* Limite do Inversor */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500/80 z-0"
          style={{ left: getPercent(limitInversorVMax) }}
        >
          <div className="absolute -top-3 left-1 text-[11px] text-red-500 uppercase font-bold whitespace-nowrap">
            Max Inv {limitInversorVMax.toFixed(0)}V
          </div>
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
        </div>

        {/* Barras por MPPT */}
        {mpptProfiles.map((p) => {
          if (p.vmpMin === 0 && p.vmpMax === 0 && p.vocMax === 0) return null;

          const vocOverLimit = p.vocMax > limitInversorVMax;
          const vmpUnderMin  = p.vmpCalor !== undefined && p.vmpCalor > 0 && p.vmpCalor < limitMpptVMin;

          return (
            <div key={p.mpptId} className="relative h-4 w-full z-10 group">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                M{p.mpptId}
              </div>

              {/* Eixo central */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/30 -translate-y-1/2" />

              {/* Barra Range Vmp Operacional */}
              <div
                className="absolute h-3 bg-amber-500/90 rounded-sm top-1/2 -translate-y-1/2 shadow-sm border-x-2 border-amber-400 opacity-90 group-hover:opacity-100 transition-opacity"
                title={`Vmp Range: ${p.vmpMin.toFixed(2)}V a ${p.vmpMax.toFixed(2)}V`}
                style={{ left: getPercent(p.vmpMin), width: getPercent(p.vmpMax - p.vmpMin) }}
              />

              {/* Marcador Voc Max */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-4 z-20 ${
                  vocOverLimit
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                }`}
                title={`Voc Máximo: ${p.vocMax.toFixed(2)}V${vocOverLimit ? ' ⚠ Excede limite!' : ''}`}
                style={{ left: getPercent(p.vocMax) }}
              >
                <div className="hidden group-hover:flex absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-slate-300 shadow-xl whitespace-nowrap z-50">
                  Voc: <span className={vocOverLimit ? 'text-red-400 ml-1 font-bold' : 'text-sky-400 ml-1 font-bold'}>
                    {p.vocMax.toFixed(2)}V
                  </span>
                </div>
              </div>

              {/* Marcador Vmp(calor) — detecta desligamento nos dias quentes */}
              {p.vmpCalor !== undefined && p.vmpCalor > 0 && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-3 z-20 rounded-[1px] ${
                    vmpUnderMin
                      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                      : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                  }`}
                  title={`Vmp(calor): ${p.vmpCalor.toFixed(2)}V${vmpUnderMin ? ' ⚠ Abaixo do MPPT mín!' : ''}`}
                  style={{ left: getPercent(p.vmpCalor) }}
                />
              )}
            </div>
          );
        })}

        {mpptProfiles.filter(p => p.vmpMin > 0 || p.vocMax > 0).length === 0 && (
          <div className="text-xs text-slate-600 text-center relative z-10 w-full font-mono py-2">
            Sem strings conectadas
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 items-center justify-center mt-3 text-[11px] text-slate-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-500" /> Vmp Operacional</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-3 bg-sky-400 shadow-sm shadow-sky-500/50" /> Voc (T. Mín)</span>
        <span className="flex items-center gap-1.5"><span className="w-1 h-3 rounded-[1px] bg-emerald-400 shadow-sm shadow-emerald-500/40" /> Vmp (T. Máx)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 border border-emerald-500/50 bg-emerald-500/20" /> Range Inversor</span>
      </div>
    </div>
  );
};
