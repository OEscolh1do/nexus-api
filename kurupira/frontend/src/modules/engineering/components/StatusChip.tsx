import React from 'react';
import { cn } from '@/lib/utils';

export type ChipSeverity = 'ok' | 'warn' | 'error' | 'neutral';

interface StatusChipProps {
  label: string;
  value: string;
  severity: ChipSeverity;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, value, severity }) => {
  return (
    <div className={cn(
      "px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0",
      severity === 'ok' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
      severity === 'warn' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
      severity === 'error' ? "bg-red-500/10 text-red-400 border-red-500/20" :
      "bg-slate-800 text-slate-400 border-slate-700"
    )}>
      <span className="text-[8px] font-medium opacity-80">{label}</span>
      <span className="text-[9px] font-bold">{value}</span>
    </div>
  );
};
