import React from 'react';
import { cn } from '@/lib/utils';
import { MPPTConfig } from '../../../../store/useTechStore';

// ─────────────────────────────────────────────────────────────────────────────
// STRING TOPOLOGY VIEWER
// Visualiza topologia de strings por MPPT com dados de tensão e potência.
// ─────────────────────────────────────────────────────────────────────────────

const MPPT_COLORS: Record<number, { bar: string; text: string }> = {
  1: { bar: 'bg-sky-500/80',     text: 'text-sky-400' },
  2: { bar: 'bg-violet-500/80',  text: 'text-violet-400' },
  3: { bar: 'bg-amber-500/80',   text: 'text-amber-400' },
  4: { bar: 'bg-emerald-500/80', text: 'text-emerald-400' },
  5: { bar: 'bg-rose-500/80',    text: 'text-rose-400' },
  6: { bar: 'bg-cyan-500/80',    text: 'text-cyan-400' },
  7: { bar: 'bg-orange-500/80',  text: 'text-orange-400' },
  8: { bar: 'bg-pink-500/80',    text: 'text-pink-400' },
};

const getMpptPalette = (id: number) =>
  MPPT_COLORS[id] ?? { bar: 'bg-slate-500/80', text: 'text-slate-400' };

// Métricas mini recebidas do canvas pai (já calculadas em ElectricalCanvasView)
interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
}

interface StringTopologyViewerProps {
  mpptConfigs: MPPTConfig[];
  mpptMetrics?: Record<number, MPPTMiniMetrics>;
  highlightMpptId?: number | null;
}

export const StringTopologyViewer: React.FC<StringTopologyViewerProps> = ({
  mpptConfigs,
  mpptMetrics = {},
  highlightMpptId,
}) => {
  const configured = mpptConfigs.filter(m => m.stringsCount > 0 && m.modulesPerString > 0);

  if (configured.length === 0) {
    return (
      <div className="bg-slate-900 rounded-sm border border-slate-800 p-4 text-center">
        <span className="text-[11px] text-slate-600 font-mono uppercase tracking-widest">
          Configure strings nos MPPTs acima ↑
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-sm border border-slate-800 p-4 flex flex-col gap-3">
      <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
        Topologia de Strings
      </span>

      {mpptConfigs.map(mppt => {
        if (mppt.stringsCount === 0 || mppt.modulesPerString === 0) return null;
        const palette = getMpptPalette(mppt.mpptId);
        const isHighlighted = highlightMpptId === mppt.mpptId;
        const metrics = mpptMetrics[mppt.mpptId];

        return (
          <div
            key={mppt.mpptId}
            id={`topology-mppt-${mppt.mpptId}`}
            className={cn(
              'flex flex-col gap-1.5 p-2.5 rounded-sm border transition-all duration-500',
              isHighlighted
                ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-slate-800/50 bg-slate-950/40'
            )}
          >
            {/* Header: label + potência */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[10px] font-black uppercase tracking-widest', palette.text)}>
                MPPT {mppt.mpptId}
              </span>
              <span className="text-[9px] font-mono text-slate-600">
                {mppt.stringsCount}× {mppt.modulesPerString} mód
              </span>
              {mppt.azimuth !== undefined && (
                <span className="text-[9px] font-mono text-slate-700">
                  · {mppt.azimuth}°/{mppt.inclination ?? 15}°
                </span>
              )}
              {metrics && metrics.powerKwp > 0 && (
                <span className="ml-auto text-[9px] font-mono font-black text-slate-400 tabular-nums">
                  {metrics.powerKwp.toFixed(2)} kWp
                </span>
              )}
            </div>

            {/* Voltage badges */}
            {metrics && (metrics.vocFrio > 0 || metrics.vmpCalor > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                {metrics.vocFrio > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/5 border border-sky-500/20 rounded-sm">
                    <span className="text-[7px] text-slate-600 uppercase font-bold">Voc↑</span>
                    <span className="text-[9px] font-mono text-sky-400 tabular-nums">
                      {metrics.vocFrio.toFixed(0)}V
                    </span>
                  </div>
                )}
                {metrics.vmpCalor > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                    <span className="text-[7px] text-slate-600 uppercase font-bold">Vmp↓</span>
                    <span className="text-[9px] font-mono text-emerald-400 tabular-nums">
                      {metrics.vmpCalor.toFixed(0)}V
                    </span>
                  </div>
                )}
                {metrics.iscTotal > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800/60 border border-slate-700/40 rounded-sm">
                    <span className="text-[7px] text-slate-600 uppercase font-bold">Isc</span>
                    <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                      {metrics.iscTotal.toFixed(1)}A
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* String bars */}
            {Array.from({ length: mppt.stringsCount }).map((_, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-600 font-mono min-w-[28px]">S{sIdx + 1}</span>
                <div className="flex gap-[2px] flex-wrap flex-1">
                  {Array.from({ length: mppt.modulesPerString }).map((_, mIdx) => (
                    <div
                      key={mIdx}
                      className={cn('w-1.5 h-3.5 rounded-[1px]', palette.bar)}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-500 font-mono shrink-0">
                  {mppt.modulesPerString} mod
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
