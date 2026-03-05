import { PrismaClient } from '@prisma/client';
import { UpdateDealStatusSchema } from '../validators/deal.js';
import { emitDealWon } from '../events/handlers.js';

const prisma = new PrismaClient();

export class CommercialService {
  
  /**
   * Specialized handler for Closing Deals (Handover Protocol).
   * Validates technical integrity and triggers Ops handoff.
   * @param {String} dealId 
   * @param {String} tenantId 
   * @param {String} userId 
   */
  async handleDealWon(dealId, tenantId, userId) {
     return this.updateDealStatus(dealId, { status: 'CLOSED_WON' }, userId, tenantId);
  }

  /**
   * Updates a Deal status with strict logic.
   * @param {String} dealId 
   * @param {Object} updateData 
   * @param {String} userId 
   * @param {String} tenantId 
   */
  async updateDealStatus(dealId, updateData, userId, tenantId) {
    const validationResult = UpdateDealStatusSchema.safeParse(updateData);
    if (!validationResult.success) {
      throw new Error(`Validation Error: ${JSON.stringify(validationResult.error.format())}`);
    }

    const { status, technicalProposal } = validationResult.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Context
      const currentDeal = await tx.opportunity.findUnique({
        where: { id: dealId },
        include: { technicalProposal: true, lead: true }
      });

      if (!currentDeal || currentDeal.tenantId !== tenantId) {
        throw new Error("Deal not found or access denied.");
      }

      // 2. Handover Protocol (Guardrails)
      if (status === 'CLOSED_WON') {
        const proposal = currentDeal.technicalProposal;
        
        // effective state calculation
        const effectiveTp = {
            validatedByEng: technicalProposal?.validatedByEng ?? proposal?.validatedByEng,
            infrastructurePhotos: technicalProposal?.infrastructurePhotos ?? proposal?.infrastructurePhotos ?? []
        };

        if (!effectiveTp.validatedByEng) {
             throw new Error("BusinessRuleError: Handover rejeitado. Validação de Engenharia pendente.");
        }

        const photoCount = Array.isArray(effectiveTp.infrastructurePhotos) ? effectiveTp.infrastructurePhotos.length : 0;
        if (photoCount < 3) {
             throw new Error(`BusinessRuleError: Handover rejeitado. Vistoria Digital incompleta (${photoCount}/3 fotos).`);
        }
      }

      // 3. Update Data
      let tpUpdate = undefined;
      if (technicalProposal && currentDeal.technicalProposalId) {
          tpUpdate = {
              update: {
                  validatedByEng: technicalProposal.validatedByEng,
                  infrastructurePhotos: technicalProposal.infrastructurePhotos
              }
          };
      }

      const updatedDeal = await tx.opportunity.update({
        where: { id: dealId },
        data: {
          status: status,
          technicalProposal: tpUpdate
        },
        include: {
          lead: true,
          technicalProposal: true
        }
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_DEAL_STATUS',
          entity: 'Opportunity',
          resourceId: dealId,
          details: `Status -> ${status}`,
          before: { status: currentDeal.status },
          after: { status: status }
        }
      });

      return updatedDeal;
    });

    // 5. Emit Event (Outside Transaction to avoid side-effects if TX fails)
    if (result.status === 'CLOSED_WON') {
      emitDealWon(result);
    }

    return result;
  }
}
