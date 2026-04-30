import React, { useState, useEffect } from 'react';
import { Minus, Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  minRecommended?: number;
  maxRecommended?: number;
  onCommit: (val: number) => void;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

export const StepperInput: React.FC<StepperInputProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  minRecommended,
  maxRecommended,
  onCommit,
  className,
  disabled = false,
  icon: Icon
}) => {
  const [localValue, setLocalValue] = useState<string>(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const numericValue = Number(localValue) || 0;
  const progress = Math.max(0, Math.min(100, ((numericValue - min) / (max - min)) * 100));
  
  // Cores semânticas baseadas na proximidade do limite
  const isAtMax = numericValue >= max;
  const isNearMax = numericValue >= max * 0.85;
  const statusColor = isAtMax ? 'text-red-500' : isNearMax ? 'text-amber-500' : 'text-emerald-500';
  const borderColor = isAtMax ? 'border-red-500/50' : isNearMax ? 'border-amber-500/50' : 'focus-within:border-emerald-500/50';

  const handleCommit = (newValue: number | string) => {
    let num = typeof newValue === 'string' ? Number(newValue) : newValue;
    if (isNaN(num)) {
      setLocalValue(String(value));
      return;
    }
    
    const clamped = Math.max(min, Math.min(max, num));
    setLocalValue(String(clamped));
    
    if (clamped !== value) {
      onCommit(clamped);
    }
  };

  const increment = () => {
    if (disabled) return;
    if (numericValue < max) {
      handleCommit(numericValue + 1);
    }
  };

  const decrement = () => {
    if (disabled) return;
    if (numericValue > min) {
      handleCommit(numericValue - 1);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5 group", className)}>
      <div className="flex justify-between items-end">
        {label && (
          <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-slate-300 transition-colors">
            {Icon && <Icon size={10} className="opacity-70" />}
            {label}
          </label>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <div className={cn(
          "flex items-center bg-slate-950/60 border border-slate-800 rounded-sm h-8 transition-all duration-300 relative",
          borderColor,
          disabled && "opacity-50 pointer-events-none"
        )}>
          <button
            type="button"
            onClick={decrement}
            disabled={numericValue <= min}
            className="h-full px-2 text-slate-600 hover:text-slate-300 hover:bg-white/5 disabled:opacity-20 transition-all flex items-center justify-center shrink-0 border-r border-slate-800/50"
          >
            <Minus size={12} strokeWidth={3} />
          </button>
          
          <input
            type="number"
            value={localValue}
            min={min}
            max={max}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => handleCommit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className={cn(
              "bg-transparent w-full text-center focus:outline-none font-mono text-[13px] font-black transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              statusColor
            )}
            disabled={disabled}
          />
          
          <button
            type="button"
            onClick={increment}
            disabled={numericValue >= max}
            className="h-full px-2 text-slate-600 hover:text-slate-300 hover:bg-white/5 disabled:opacity-20 transition-all flex items-center justify-center shrink-0 border-l border-slate-800/50"
          >
            <Plus size={12} strokeWidth={3} />
          </button>
        </div>

        {/* Spatial Track (Mini-Slider Passivo) e Labels */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="w-full h-[2px] bg-slate-800/50 rounded-full overflow-hidden relative">
            {/* Min Marker */}
            {minRecommended !== undefined && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-sky-500/50 z-10" 
                style={{ left: `${Math.max(0, Math.min(100, ((minRecommended - min) / (max - min)) * 100))}%` }} 
              />
            )}
            
            {/* Progress Bar */}
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out absolute left-0 top-0",
                isAtMax ? "bg-red-500" : isNearMax ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Label Hints de Min e Max */}
          {(minRecommended !== undefined || maxRecommended !== undefined) && (
            <div className="flex justify-between items-center text-[7px] font-mono font-black tracking-widest text-slate-600 uppercase">
              <span>{minRecommended !== undefined ? `Min: ${minRecommended}` : ''}</span>
              <span>{maxRecommended !== undefined ? `Max: ${maxRecommended}` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
