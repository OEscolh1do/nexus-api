import { CheckCircle2, XCircle, ShieldAlert, Clock } from 'lucide-react';

type TenantStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'TRIAL_EXPIRED';

const config: Record<TenantStatus, { label: string; cssClass: string; Icon: React.ElementType }> =
  {
    ACTIVE: { label: 'Ativo', cssClass: 'badge-active', Icon: CheckCircle2 },
    BLOCKED: { label: 'Bloqueado', cssClass: 'badge-blocked', Icon: XCircle },
    SUSPENDED: { label: 'Suspenso', cssClass: 'badge-pending', Icon: ShieldAlert },
    TRIAL_EXPIRED: { label: 'Trial Expirado', cssClass: 'text-amber-400 bg-amber-500/10 border border-amber-500/20', Icon: Clock },
  };

interface TenantStatusBadgeProps {
  status?: TenantStatus;
}

export default function TenantStatusBadge({ status = 'ACTIVE' }: TenantStatusBadgeProps) {
  const { label, cssClass, Icon } = config[status] ?? config.ACTIVE;
  return (
    <span className={`badge ${cssClass}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
