import { useEffect, useState } from "react";
import { BiService, type BiOverview } from "../bi.service";
import { Card, Button } from "@/components/ui/mock-components";
import { Loader2, TrendingUp, TrendingDown, Users, Activity, AlertTriangle } from "lucide-react";

export function AnalyticsDashboard() {
  const [data, setData] = useState<BiOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BiService.getOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="text-center text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Business Intelligence 📊</h1>
          <Button variant="outline">Baixar Relatório Executivo</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Lucro Líquido</h3>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">R$ {data.finance.netProfit.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">+20.1% em relação ao mês anterior</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Projetos Ativos</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{data.ops.active}</div>
          <p className="text-xs text-muted-foreground">de {data.ops.total} projetos totais</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Despesas</h3>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">R$ {data.finance.expenses.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Custo Operacional</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Eficiência</h3>
            <Users className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{data.ops.efficiencyRate}%</div>
          <p className="text-xs text-muted-foreground">SLA de Entrega</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
           <h3 className="text-lg font-semibold mb-4">Insights Automáticos</h3>
           <div className="space-y-4">
               {data.insights.map((insight, idx) => (
                   <div key={idx} className={`p-4 rounded-lg border flex items-start ${insight.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                       {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />}
                       {insight.type === 'success' && <TrendingUp className="h-5 w-5 text-green-600 mr-2 mt-0.5" />}
                       <div>
                           <p className={`text-sm font-medium ${insight.type === 'warning' ? 'text-amber-800' : 'text-green-800'}`}>
                               {insight.message}
                           </p>
                       </div>
                   </div>
               ))}
           </div>
        </Card>
        
        <Card className="p-6 flex items-center justify-center bg-slate-50 border-dashed">
            <div className="text-center">
                <p className="text-muted-foreground mb-2">Gráficos Detalhados (Chart.js)</p>
                <div className="text-xs bg-slate-200 rounded px-2 py-1 inline-block">Em breve na v2.2</div>
            </div>
        </Card>
      </div>
    </div>
  );
}
