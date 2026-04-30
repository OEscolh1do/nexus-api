import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CompactNumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onCommit: (val: number) => void;
  className?: string;
}

export const CompactNumberInput: React.FC<CompactNumberInputProps> = ({
  label,
  value,
  min = 0,
  max = 9999,
  onCommit,
  className,
}) => {
  const [localValue, setLocalValue] = useState<string>(String(value));

  // Sincroniza props que chegam de fora (mudanças de estado global, undo/redo)
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleCommit = () => {
    const num = Number(localValue);
    if (isNaN(num)) {
      setLocalValue(String(value)); // rollback
      return;
    }
    
    // Clamp
    const clamped = Math.max(min, Math.min(max, num));
    setLocalValue(String(clamped));
    
    if (clamped !== value) {
      onCommit(clamped);
    }
  };

  return (
    <div className="flex flex-col gap-1 focus-within:text-emerald-400 text-slate-400">
      <label className="text-[11px] font-bold uppercase tracking-widest text-inherit">
        {label}
      </label>
      <div className={cn(
        "flex items-center bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 focus-within:border-emerald-500/50 transition-colors",
        className
      )}>
        <input
          type="number"
          value={localValue}
          min={min}
          max={max}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="bg-transparent w-full focus:outline-none text-slate-200 font-mono text-sm"
        />
      </div>
    </div>
  );
};
