import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationSeverity } from './ValidationChip';

export interface AlertDescriptor {
  id: string;
  severity: ValidationSeverity;
  message: string;
  mpptId?: string; // associativo caso erro ocorra em nível MPPT
}

interface DiagnosticAlertsListProps {
  alerts: AlertDescriptor[];
}

export const DiagnosticAlertsList: React.FC<DiagnosticAlertsListProps> = ({ alerts }) => {
  const scrollToMppt = (mpptId?: string) => {
    if (!mpptId) return;
    const el = document.getElementById(`mppt-${mpptId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Adiciona highlight visual rápido (usando classList por ser efêmero)
      el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2', 'ring-offset-slate-950');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2', 'ring-offset-slate-950');
      }, 1500);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-xs text-slate-500 flex items-center justify-center h-20 border border-dashed border-slate-800 rounded bg-slate-900/50">
        <CheckCircle2 size={16} className="text-emerald-500/50 mr-2" />
        Sem restrições elétricas
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {alerts.map((alerta) => {
        const isError = alerta.severity === 'error';
        return (
          <button
            key={alerta.id}
            onClick={() => scrollToMppt(alerta.mpptId)}
            className={cn(
              "w-full text-left px-3 py-2 text-[10px] rounded border transition-colors flex items-start gap-2 group",
              isError 
                ? "bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/40" 
                : "bg-amber-950/20 border-amber-900/30 text-amber-400 hover:bg-amber-950/40",
              alerta.mpptId ? "cursor-pointer" : "cursor-default"
            )}
          >
            {isError ? (
              <ShieldAlert size={12} className="shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1 min-w-0 break-words leading-relaxed">
              {alerta.message}
            </span>
          </button>
        );
      })}
    </div>
  );
};
