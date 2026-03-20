import { Activity, DollarSign, Sun, Users } from "lucide-react"
import { KPICard } from "../components/KPICard"

export function DashboardCockpit() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Centro de Comando</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Receita Total" 
          value="R$ 45.231,89" 
          icon={DollarSign} 
          description="+20.1% vs mês anterior"
        />
        <KPICard 
          title="Projetos Ativos" 
          value="+12" 
          icon={Activity} 
          description="4 em fase de instalação"
        />
         <KPICard 
          title="Potência Instalada" 
          value="2.4 MW" 
          icon={Sun} 
          description="+120kW na última semana"
        />
        <KPICard 
          title="Leads no Funil" 
          value="573" 
          icon={Users} 
          description="+201 since last hour"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">Visão Geral de Vendas</h3>
                <p className="text-sm text-muted-foreground">Placeholder para Gráfico (Recharts)</p>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 mt-4 rounded">
                    [AreaChart Placeholder]
                </div>
            </div>
        </div>
         <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">Atividade Recente</h3>
                 <p className="text-sm text-muted-foreground">Últimas 5 propostas</p>
                 <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Residencial Silva</p>
                            <p className="text-sm text-muted-foreground">João Silva - 5kWp</p>
                        </div>
                        <div className="ml-auto font-medium text-neonorte-500">+R$ 12.000</div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  )
}
