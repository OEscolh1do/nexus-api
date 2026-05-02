import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  FolderKanban,
  Package,
  Activity,
  TrendingUp,
  Server,
  Zap,
} from 'lucide-react';
import api from '@/lib/api';
import { useSystemHealth } from '@/hooks/useSystemHealth';

interface DashboardData {
  tenants: { total: number };
  users: { total: number; thisMonth: number };
  projects: { total: number };
  catalog: { modules: number; inverters: number };
  activity: { logsLast24h: number };
  api: { currentUsage: number };
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
  const { health } = useSystemHealth();

  useEffect(() => {
    const fetchData = () => {
      api
        .get('/dashboard')
        .then((res) => setData(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Polling 60s
    return () => clearInterval(interval);
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
        <h1 className="text-lg font-semibold text-slate-200">Sumaúma — Gestão Ywara Hub</h1>
        <p className="text-xs text-slate-500">Métricas consolidadas da infraestrutura e serviços gerenciados</p>
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
        <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Uso de API</p>
              <p className="font-tabular text-2xl font-semibold text-slate-100">
                {data.api.currentUsage.toLocaleString('pt-BR')}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-slate-500">
                Mês corrente
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border text-sky-400 bg-sky-500/10 border-sky-500/20">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Saúde</p>
              <p className="font-tabular text-2xl font-semibold text-slate-100">
                {health?.status === 'healthy' ? 'OK' : health ? 'Degradado' : '...'}
              </p>
              {health && (
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  {health.services.filter(s => s.status === 'healthy').length}/{health.services.length} up
                </p>
              )}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-sm border ${health?.status === 'healthy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
              <Server className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-sm border border-dashed border-slate-800 bg-slate-900/50 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Atividade Recente — Últimas 24h</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Logs de auditoria</span>
            <span className="font-mono font-bold text-amber-400">{data.activity.logsLast24h.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Novos usuários (mês)</span>
            <span className="font-mono font-bold text-sky-400">+{data.users.thisMonth.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Módulos FV ativos</span>
            <span className="font-mono font-bold text-emerald-400">{data.catalog.modules.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Inversores ativos</span>
            <span className="font-mono font-bold text-emerald-400">{data.catalog.inverters.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
      <div className="rounded-sm border border-dashed border-slate-800 bg-slate-900/50 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Cobertura da Plataforma</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Organizações (Tenants)</span>
            <span className="font-mono font-bold text-violet-400">{data.tenants.total.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total de Usuários</span>
            <span className="font-mono font-bold text-sky-400">{data.users.total.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Projetos Cadastrados</span>
            <span className="font-mono font-bold text-emerald-400">{data.projects.total.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
