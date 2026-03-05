const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const FinService = require("../fin/fin.service");
const AppError = require("../../utils/AppError");

const BiService = {
  /**
   * Aggregates operational and financial data for executive overview.
   */
  async getOverview() {
    try {
      // 1. Ops KPIs
      const [totalProjects, activeProjects, completedProjects] = await prisma.$transaction([
          prisma.project.count(),
          prisma.project.count({ where: { status: { not: 'CONCLUIDO' } } }),
          prisma.project.count({ where: { status: 'CONCLUIDO' } })
      ]);
      
      // 2. Financial KPIs
      // Use FinService but assume it might fail safely or we propagate error?
      // For BI, better to fail fast or return partial? Let's propagate for now.
      const balance = await FinService.getBalance();

      // 3. Efficiency (Mock logic for now)
      const avgCostPerProject = completedProjects > 0 
        ? balance.expenses / completedProjects 
        : 0;

      return {
          ops: {
              total: totalProjects,
              active: activeProjects,
              completed: completedProjects,
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
