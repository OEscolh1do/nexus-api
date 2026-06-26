import { useEffect, useState, useCallback, useMemo } from 'react';
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
import Sparkline from '@/components/ui/Sparkline';

interface DashboardData {
  tenants: { total: number };
  users: { total: number; thisMonth: number };
  projects: { total: number };
  catalog: { modules: number; inverters: number };
  activity: { logsLast24h: number };
  api: { currentUsage: number };
}

interface TrendData {
  labels: string[];
  usersByDay: number[];
  logsByDay: number[];
  tenantsByDay: number[];
}

interface HealthData {
  status: 'healthy' | 'degraded';
  services: Array<{ status: string }>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const STAT_COLOR_MAP: Record<string, string> = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  sky:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  violet:  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  rose:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const STAT_SPARK_COLOR_MAP: Record<string, string> = {
  emerald: '#34d399',
  sky:     '#60a5fa',
  amber:   '#fbbf24',
  violet:  '#a78bfa',
  rose:    '#fb7185',
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
  sparkValues,
  sparkColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  detail?: string;
  color: string;
  sparkValues?: number[];
  sparkColor?: string;
}) {
  const classes = STAT_COLOR_MAP[color] ?? STAT_COLOR_MAP.sky;
  const sColor = sparkColor ?? STAT_SPARK_COLOR_MAP[color] ?? '#60a5fa';

  return (
    <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
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
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-sm border ${classes}`}>
            <Icon className="h-5 w-5" />
          </div>
          {sparkValues && sparkValues.length > 1 && (
            <Sparkline values={sparkValues} color={sColor} width={60} height={20} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-sm border border-slate-800 bg-slate-900 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 rounded bg-slate-800" />
          <div className="h-7 w-16 rounded bg-slate-800" />
          <div className="h-2.5 w-32 rounded bg-slate-800" />
        </div>
        <div className="h-10 w-10 rounded-sm bg-slate-800" />
      </div>
    </div>
  );
}

// ─── Polling helper ───────────────────────────────────────────────────────────

function usePollingEffect(fn: () => void, intervalMs: number) {
  const stableFn = useCallback(fn, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    stableFn();
    const id = setInterval(stableFn, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') stableFn(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [stableFn, intervalMs]);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data,   setData]   = useState<DashboardData | null>(null);
  const [trend,  setTrend]  = useState<TrendData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [trendError, setTrendError] = useState(false);
  const [dataError,  setDataError]  = useState(false);
  const [loading, setLoading] = useState(true);

  const healthyCount = useMemo(
    () => health?.services.filter(s => s.status === 'healthy').length ?? 0,
    [health]
  );

  // KPIs + health card — poll every 60s + refresh on tab focus
  usePollingEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/system/health').catch(() => null),
    ]).then(([kpiRes, healthRes]) => {
      setData(kpiRes.data.data);
      setDataError(false);
      if (healthRes) setHealth(healthRes.data);
    }).catch(() => setDataError(true))
      .finally(() => setLoading(false));
  }, 60_000);

  // Trend — poll every 5 min + refresh on tab focus
  usePollingEffect(() => {
    api.get('/dashboard/trend')
      .then((res) => { setTrend(res.data.data); setTrendError(false); })
      .catch(() => setTrendError(true));
  }, 5 * 60_000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-200">Sumaúma — Gestão Ywara Hub</h1>
        <p className="text-xs text-slate-500">Métricas consolidadas da infraestrutura e serviços gerenciados</p>
      </div>

      {/* KPI fetch error */}
      {dataError && !data && !loading && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/5 px-4 py-3 text-[11px] text-red-400">
          Falha ao carregar métricas — verifique a conexão com o backend e tente atualizar.
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data ? (
          <>
            <StatCard
              icon={Building2}
              label="Organizações"
              value={data.tenants.total}
              color="violet"
              sparkValues={trend?.tenantsByDay}
            />
            <StatCard
              icon={Users}
              label="Usuários"
              value={data.users.total}
              detail={`+${data.users.thisMonth} este mês`}
              color="sky"
              sparkValues={trend?.usersByDay}
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
              sparkValues={trend?.logsByDay}
            />
            {/* API Usage */}
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400">Uso de API</p>
                  <p className="font-tabular text-2xl font-semibold text-slate-100">
                    {data.api.currentUsage.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[11px] text-slate-500">Mês corrente</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border text-sky-400 bg-sky-500/10 border-sky-500/20">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </div>
            {/* Health */}
            <div className="rounded-sm border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400">Saúde</p>
                  <p className="font-tabular text-2xl font-semibold text-slate-100">
                    {health?.status === 'healthy' ? 'OK' : health ? 'Degradado' : '...'}
                  </p>
                  {health && (
                    <p className="text-[11px] text-slate-500">
                      {healthyCount}/{health.services.length} serviços up
                    </p>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-sm border ${health?.status === 'healthy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                  <Server className="h-5 w-5" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-full flex items-center justify-center py-16">
            <p className="text-sm text-red-400">Falha ao carregar dados do dashboard</p>
          </div>
        )}
      </div>

      {/* Trend charts */}
      {trendError && !trend && (
        <div className="rounded-sm border border-slate-800 bg-slate-900/50 px-4 py-3 text-[11px] text-slate-500">
          Dados de tendência indisponíveis — tente novamente em alguns instantes.
        </div>
      )}
      {trend && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { label: 'Novos Usuários (7 dias)', values: trend.usersByDay, color: '#60a5fa' },
            { label: 'Logs de Auditoria (7 dias)', values: trend.logsByDay, color: '#fb7185' },
            { label: 'Novas Organizações (7 dias)', values: trend.tenantsByDay, color: '#a78bfa' },
          ].map(({ label, values, color }) => (
            <div key={label} className="rounded-sm border border-slate-800 bg-slate-900 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              <div className="flex items-end gap-1 h-12">
                {values.map((v, i) => {
                  const max = Math.max(...values, 1);
                  const pct = (v / max) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                      <div
                        className="w-full rounded-sm min-h-[2px] transition-all"
                        style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: 0.7 + (i / values.length) * 0.3 }}
                        title={`${trend.labels[i]}: ${v}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-[9px] text-slate-600">{trend.labels[0]}</span>
                <span className="text-[9px] text-slate-600">{trend.labels[trend.labels.length - 1]}</span>
              </div>
              <p className="mt-1 text-[11px] font-mono font-semibold" style={{ color }}>
                Total: {values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Summary panels */}
      {data && (
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
      )}
    </div>
  );
}
