import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactNumberInput } from './components/CompactNumberInput';
import { MPPTConfig } from '../../../../store/useTechStore';

// ─────────────────────────────────────────────────────────────────────────────
// MPPT CONFIG STRIP
// Barra horizontal compacta de configuração por MPPT.
// Padrão: ConsumptionCanvasView Level 2 (UC Strip) — inline fields onBlur/Enter.
// ─────────────────────────────────────────────────────────────────────────────

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
}

interface MPPTConfigStripProps {
  inverterId: string;
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  updateMPPT: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  limitVMax: number;
  limitVMpptMin: number;
}

export const MPPTConfigStrip: React.FC<MPPTConfigStripProps> = ({
  inverterId,
  mpptConfigs,
  mpptMetrics,
  updateMPPT,
  limitVMax,
  limitVMpptMin,
}) => {
  if (mpptConfigs.length === 0) return null;

  return (
    <div
      className="bg-slate-950/50 border-b border-slate-800 shrink-0 flex flex-col lg:flex-row lg:items-stretch overflow-x-auto custom-scrollbar divide-y lg:divide-y-0 lg:divide-x divide-slate-800"
      role="region"
      aria-label="Configuração por MPPT"
    >
      {mpptConfigs.map((mppt) => {
        const metrics = mpptMetrics[mppt.mpptId];
        const hasVoc  = metrics && metrics.vocFrio > 0;
        const vocErr  = hasVoc && metrics.vocFrio > limitVMax;
        const vmpErr  = hasVoc && metrics.vmpCalor > 0 && metrics.vmpCalor < limitVMpptMin;
        const hasMism = metrics?.hasMismatch;
        const sectionOk = hasVoc && !vocErr && !vmpErr;

        return (
          <div
            key={mppt.mpptId}
            id={`mppt-strip-${mppt.mpptId}`}
            className="flex items-center gap-4 px-4 py-2.5 shrink-0 min-h-[3rem]"
          >
            {/* Badge MPPT */}
            <div className={cn(
              'flex flex-col items-center justify-center px-2 py-1 rounded-sm border text-[8px] font-black uppercase tracking-widest shrink-0 min-w-[42px]',
              vocErr || vmpErr
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : hasMism
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : sectionOk
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-500'
            )}>
              M{mppt.mpptId}
              {(vocErr || vmpErr) && <AlertTriangle size={8} className="mt-0.5" />}
            </div>

            {/* Mods/String */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Mods</span>
              <CompactNumberInput
                label=""
                value={mppt.modulesPerString || 0}
                min={0} max={40}
                onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { modulesPerString: val })}
              />
            </div>

            {/* Strings */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Str</span>
              <CompactNumberInput
                label=""
                value={mppt.stringsCount || 0}
                min={0} max={10}
                onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { stringsCount: val })}
              />
            </div>

            {/* Azimute */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Az</span>
              <CompactNumberInput
                label=""
                value={mppt.azimuth || 180}
                min={0} max={360}
                onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { azimuth: val })}
              />
              <span className="text-[8px] text-slate-700">°</span>
            </div>

            {/* Inclinação */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Inc</span>
              <CompactNumberInput
                label=""
                value={mppt.inclination || 15}
                min={0} max={90}
                onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { inclination: val })}
              />
              <span className="text-[8px] text-slate-700">°</span>
            </div>

            {/* Mini métricas em tempo real */}
            {hasVoc && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800/60 text-[9px] font-mono shrink-0">
                <span className={cn('flex flex-col', vocErr ? 'text-red-400' : 'text-slate-500')}>
                  <span className="text-[7px] uppercase text-slate-600">Voc</span>
                  {metrics.vocFrio.toFixed(0)}V
                </span>
                {metrics.vmpCalor > 0 && (
                  <span className={cn('flex flex-col', vmpErr ? 'text-red-400' : 'text-slate-500')}>
                    <span className="text-[7px] uppercase text-slate-600">Vmp↓</span>
                    {metrics.vmpCalor.toFixed(0)}V
                  </span>
                )}
                <span className="flex flex-col text-slate-500">
                  <span className="text-[7px] uppercase text-slate-600">DC</span>
                  {metrics.powerKwp.toFixed(2)}kWp
                </span>
              </div>
            )}

            {/* Badge mismatch de orientação */}
            {hasMism && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-sm text-[8px] text-amber-400 font-black uppercase tracking-widest shrink-0">
                <AlertTriangle size={8} />
                Mismatch
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
