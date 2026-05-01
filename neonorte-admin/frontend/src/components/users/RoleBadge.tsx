interface RoleBadgeProps {
  role: string;
}

const ROLE_STYLES: Record<string, string> = {
  PLATFORM_ADMIN: 'text-violet-400 bg-violet-500/10 border border-violet-500/20',
  ADMIN: 'badge-info',
  ENGINEER: 'badge-active',
  VIEWER: 'text-slate-400 bg-slate-500/10 border border-slate-500/20',
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const cssClass = ROLE_STYLES[role] ?? 'text-slate-400 bg-slate-500/10 border border-slate-500/20';
  return <span className={`badge ${cssClass}`}>{role}</span>;
}
