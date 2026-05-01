import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

type TenantStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';

const config: Record<TenantStatus, { label: string; cssClass: string; Icon: React.ElementType }> =
  {
    ACTIVE: { label: 'Ativo', cssClass: 'badge-active', Icon: CheckCircle2 },
    BLOCKED: { label: 'Bloqueado', cssClass: 'badge-blocked', Icon: XCircle },
    SUSPENDED: { label: 'Suspenso', cssClass: 'badge-pending', Icon: ShieldAlert },
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
