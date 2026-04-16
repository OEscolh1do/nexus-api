import React from 'react';
import { ValidationSeverity } from './ValidationChip';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationChipMiniProps {
  label: string;
  value: React.ReactNode;
  severity: ValidationSeverity;
}

const SEVERITY_CONFIG = {
  ok: { 
    icon: <CheckCircle2 size={12} />, 
    bg: 'bg-emerald-900/10 hover:bg-emerald-900/20', 
    border: 'border-emerald-700/30', 
    text: 'text-emerald-400',
    valText: 'text-emerald-300'
  },
  warning: { 
    icon: <AlertTriangle size={12} />, 
    bg: 'bg-amber-900/10 hover:bg-amber-900/20', 
    border: 'border-amber-700/30', 
    text: 'text-amber-400',
    valText: 'text-amber-300'
  },
  warn: { 
    icon: <AlertTriangle size={12} />, 
    bg: 'bg-amber-900/10 hover:bg-amber-900/20', 
    border: 'border-amber-700/30', 
    text: 'text-amber-400',
    valText: 'text-amber-300'
  },
  error: { 
    icon: <ShieldAlert size={12} />, 
    bg: 'bg-red-900/10 hover:bg-red-900/20', 
    border: 'border-red-700/30', 
    text: 'text-red-400',
    valText: 'text-red-300'
  },
};

export const ValidationChipMini: React.FC<ValidationChipMiniProps> = ({
  label,
  value,
  severity,
}) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.ok;

  return (
    <div className={cn('flex flex-col gap-0.5 p-2 rounded border transition-colors', cfg.bg, cfg.border)}>
      <span className={cn('flex items-center gap-1 font-bold uppercase tracking-widest', cfg.text, 'text-[8px]')}>
        {cfg.icon} {label}
      </span>
      <span className={cn('font-mono font-bold text-sm', cfg.valText)}>
        {value}
      </span>
    </div>
  );
};
