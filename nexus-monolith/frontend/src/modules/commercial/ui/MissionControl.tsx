import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/mock-components";
import { Users, TrendingUp, DollarSign, Sun, Loader2 } from "lucide-react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FunnelData {
  status: string;
  _count: { id: number };
  _sum: { estimatedValue: number | null };
}

interface DashboardStats {
  totalLeads: number;
  funnelData: FunnelData[];
  revenue: {
    total: number;
    count: number;
  };
}

interface Activity {
  id: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  user?: { fullName: string };
}

export function MissionControl() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const [statsRes, activitiesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/opportunities/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/activities`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (activitiesRes.data.success) {
          setActivities(activitiesRes.data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar KPIs do Mission Control:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  // Formatting helper
  const formatSec = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Prepare Chart Data mapping Enum to Readable Labels
  const chartData = stats?.funnelData.map(d => ({
    name: d.status.replace(/_/g, ' '),
    amount: d._count.id,
    value: d._sum.estimatedValue || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads na Base</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-slate-500">Métrica Global (SDR)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades (Pipeline)</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.funnelData.reduce((acc, curr) => acc + curr._count.id, 0) || 0}</div>
            <p className="text-xs text-purple-600 font-medium">Deals em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Projetada (Total)</CardTitle>
            <Sun className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSec(stats?.funnelData.reduce((acc, curr) => acc + (curr._sum.estimatedValue || 0), 0) || 0)}</div>
            <p className="text-xs text-orange-600 font-medium">Soma do pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos (Closed Won)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSec(stats?.revenue.total || 0)}</div>
            <p className="text-xs text-green-600 font-medium">{stats?.revenue.count || 0} contratos fechados</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Pipeline Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Funil de Vendas (Oportunidades)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] w-full min-h-[250px] min-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [value, "Quantidade"]}
                  />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-500">Sem atividades recentes.</p>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3 shrink-0">
                      {activity.user?.fullName?.substring(0, 2).toUpperCase() || 'SYS'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none capitalize truncate max-w-[200px]" title={activity.action.replace(/_/g, ' ')}>
                        {activity.action.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={activity.details || activity.entity}>
                        {activity.details || activity.entity} • {new Date(activity.timestamp).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
