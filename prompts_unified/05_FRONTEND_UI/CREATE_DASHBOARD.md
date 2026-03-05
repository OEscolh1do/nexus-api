# 📊 Criar Dashboard com Widgets - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa criar um dashboard modular com widgets reutilizáveis para visualização de dados (KPIs, gráficos, tabelas).
>
> **⏱️ Tempo Estimado:** 40-50 minutos

---

## 📖 Exemplo Real: Dashboard do Módulo BI

O módulo BI do Neonorte | Nexus usa dashboards com widgets para visualizar métricas de negócio.

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Frontend Engineer especializado em Data Visualization.

  Stack:
  - React 19.2 + TypeScript
  - Recharts (gráficos)
  - TailwindCSS
  - Shadcn/UI
</system_role>

<mission>
  Criar dashboard com widgets para: {{NOME_DO_DASHBOARD}}

  Exemplo: "Dashboard executivo com KPIs de projetos e vendas"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/frontend/src/modules/{{modulo}}/" />
  <reference path="nexus-monolith/frontend/src/modules/bi/" description="Exemplo de dashboard" />
</nexus_context>

<dashboard_specification>
  **Nome do Dashboard:** {{NOME}}
  **Widgets:**
  1. {{WIDGET_1}}: {{TIPO}} - {{DADOS}}
  2. {{WIDGET_2}}: {{TIPO}} - {{DADOS}}
  3. {{WIDGET_3}}: {{TIPO}} - {{DADOS}}

  **Layout:** {{GRID|FLEX|CUSTOM}}
  **Responsivo:** {{SIM|NAO}}
  **Refresh:** {{MANUAL|AUTO|TEMPO_EM_SEGUNDOS}}
</dashboard_specification>

<execution_protocol>
  1. **Criar Tipos TypeScript:**
     - Interfaces para dados de cada widget
     - Props dos widgets

  2. **Criar Widgets Reutilizáveis:**
     - KPIWidget (número + label + trend)
     - ChartWidget (gráficos Recharts)
     - TableWidget (tabela de dados)
     - StatWidget (estatística simples)

  3. **Criar Dashboard View:**
     - Layout responsivo (Grid)
     - Fetch de dados
     - Loading states
     - Error handling

  4. **Implementar Refresh:**
     - Manual (botão)
     - Automático (polling)

  5. **Adicionar Filtros (Opcional):**
     - Date range
     - Filtros customizados
</execution_protocol>

<expected_output>
  1. Tipos TypeScript completos
  2. Widgets reutilizáveis
  3. Dashboard view funcional
  4. Integração com API
  5. Exemplo de uso
