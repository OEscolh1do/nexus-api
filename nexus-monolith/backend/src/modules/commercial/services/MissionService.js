import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MissionService {
  /**
   * Calculates the total potential value of a Mission based on its Opportunities.
   * @param {string} missionId 
   * @param {string} tenantId
   * @returns {Promise<Object>} { totalEstimatedValue, opportunityCount, logisticsBudgetStatus }
   */
  async calculateMissionPotential(missionId, tenantId) {
    if (!missionId) throw new Error("Mission ID required");

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        opportunities: {
          select: {
            estimatedValue: true,
            status: true
          }
        }
      }
    });

    if (!mission || mission.tenantId !== tenantId) {
      throw new Error("Mission not found");
    }

    // Sum estimated values (Decimal handling required, converted to Number for simplicity in this logic layer, 
    // strictly should use specialized Decimal library or stick to string if precision is critical, usually JS number float is okay for estimates)
    const totalPotential = mission.opportunities.reduce((acc, opp) => {
      // Assuming estimatedValue is Decimal, standard Prisma returns it as Decimal object or string depending on config.
      // We'll cast to number safely.
      return acc + Number(opp.estimatedValue);
    }, 0);

    const logisticsBudget = 5000; // Placeholder / mocked
    const isViable = totalPotential > (logisticsBudget * 3); // Example ROI rule (3x cost)

    return {
      missionId,
      totalEstimatedValue: totalPotential,
      opportunityCount: mission.opportunities.length,
      logisticsBudget,
      isViable,
      viabilityMessage: isViable ? "Missão viável (ROI > 3x)" : "Atenção: Potencial abaixo do ROI esperado."
    };
  }
}
