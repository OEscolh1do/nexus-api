import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class DashboardController {
  async getMetrics(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'ADMIN') {
         return res.status(403).json({ error: 'Acesso negado' });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Totalizadores Gerais
      const totalProjects = await prisma.project.count();
      
      // 2. Agrupamento por Status
      const byStatus = await prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { price: true } 
      });

      // 3. Projetos Estagnados (Atenção) - Ignora Fechados/Arquivados
      const stagnantProjects = await prisma.project.findMany({
        where: { status: { notIn: ['CLOSED', 'DONE', 'REJECTED'] } },
        orderBy: { createdAt: 'asc' },
        take: 5,
        select: { 
            id: true, title: true, status: true, createdAt: true, 
            client: { select: { name: true } } 
        }
      });

      // 4. Vendas Recentes (Últimos 30 dias)
      const recentSales = await prisma.project.findMany({
          where: {
              status: { in: ['CLOSED', 'DONE', 'APPROVED'] },
              updatedAt: { gte: thirtyDaysAgo }
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
              id: true, title: true, price: true, updatedAt: true,
              client: { select: { name: true } }
          }
      });

      // 5. Cálculos de KPI
      const activeStatuses = ['CONTACT', 'BUDGET', 'WAITING', 'READY', 'EXECUTION', 'REVIEW'];
      const pipelineValue = byStatus
        .filter(g => activeStatuses.includes(g.status))
        .reduce((acc, curr) => acc + (curr._sum.price || 0), 0);

      const closedStats = byStatus.filter(s => ['CLOSED', 'DONE', 'APPROVED'].includes(s.status));
      const closedValue = closedStats.reduce((acc, curr) => acc + (curr._sum.price || 0), 0);
      const closedCount = closedStats.reduce((acc, curr) => acc + (curr._count.id || 0), 0);
      
      const conversionRate = totalProjects > 0 ? ((closedCount / totalProjects) * 100).toFixed(1) : 0;

      // 6. Formatação para Gráficos
      const statusLabels: Record<string, string> = {
          'CONTACT': 'Qualificação',
          'BUDGET': 'Orçamento',
          'WAITING': 'Ag. Aprovação',
          'APPROVED': 'Venda/Eng.',
          'EXECUTION': 'Em Obra',
          'DONE': 'Concluído'
      };

      const funnelData = Object.keys(statusLabels).map(key => {
          const found = byStatus.find(s => s.status === key);
          return { 
              name: statusLabels[key], 
              value: found?._count.id || 0,
              revenue: found?._sum.price || 0,
              fill: ['DONE', 'APPROVED'].includes(key) ? '#05CD46' : undefined 
          };
      });

      res.json({
        kpis: { totalProjects, pipelineValue, closedValue, conversionRate, closedCount },
        funnelData,
        stagnantProjects,
        recentSales
      });

    } catch (error) {
      console.error('ERRO DASHBOARD:', error);
      res.status(500).json({ error: 'Erro ao calcular métricas' });
    }
  }
}
