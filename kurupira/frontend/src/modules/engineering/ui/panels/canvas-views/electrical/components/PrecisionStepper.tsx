import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrecisionStepperProps {
  value: number;
  min?: number;
  max?: number;
  onCommit: (val: number) => void;
  className?: string;
  suffix?: string; // Ex: "m", "A", "V"
}

/**
 * PrecisionStepper — Controle minimalista para valores discretos.
 * Agora suporta sufixos de unidade para maior clareza técnica.
 */
export const PrecisionStepper: React.FC<PrecisionStepperProps> = ({
  value,
  min = 0,
  max = 99,
  onCommit,
  className,
  suffix
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleStep = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta));
    if (next !== value) onCommit(next);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseInt(localValue, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onCommit(clamped);
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <div className={cn("flex items-center h-full w-full bg-slate-900 group/stepper select-none", className)}>
      <button 
        type="button"
        onClick={() => handleStep(-1)}
        disabled={value <= min}
        className="h-full w-4 flex items-center justify-center text-slate-600 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-0 transition-all shrink-0 border-r border-slate-800/50"
        tabIndex={-1}
      >
        <Minus size={7} strokeWidth={5} />
      </button>
      
      <div className="flex-1 h-full min-w-0 flex items-center justify-center relative overflow-hidden">
        {isEditing ? (
          <input
            autoFocus
            type="number"
            className="w-full h-full bg-slate-950 text-center text-[10px] font-mono font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="w-full h-full flex items-center justify-center gap-0.5 cursor-text hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-[10px] font-mono font-black text-white tabular-nums">
              {value}
            </span>
            {suffix && (
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter shrink-0">
                {suffix}
              </span>
            )}
          </div>
        )}
      </div>

      <button 
        type="button"
        onClick={() => handleStep(1)}
        disabled={value >= max}
        className="h-full w-4 flex items-center justify-center text-slate-600 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-0 transition-all shrink-0 border-l border-slate-800/50"
        tabIndex={-1}
      >
        <Plus size={7} strokeWidth={5} />
      </button>
    </div>
  );
};
