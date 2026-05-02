const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PredictiveService {

    /**
     * Calcula o "Capacity Vortex" para os próximos X meses,
     * cruzando Oportunidades em Final de Funil (CRM) vs Tarefas Operacionais (Engenharia).
     * 
     * @param {string} tenantId - ID do Tenant para governança RLS estrita
     * @param {number} monthsAhead - Horizonte de previsão preditiva
     * @returns {Object} Dados agregados estruturados para plotar as colunas (Heatmap Empilhado)
     */
    async getCapacityVortex(tenantId, monthsAhead = 6) {
        const today = new Date();
        const monthsData = [];

        for (let i = 0; i < monthsAhead; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthLabel = targetDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

            monthsData.push({
                label: monthLabel,
                year: targetDate.getFullYear(),
                month: targetDate.getMonth(),
                plannedTasks: 0,
                predictiveTasks: 0,
                totalCapacityLimit: 0
            });
        }

        // 1. CAPACIDADE TETO (TÁTICA): Quantas tarefas a empresa consegue entregar?
        const engineersCount = await prisma.user.count({
            where: {
                tenantId: tenantId,
                role: { in: ['ENGINEER', 'INSTALLER', 'MANAGER'] } // Assumindo base produtiva
            }
        });
        const baselineCapacity = (engineersCount > 0 ? engineersCount : 1) * 15;
        monthsData.forEach(m => m.totalCapacityLimit = baselineCapacity);


        // 2. DEMANDA REAL (GANTT CONFIRMADO): Offload via SQL Aggregation
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 1);

        // Security Patch: JOIN. Eliminates cross-tenant data leaks.
        // Timezone Patch: AT TIME ZONE para evitar drift do UTC.
        // Using Sao_Paulo as the default timezone for Neornorte for this phase.
        const tasksByMonth = await prisma.$queryRaw`
            SELECT 
                CAST(EXTRACT(YEAR FROM t."dueDate" AT TIME ZONE 'America/Sao_Paulo') AS INTEGER) as year,
                CAST(EXTRACT(MONTH FROM t."dueDate" AT TIME ZONE 'America/Sao_Paulo') AS INTEGER) - 1 as month,
                CAST(COUNT(t.id) AS INTEGER) as "count"
            FROM "OperationalTask" t
            INNER JOIN "User" u ON t."assignedTo" = u.id
            WHERE t."status" NOT IN ('COMPLETED', 'CANCELED')
              AND u."tenantId" = ${tenantId}
              AND t."dueDate" >= ${startDate}
              AND t."dueDate" < ${endDate}
            GROUP BY year, month
        `;

        tasksByMonth.forEach(row => {
            const bucket = monthsData.find(m => m.month === row.month && m.year === row.year);
            if (bucket) {
                bucket.plannedTasks += row.count;
            }
        });

        // 3. DEMANDA PREDITIVA (CRM FINAL DE FUNIL): Offload Summation ao Postgres
        const workloadMultiplier = 6.0;

        // Sum((prob / 100) * multiplier) direto no motor de banco de dados
        const oppAggregation = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM(("probability" / 100.0) * ${workloadMultiplier}), 0) as "predictedTasks"
            FROM "Opportunity"
            WHERE "tenantId" = ${tenantId}
              AND "status" IN ('NEGOTIATION', 'CONTRACT_SENT', 'PROPOSAL_GENERATED')
              AND "probability" >= 30
        `;

        let totalPredictedTasks = Number(oppAggregation[0]?.predictedTasks || 0);

        // Defesa QA: Garantir integridade matemática para não quebrar a UI Recharts com SVG NaN errors
        if (Number.isNaN(totalPredictedTasks)) totalPredictedTasks = 0;

        // Projetamos na escala do tempo
        if (monthsData[1]) {
            monthsData[1].predictiveTasks += (totalPredictedTasks * 0.4);
        }
        if (monthsData[2]) {
            monthsData[2].predictiveTasks += (totalPredictedTasks * 0.6);
        }

        // 4. RETORNO RENDERIZÁVEL
        return monthsData.map(m => {
            const riskRatio = ((m.plannedTasks + m.predictiveTasks) / m.totalCapacityLimit) * 100;
            return {
                name: m.label,
                RealData: Math.floor(m.plannedTasks),
                Preditivo: Math.floor(m.predictiveTasks),
                CapacityLimit: m.totalCapacityLimit,
                isBottleneck: riskRatio >= 100,
                isWarning: riskRatio >= 85 && riskRatio < 100
            };
        });
    }

}

module.exports = new PredictiveService();
