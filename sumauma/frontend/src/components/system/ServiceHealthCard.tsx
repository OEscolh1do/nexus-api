import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ServiceStatus } from '@/hooks/useSystemHealth';

interface ServiceHealthCardProps {
  service: ServiceStatus;
}

export default function ServiceHealthCard({ service }: ServiceHealthCardProps) {
  const statusConfig = {
    healthy: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Online'
    },
    degraded: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: AlertTriangle,
      label: 'Degradado'
    },
    down: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: XCircle,
      label: 'Offline'
    },
    error: {
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      icon: Activity,
      label: 'Erro'
    }
  };

  const config = statusConfig[service.status];
  const Icon = config.icon;

  return (
    <div className={`p-4 border rounded-sm ${config.bgColor} ${config.borderColor} space-y-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{service.name}</span>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-[10px] text-slate-500 font-mono">Latência: {service.latencyMs}ms</p>
        </div>
        
        {service.error && (
          <span className="text-[9px] text-red-500/70 font-mono truncate max-w-[120px]" title={service.error}>
            {service.error}
          </span>
        )}
      </div>
    </div>
  );
}
