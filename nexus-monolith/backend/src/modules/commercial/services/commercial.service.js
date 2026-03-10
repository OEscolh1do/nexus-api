const prisma = require('../../../lib/prisma');
const { withTenant } = require('../../../lib/prisma');
const AppError = require("../../../utils/AppError");

class CommercialService {

  // --- LEADS ---

  async createLead(data, userId) {
    try {
      const { city, state, academyOrigin, technicalProfile, ...rest } = data;
      return await withTenant(async (tx) => {
        return tx.lead.create({
          data: {
            ...rest,
            city,
            state,
            academyOrigin,
            technicalProfile: technicalProfile || undefined,
            ownerId: userId,
            status: rest.status || "NEW"
          }
        });
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError("Erro ao criar Lead", 500);
    }
  }

  async getLeads(filters = {}) {
    return await withTenant(async (tx) => {
      return tx.lead.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { fullName: true, username: true } },
          mission: { select: { name: true, region: true } },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
    });
  }

  async getKanbanStats(tenantId) {
    try {
      return await withTenant(async (tx) => {
        // 1. Total de Leads Brutos
        const totalLeads = await tx.lead.count();

        // 2. Agrupamento de Oportunidades por Status (Funil)
        const funnelGroups = await tx.opportunity.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: { estimatedValue: true },
          where: { tenantId }
        });

        // 3. Receita Total (Soma de todos os ganhos)
        const closedWon = await tx.opportunity.aggregate({
          _sum: { estimatedValue: true },
          _count: { id: true },
          where: {
            tenantId,
            status: 'CLOSED_WON'
          }
        });

        // Formatação final para o Front-End
        return {
          totalLeads,
          funnelData: funnelGroups,
          revenue: {
            total: closedWon._sum.estimatedValue || 0,
            count: closedWon._count.id || 0
          }
        };
      });
    } catch (e) {
      console.error(e);
      throw new AppError("Erro ao calcular estatísticas", 500);
    }
  }

  async updateLead(id, data) {
    try {
      return await withTenant(async (tx) => {
        return tx.lead.update({
          where: { id },
          data
        });
      });
    } catch (error) {
      if (error.code === 'P2025') throw new AppError("Lead não encontrado", 404);
      throw new AppError("Erro ao atualizar Lead", 500);
    }
  }

  async getLeadDetails(id) {
    const lead = await withTenant(async (tx) => {
      return tx.lead.findUnique({
        where: { id },
        include: {
          interactions: { orderBy: { createdAt: 'desc' } },
          Opportunity: true,
          mission: true,
          owner: { select: { fullName: true } }
        }
      });
    });

    if (!lead) throw new AppError("Lead não encontrado", 404);
    return lead;
  }

  // --- INTERACTIONS ---

  async addInteraction(leadId, userId, { type, content }) {
    try {
      return await withTenant(async (tx) => {
        return tx.leadInteraction.create({
          data: {
            leadId,
            authorId: userId,
            type: type || 'NOTE',
            content
          }
        });
      });
    } catch (e) {
      throw new AppError("Erro ao adicionar interação", 500);
    }
  }

  // --- MISSIONS ---

  async createMission(data, userId) {
    try {
      return await withTenant(async (tx) => {
        return tx.mission.create({
          data: {
            ...data,
            coordinatorId: userId,
            status: data.status || 'PLANNED'
          }
        });
      });
    } catch (e) {
      throw new AppError("Erro ao criar missão", 500);
    }
  }

  // --- OPPORTUNITIES (DEALS) GUARDRAILS ---

  async createOpportunity(data, tenantId) {
    try {
      return await withTenant(async (tx) => {
        // Enforce lead exists and attach tenant
        const lead = await tx.lead.findUnique({ where: { id: data.leadId } });
        if (!lead) throw new AppError("Lead não encontrado", 404);

        return tx.opportunity.create({
          data: {
            ...data,
            tenantId
          }
        });
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError("Erro ao criar oportunidade", 500);
    }
  }

  async getOpportunities(filters = {}, tenantId) {
    return await withTenant(async (tx) => {
      return tx.opportunity.findMany({
        where: { ...filters, tenantId },
        include: {
          lead: { select: { name: true, phone: true, city: true, engagementScore: true } },
          technicalProposal: true
        },
        orderBy: { updatedAt: 'desc' }
      });
    });
  }

  async updateOpportunity(id, data, userId) {
    return await withTenant(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({
        where: { id },
        include: { lead: true, technicalProposal: true }
      });

      if (!opportunity) throw new AppError("Oportunidade não encontrada", 404);

      // --- GUARDRAILS (BUSINESS RULES) ---
      if (data.status && data.status !== opportunity.status) {
        if (data.status === 'VISIT_SCHEDULED') {
          // Rule: To schedule a technical visit, the lead must be qualified with enough info
          if (opportunity.lead.engagementScore < 20) {
            throw new AppError("Guardrail: O Lead não tem pontuação mínima (20) para agendar visita. Complete os dados do cliente.", 403);
          }
        }

        if (data.status === 'PROPOSAL_GENERATED') {
          // Rule: Engineering Validation required
          if (!opportunity.technicalProposalId) {
            throw new AppError("Guardrail: Proposta Técnica exigida antes de avançar para 'Proposta Gerada'.", 403);
          }
        }
      }

      try {
        const updated = await tx.opportunity.update({
          where: { id },
          data
        });

        // Audit Trail implementation
        await tx.auditLog.create({
          data: {
            userId,
            action: 'OPPORTUNITY_UPDATED',
            entity: 'Opportunity',
            resourceId: id,
            details: `Alterado de ${opportunity.status} para ${data.status || opportunity.status}`,
            tenantId: opportunity.tenantId
          }
        });

        return updated;
      } catch (error) {
        throw new AppError("Erro ao atualizar a Oportunidade", 500);
      }
    });
  }

  async getMissions(filters = {}) {
    return await withTenant(async (tx) => {
      return tx.mission.findMany({
        where: filters,
        include: {
          _count: { select: { leads: true } },
          coordinator: { select: { fullName: true } }
        },
        orderBy: { startDate: 'asc' }
      });
    });
  }

  async assignLeadToMission(leadId, missionId) {
    try {
      return await withTenant(async (tx) => {
        return tx.lead.update({
          where: { id: leadId },
          data: { missionId }
        });
      });
    } catch (e) {
      throw new AppError("Erro ao atribuir missão", 500);
    }
  }

  // --- DASHBOARD / ACTIVITIES ---

  async getRecentActivities(tenantId) {
    return await withTenant(async (tx) => {
      const activities = await tx.auditLog.findMany({
        where: {
          tenantId,
          entity: { in: ['Opportunity', 'Lead', 'Mission'] }
        },
        orderBy: { timestamp: 'desc' },
        take: 15,
        include: {
          user: { select: { fullName: true } }
        }
      });
      return activities;
    });
  }

  // --- PROPOSALS / PIPELINE ---

  async getPipeline(orgUnitId) {
    if (!orgUnitId) throw new AppError("OrgUnit (Tenant Context) ignorado.", 403);

    return await withTenant(async (tx) => {
      const pipeline = await tx.pipeline.findFirst({
        where: { type: 'SALES', orgUnitId },
        include: { stages: { orderBy: { order: 'asc' } } }
      });
      return pipeline || { stages: [] };
    });
  }

  // --- CONTRACTS ---

  async getContracts(tenantId) {
    return await withTenant(async (tx) => {
      // Retorna todos os contratos que pertencem a projetos do locatário (tenant)
      return tx.contract.findMany({
        where: {
          project: {
            tenantId
          }
        },
        include: {
          project: { select: { title: true } },
          vendor: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  }

}

module.exports = new CommercialService();
