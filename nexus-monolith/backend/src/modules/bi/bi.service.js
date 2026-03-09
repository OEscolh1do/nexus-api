const prisma = require('../../lib/prisma');
const { withTenant } = require('../../lib/prisma');
const FinService = require("../fin/services/fin.service");
const AppError = require("../../utils/AppError");

const BiService = {
  /**
   * Aggregates operational and financial data for executive overview.
   * Project counts use withTenant for tenant isolation.
   */
  async getOverview() {
    try {
      // 1. Ops KPIs (tenant-isolated via withTenant)
      const opsData = await withTenant(async (tx) => {
        const [totalProjects, activeProjects, completedProjects] = await Promise.all([
          tx.project.count(),
          tx.project.count({ where: { status: { not: 'CONCLUIDO' } } }),
          tx.project.count({ where: { status: 'CONCLUIDO' } })
        ]);
        return { totalProjects, activeProjects, completedProjects };
      });

      // 2. Financial KPIs
      const balance = await FinService.getBalance();

      // 3. Efficiency
      const avgCostPerProject = opsData.completedProjects > 0
        ? balance.expenses / opsData.completedProjects
        : 0;

      return {
        ops: {
          total: opsData.totalProjects,
          active: opsData.activeProjects,
          completed: opsData.completedProjects,
          efficiencyRate: 95 // Hardcoded MVP
        },
        finance: {
          revenue: balance.income,
          expenses: balance.expenses,
          netProfit: balance.total,
          avgTicket: 0
        },
        insights: [
          { type: 'warning', message: '3 Projetos atrasados na fase de Instalação.' },
          { type: 'success', message: 'Faturamento superou a meta em 15%.' }
        ]
      };

    } catch (error) {
      console.error("[BiService] Failed to aggregate data:", error);
      throw new AppError("Erro ao agregar dados de BI", 500);
    }
  }
};

module.exports = BiService;
