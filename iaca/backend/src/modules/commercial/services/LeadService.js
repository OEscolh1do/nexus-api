import { ScoringService } from './ScoringService.js';
import prisma from '../../../lib/prisma.js';
const scoringService = new ScoringService();

export class LeadService {
  /**
   * Updates lead score based on Academy events.
   * @param {string} leadEmail - Email from the academy event payload.
   * @param {string} eventType - 'ACADEMY_ENROLLMENT' | 'ACADEMY_COMPLETION'.
   * @param {string} tenantId - Tenant context.
   */
  async processAcademyEvent(leadEmail, eventType, tenantId) {
    // 1. Tenant Isolation Check
    if (!tenantId) throw new Error("TenantID is mandatory for integrity.");

    return await prisma.$transaction(async (tx) => {
      // 2. Find Lead
      const lead = await tx.lead.findFirst({
        where: { email: leadEmail, tenantId }
      });

      if (!lead) {
        console.warn(`[LeadService] Ignored event for ${leadEmail} (Not found in tenant ${tenantId})`);
        return null;
      }

      // 3. Calculate Score
      const scoreDelta = scoringService.getScoreDelta(eventType);
      if (scoreDelta === 0) return lead; // No score change

      const newScore = (lead.academyScore || 0) + scoreDelta;

      // 4. Auto-Promotion Logic
      let updateData = {
        academyScore: newScore,
        interactions: {
          create: {
            type: 'ACADEMY_EVENT',
            content: `Event: ${eventType} (+${scoreDelta} pts)`,
            authorId: '00000000-0000-0000-0000-000000000000' // System ID
          }
        }
      };

      if (scoringService.shouldPromoteToHot(newScore, lead.status)) {
        updateData.status = 'HOT';
        updateData.notes = (lead.notes || '') + '\n[AUTO] Leads > 150 pts are HOT.';

        // Audit Log for Promotion
        await tx.auditLog.create({
          data: {
            userId: '00000000-0000-0000-0000-000000000000',
            action: 'AUTO_PROMOTE_LEAD',
            entity: 'Lead',
            resourceId: lead.id,
            details: `Score reached ${newScore}. Promoted to HOT.`,
            before: { status: lead.status },
            after: { status: 'HOT' }
          }
        });
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: updateData
      });

      console.log(`[LeadService] Lead ${lead.id} updated. Score: ${newScore}`);
      return updatedLead;
    });
  }
}
