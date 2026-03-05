import React, { useState, useEffect } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";

import { WorkloadUser } from "@/types/ops";

// Mock do axios se não estiver configurado globalmente (mas deve estar)
// import api from "@/lib/api"; 

const WorkloadView: React.FC = () => {
  const [data, setData] = useState<WorkloadUser[]>([]);
  const [filters] = useState({
    startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    endDate: ''
  });

  useEffect(() => {
    fetchWorkload();
  }, []);

  const fetchWorkload = async () => {
    try {
      // Ensure we hit the V2 endpoint
      const token = localStorage.getItem("token");
      const response = await axios.get(\`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/ops/workload\`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching workload", error);
      // alert("Erro ao carregar dados de workload");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERLOAD': return 'bg-red-500 hover:bg-red-600';
      case 'HIGH': return 'bg-orange-500 hover:bg-orange-600';
      case 'OPTIMAL': return 'bg-green-500 hover:bg-green-600';
      case 'UNDER': return 'bg-gray-400 hover:bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Gestão de Carga (Workload)</h2>
          <p className="text-muted-foreground">Visão geral da capacidade da equipe e alocação de recursos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWorkload}>Atualizar</Button>
          {/* Date Picker Placeholder */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.reduce((acc, user) => acc + user.totalHours, 0).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Alocadas no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Sobrecarregada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.filter(u => u.status === 'OVERLOAD').length}
            </div>
            <p className="text-xs text-muted-foreground">Utilização &gt; 120%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidade vs. Alocação</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="userName" type="category" width={150} tick={{ fontSize: 12 }} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as WorkloadUser;
                    return (
                      <div className="bg-white p-2 border rounded shadow text-sm">
                        <p className="font-bold">{d.userName}</p>
                        <p>Horas: {d.totalHours}h</p>
                        <p>Utilização: {d.utilization}%</p>
                        <p>Status: {d.status}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="utilization" name="Utilização (%)" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.status === 'OVERLOAD' ? '#ef4444' :
                      entry.status === 'HIGH' ? '#f97316' :
                        entry.status === 'OPTIMAL' ? '#22c55e' : '#94a3b8'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Membro</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Tarefas</TableHead>
                <TableHead>Total Horas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.userRole}</TableCell>
                  <TableCell>{user.taskCount}</TableCell>
                  <TableCell>{user.totalHours}h</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkloadView;
