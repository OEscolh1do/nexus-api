/**
 * Executive Module Service
 * Handles data aggregation for the strategic executive dashboard.
 */
const prisma = require("../../../lib/prisma"); // Assuming this is needed in the future

class ExecutiveService {
    /**
     * getMetrics
     * Returns aggregated high-level business metrics.
     * Scaffolding: Returns mocked datastructures mapped to the ideal vision.
     * @route GET /api/v2/executive/metrics
     */
    async getMetrics() {
        return prisma.withTenant(async (tx) => {
            // Count Projects
            const totalProjects = await tx.project.count({ where: { status: { not: 'COMPLETED' } } });
            
            // Calculate Global OKR Progress
            const keyResults = await tx.keyResult.findMany({ select: { targetValue: true, currentValue: true } });
            
            let globalOkrProgress = 0;
            if (keyResults.length > 0) {
               const progresses = keyResults.map(kr => {
                   if (kr.targetValue === 0) return 0;
                   const pct = (kr.currentValue / kr.targetValue) * 100;
                   return Math.min(pct, 100);
               });
               globalOkrProgress = progresses.reduce((acc, curr) => acc + curr, 0) / progresses.length;
            }

            // Simple mocked fallbacks for metrics that don't have modules built yet
            return {
                conversionRate: 15.2, // Need Commercial
                averageTicket: 120500.0, // Need Commercial
                activeProjects: totalProjects,
                onTimeDeliveryRate: 83.5, // Need advanced project timeline logic
                teamUtilization: 76.0,   // Need Resource Management
                qualityIndex: 96.2,      // Need Inspection data
                strategyAlignment: globalOkrProgress // REAL METRIC
            };
        });
    }

    /**
     * getPortfolioHealth
     * Returns a rolled-up view of all active operations and their risks.
     * @route GET /api/v2/executive/portfolio-health
     */
    async getPortfolioHealth() {
        return prisma.withTenant(async (tx) => {
            const projects = await tx.project.findMany({ select: { status: true }});
            
            const onTrack = projects.filter(p => !['ATRASADO', 'RISCO_CRITICO'].includes(p.status)).length;
            const atRisk = projects.filter(p => p.status === 'RISCO_CRITICO').length;
            const delayed = projects.filter(p => p.status === 'ATRASADO').length;

            const criticalRisksCount = await tx.risk.count({
               where: {
                  status: 'OPEN',
                  probability: 'HIGH',
                  impact: 'HIGH'
               }
            });

            return {
                statusOverview: {
                    onTrack,
                    atRisk,
                    delayed
                },
                criticalRisks: criticalRisksCount,
                totalBudgetVariance: -2.5, // Scaffold
                totalScheduleVariance: +5.0 // Scaffold
            };
        });
    }
}

module.exports = new ExecutiveService();
