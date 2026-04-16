import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ValidationSeverity = 'ok' | 'warning' | 'error' | 'warn';

interface ValidationChipProps {
  label: string;
  value: React.ReactNode;
  severity: ValidationSeverity;
  subtitle?: string;
  size?: 'normal' | 'mini';
}

const SEVERITY_CONFIG = {
  ok: { 
    icon: <CheckCircle2 size={14} />, 
    bg: 'bg-emerald-900/20', 
    border: 'border-emerald-700/40', 
    text: 'text-emerald-400',
    valText: 'text-emerald-300'
  },
  warning: { 
    icon: <AlertTriangle size={14} />, 
    bg: 'bg-amber-900/20', 
    border: 'border-amber-700/40', 
    text: 'text-amber-400',
    valText: 'text-amber-300'
  },
  warn: { 
    icon: <AlertTriangle size={14} />, 
    bg: 'bg-amber-900/20', 
    border: 'border-amber-700/40', 
    text: 'text-amber-400',
    valText: 'text-amber-300'
  },
  error: { 
    icon: <ShieldAlert size={14} />, 
    bg: 'bg-red-900/20', 
    border: 'border-red-700/40', 
    text: 'text-red-400',
    valText: 'text-red-300'
  },
};

export const ValidationChip: React.FC<ValidationChipProps> = ({
  label,
  value,
  severity,
  subtitle,
  size = 'normal'
}) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.ok;

  const isMini = size === 'mini';

  return (
    <div className={cn(
      'rounded-md border flex flex-col',
      cfg.bg, cfg.border,
      isMini ? 'p-2 gap-0.5' : 'p-3 gap-1'
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cfg.text}>
          {isMini ? React.cloneElement(cfg.icon as any, { size: 12 }) : cfg.icon}
        </span>
        <span className={cn('font-bold uppercase tracking-widest text-slate-400', isMini ? 'text-[8px]' : 'text-[10px]')}>
          {label}
        </span>
      </div>
      
      <div className={cn('font-black font-mono tracking-tight', cfg.valText, isMini ? 'text-sm' : 'text-xl')}>
        {value}
      </div>

      {!isMini && subtitle && (
        <div className="text-[10px] text-slate-500 truncate mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};
