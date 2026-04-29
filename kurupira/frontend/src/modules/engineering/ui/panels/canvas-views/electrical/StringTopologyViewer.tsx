import React from 'react';
import { cn } from '@/lib/utils';
import { MPPTConfig } from '../../../../store/useTechStore';

// ─────────────────────────────────────────────────────────────────────────────
// STRING TOPOLOGY VIEWER
// Visualiza topologia de strings por MPPT como barras coloridas.
// Extraído do MPPTTopologyManager para o canvas principal.
// ─────────────────────────────────────────────────────────────────────────────

const MPPT_COLORS: Record<number, string> = {
  1: 'bg-sky-500/80',
  2: 'bg-violet-500/80',
  3: 'bg-amber-500/80',
  4: 'bg-emerald-500/80',
  5: 'bg-rose-500/80',
  6: 'bg-cyan-500/80',
  7: 'bg-orange-500/80',
  8: 'bg-pink-500/80',
};

const getMpptColor = (id: number) => MPPT_COLORS[id] ?? 'bg-slate-500/80';

interface StringTopologyViewerProps {
  mpptConfigs: MPPTConfig[];
  highlightMpptId?: number; // para scroll-to highlight via DiagnosticAlertsList
}

export const StringTopologyViewer: React.FC<StringTopologyViewerProps> = ({
  mpptConfigs,
  highlightMpptId,
}) => {
  const configured = mpptConfigs.filter(m => m.stringsCount > 0 && m.modulesPerString > 0);

  if (configured.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 text-center">
        <span className="text-[11px] text-slate-600 font-mono uppercase tracking-widest">
          Configure strings nos MPPTs acima ↑
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col gap-4">
      <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
        Topologia de Strings
      </span>

      {mpptConfigs.map(mppt => {
        if (mppt.stringsCount === 0 || mppt.modulesPerString === 0) return null;
        const color = getMpptColor(mppt.mpptId);
        const isHighlighted = highlightMpptId === mppt.mpptId;

        return (
          <div
            key={mppt.mpptId}
            id={`topology-mppt-${mppt.mpptId}`}
            className={cn(
              'flex flex-col gap-1.5 p-2 rounded border transition-all duration-500',
              isHighlighted
                ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-slate-800/50 bg-slate-950/40'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                MPPT {mppt.mpptId}
              </span>
              <span className="text-[9px] font-mono text-slate-600">
                {mppt.stringsCount}× {mppt.modulesPerString} mód
              </span>
              {mppt.azimuth !== undefined && (
                <span className="text-[9px] font-mono text-slate-700">
                  · {mppt.azimuth}° / {mppt.inclination ?? 15}°
                </span>
              )}
            </div>

            {Array.from({ length: mppt.stringsCount }).map((_, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-600 font-mono min-w-[28px]">S{sIdx + 1}</span>
                <div className="flex gap-[2px] flex-wrap flex-1">
                  {Array.from({ length: mppt.modulesPerString }).map((_, mIdx) => (
                    <div
                      key={mIdx}
                      className={cn('w-1.5 h-3.5 rounded-[1px]', color)}
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