</expected_output>
```

---

## 📝 Implementação Passo-a-Passo

### 1. Tipos TypeScript

```typescript
// types/dashboard.ts
export interface KPIData {
  label: string;
  value: number | string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  icon?: React.ComponentType;
  color?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TableData {
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  rows: Record<string, any>[];
}

export interface DashboardData {
  kpis: KPIData[];
  charts: {
    sales: ChartData[];
    projects: ChartData[];
  };
  recentActivity: TableData;
}
```

### 2. Widget: KPI Card

```tsx
// components/widgets/KPIWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIData } from "../../types/dashboard";

interface KPIWidgetProps {
  data: KPIData;
  loading?: boolean;
}

export function KPIWidget({ data, loading }: KPIWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = data.trend
    ? data.trend.direction === "up"
      ? TrendingUp
      : data.trend.direction === "down"
        ? TrendingDown
        : Minus
    : null;

  const trendColor =
    data.trend?.direction === "up"
      ? "text-green-600"
      : data.trend?.direction === "down"
        ? "text-red-600"
        : "text-gray-600";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{data.value}</div>
            {data.trend && (
              <div
                className={`flex items-center gap-1 text-sm ${trendColor} mt-1`}
              >
                {TrendIcon && <TrendIcon className="w-4 h-4" />}
                <span>{data.trend.percentage}%</span>
              </div>
            )}
          </div>
          {data.icon && (
            <data.icon className={`w-8 h-8 ${data.color || "text-gray-400"}`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Widget: Chart

```tsx
// components/widgets/ChartWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartData } from "../../types/dashboard";

interface ChartWidgetProps {
  title: string;
  data: ChartData[];
  type: "bar" | "line" | "pie";
  dataKey?: string;
  xAxisKey?: string;
  loading?: boolean;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function ChartWidget({
  title,
  data,
  type,
  dataKey = "value",
  xAxisKey = "name",
  loading,
}: ChartWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#3B82F6" />
            </BarChart>
          )}

          {type === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          )}

          {type === "pie" && (
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 4. Widget: Table

```tsx
// components/widgets/TableWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TableData } from "../../types/dashboard";

interface TableWidgetProps {
  title: string;
  data: TableData;
  loading?: boolean;
}

export function TableWidget({ title, data, loading }: TableWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, index) => (
              <TableRow key={index}>
                {data.columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### 5. Dashboard View Principal

```tsx
// DashboardView.tsx
import { useState, useEffect } from "react";
import {
  RefreshCw,
  Briefcase,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPIWidget } from "./components/widgets/KPIWidget";
import { ChartWidget } from "./components/widgets/ChartWidget";
import { TableWidget } from "./components/widgets/TableWidget";
import type { DashboardData } from "./types/dashboard";
import { toast } from "sonner";

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/v2/bi/dashboard");
      if (!response.ok) throw new Error("Erro ao carregar dashboard");

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const kpis = data?.kpis || [
    {
      label: "Projetos Ativos",
      value: 0,
      icon: Briefcase,
      color: "text-blue-600",
    },
    { label: "Clientes", value: 0, icon: Users, color: "text-green-600" },
    {
      label: "Receita Mensal",
      value: "R$ 0",
      icon: DollarSign,
      color: "text-yellow-600",
    },
    {
      label: "Taxa de Crescimento",
      value: "0%",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-gray-600 mt-1">Visão geral do negócio</p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget key={index} data={kpi} loading={loading} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Vendas Mensais"
          data={data?.charts.sales || []}
          type="bar"
          dataKey="value"
          xAxisKey="month"
          loading={loading}
        />

        <ChartWidget
          title="Projetos por Status"
          data={data?.charts.projects || []}
          type="pie"
          dataKey="count"
          xAxisKey="status"
          loading={loading}
        />
      </div>

      {/* Recent Activity Table */}
      <TableWidget
        title="Atividades Recentes"
        data={data?.recentActivity || { columns: [], rows: [] }}
        loading={loading}
      />
    </div>
  );
}
```

### 6. API Service (Backend)

```javascript
// backend/src/modules/bi/bi.controller.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class BIController {
  static async getDashboard(req, res) {
    try {
      // KPIs
      const activeProjects = await prisma.project.count({
        where: { status: "ATIVO" },
      });

      const totalClients = await prisma.lead.count();

      // Charts - Vendas Mensais
      const salesData = await prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as value
        FROM SolarProposal
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month
      `;

      // Charts - Projetos por Status
      const projectsByStatus = await prisma.project.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      const projectsChart = projectsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      }));

      // Recent Activity
      const recentProjects = await prisma.project.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { manager: { select: { fullName: true } } },
      });

      const dashboardData = {
        kpis: [
          {
            label: "Projetos Ativos",
            value: activeProjects,
            trend: { direction: "up", percentage: 12 },
            color: "text-blue-600",
          },
          {
            label: "Clientes",
            value: totalClients,
            trend: { direction: "up", percentage: 8 },
            color: "text-green-600",
          },
          // ... outros KPIs
        ],
        charts: {
          sales: salesData,
          projects: projectsChart,
        },
        recentActivity: {
          columns: [
            { key: "title", label: "Projeto" },
            { key: "manager", label: "Gerente" },
            { key: "status", label: "Status" },
          ],
          rows: recentProjects.map((p) => ({
            title: p.title,
            manager: p.manager?.fullName || "-",
            status: p.status,
          })),
        },
      };

      res.json({ success: true, data: dashboardData });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = BIController;
```

---

## ✅ Checklist de Verificação

- [ ] **Tipos TypeScript:** Interfaces criadas
- [ ] **KPI Widget:** Funcionando com trend
- [ ] **Chart Widget:** Recharts integrado
- [ ] **Table Widget:** Renderização customizada
- [ ] **Dashboard View:** Layout responsivo
- [ ] **API Integration:** Dados carregando
- [ ] **Loading States:** Skeletons implementados
- [ ] **Error Handling:** Toasts de erro
- [ ] **Auto-Refresh:** Polling funcionando
- [ ] **Manual Refresh:** Botão atualizar
- [ ] **Responsivo:** Grid adaptativo

---

## 🎨 Variações e Melhorias

### Filtros de Data

```tsx
import { DateRangePicker } from "@/components/ui/date-range-picker";

const [dateRange, setDateRange] = useState({
  from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  to: new Date(),
});

<DateRangePicker value={dateRange} onChange={setDateRange} />;
```

### Export para PDF/Excel

```tsx
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const exportToPDF = () => {
  const doc = new jsPDF();
  // Adicionar conteúdo
  doc.save("dashboard.pdf");
};

const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(data.rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
  XLSX.writeFile(wb, "dashboard.xlsx");
};
```

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_02_ENGINEER.md`
- **Backend:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
- **Filtros:** `03_FRONTEND_UI/ADD_ADVANCED_FILTERS.md`
