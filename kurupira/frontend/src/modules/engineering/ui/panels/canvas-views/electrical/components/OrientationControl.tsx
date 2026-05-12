import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrubbableNumberInput } from './ScrubbableNumberInput';

// ─────────────────────────────────────────────────────────────────────────────
// ORIENTATION CONTROL — Presets semânticos e visuais para Azimute e Inclinação
// ─────────────────────────────────────────────────────────────────────────────

interface OrientationControlProps {
  azimuth: number;
  inclination: number;
  onAzimuthChange: (val: number) => void;
  onInclinationChange: (val: number) => void;
}

const AZ_PRESETS = [
  { label: 'N', val: 0 },
  { label: 'NE', val: 45 },
  { label: 'E', val: 90 },
  { label: 'SE', val: 135 },
  { label: 'S', val: 180 },
  { label: 'SW', val: 225 },
  { label: 'W', val: 270 },
  { label: 'NW', val: 315 },
];

const INC_PRESETS = [0, 10, 15, 20];

export const OrientationControl: React.FC<OrientationControlProps> = ({
  azimuth,
  inclination,
  onAzimuthChange,
  onInclinationChange
}) => {
  return (
    <div className="flex flex-col gap-2 px-3 pt-2 pb-1 border-b border-slate-800/40 bg-slate-900/20">
      
      {/* ── Bússola Semântica (Azimute) ───────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          <Compass size={10} className="text-slate-400" />
          <span>Azimute</span>
        </div>
        
        <div className="flex gap-1.5 items-center">
          <div className="flex bg-slate-950 border border-slate-800 rounded overflow-hidden flex-1 shadow-inner">
            {AZ_PRESETS.map(p => {
              // Note: 0 e 360 são ambos Norte
              const isActive = azimuth === p.val || (p.val === 0 && azimuth === 360);
              return (
                <button
                  key={p.label}
                  onClick={() => onAzimuthChange(p.val)}
                  className={cn(
                    "flex-1 py-1 text-[9px] font-black transition-all",
                    isActive 
                      ? "bg-sky-500/20 text-sky-400 shadow-[inset_0_0_8px_rgba(56,189,248,0.2)]" 
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-300 active:scale-95"
                  )}
                  title={`Definir Azimute para ${p.val}° (${p.label})`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="w-[60px] shrink-0 h-[26px]">
            <ScrubbableNumberInput
              value={azimuth}
              min={0}
              max={360}
              step={1}
              onCommit={onAzimuthChange}
              suffix="°"
              sensitivity={10}
              className="h-full border-slate-800 bg-slate-950/60"
            />
          </div>
        </div>
      </div>

      {/* ── Presets Angulares (Inclinação) ────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {/* O ícone gira fisicamente para representar o ângulo! */}
          <ArrowRight 
            size={10} 
            className="text-emerald-400 transition-transform duration-300" 
            style={{ transform: `rotate(-${inclination}deg)` }}
          />
          <span>Inclinação</span>
        </div>
        
        <div className="flex gap-1.5 items-center">
          <div className="flex bg-slate-950 border border-slate-800 rounded overflow-hidden flex-1 shadow-inner">
            {INC_PRESETS.map(val => {
              const isActive = inclination === val;
              return (
                <button
                  key={val}
                  onClick={() => onInclinationChange(val)}
                  className={cn(
                    "flex-1 py-1 px-1 text-[10px] font-bold font-mono transition-all",
                    isActive 
                      ? "bg-emerald-500/20 text-emerald-400 shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]" 
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-300 active:scale-95"
                  )}
                >
                  {val}°
                </button>
              );
            })}
          </div>
          <div className="w-[60px] shrink-0 h-[26px]">
            <ScrubbableNumberInput
              value={inclination}
              min={0}
              max={90}
              step={1}
              onCommit={onInclinationChange}
              suffix="°"
              sensitivity={10}
              className="h-full border-slate-800 bg-slate-950/60"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
