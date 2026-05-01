import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  FolderKanban,
  Package,
  Activity,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';

interface DashboardData {
  tenants: { total: number };
  users: { total: number; thisMonth: number };
  projects: { total: number };
  catalog: { modules: number; inverters: number };
  activity: { logsLast24h: number };
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  detail?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  const classes = colorMap[color] || colorMap.sky;

  return (
    <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="font-tabular text-2xl font-semibold text-slate-100">
            {value.toLocaleString('pt-BR')}
          </p>
          {detail && (
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp className="h-3 w-3" />
              {detail}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-sm border ${classes}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-slate-500">Carregando dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-red-400">Falha ao carregar dados do dashboard</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-200">Visão Geral da Plataforma</h1>
        <p className="text-xs text-slate-500">Métricas consolidadas de todos os serviços</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Building2}
          label="Organizações"
          value={data.tenants.total}
          color="violet"
        />
        <StatCard
          icon={Users}
          label="Usuários"
          value={data.users.total}
          detail={`+${data.users.thisMonth} este mês`}
          color="sky"
        />
        <StatCard
          icon={FolderKanban}
          label="Projetos"
          value={data.projects.total}
          color="emerald"
        />
        <StatCard
          icon={Package}
          label="Catálogo"
          value={data.catalog.modules + data.catalog.inverters}
          detail={`${data.catalog.modules} mód · ${data.catalog.inverters} inv`}
          color="amber"
        />
        <StatCard
          icon={Activity}
          label="Atividade (24h)"
          value={data.activity.logsLast24h}
          color="rose"
        />
      </div>

      {/* Placeholder for future widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <p className="text-xs text-slate-600">Atividade Recente — em breve</p>
        </div>
        <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <p className="text-xs text-slate-600">Saúde dos Serviços — em breve</p>
        </div>
      </div>
    </div>
  );
}
