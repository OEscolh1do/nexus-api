const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AppError = require("../../../utils/AppError");

class CommercialService {
  
  // --- LEADS ---

  async createLead(data, userId) {
    try {
        const { city, state, academyOrigin, technicalProfile, ...rest } = data;
        return await prisma.lead.create({
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
    } catch (e) {
        throw new AppError("Erro ao criar Lead", 500);
    }
  }

  async getLeads(filters = {}) {
    return await prisma.lead.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { fullName: true, username: true } },
        proposals: { select: { id: true, name: true, totalValue: true, status: true } },
        mission: { select: { title: true, region: true } },
        interactions: { 
          orderBy: { createdAt: 'desc' },
          take: 1 
        } 
      }
    });
  }

  async getKanbanStats() {
    try {
        const stats = await prisma.lead.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: { engagementScore: true }
        });
        return stats;
    } catch (e) {
         throw new AppError("Erro ao calcular estatísticas", 500);
    }
  }

  async updateLead(id, data) {
    try {
        const lead = await prisma.lead.update({
          where: { id },
          data
        });
        return lead;
    } catch (error) {
        if (error.code === 'P2025') throw new AppError("Lead não encontrado", 404);
        throw new AppError("Erro ao atualizar Lead", 500);
    }
  }

  async getLeadDetails(id) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        interactions: { orderBy: { createdAt: 'desc' } },
        proposals: true,
        mission: true,
        owner: { select: { fullName: true } }
      }
    });
    
    if (!lead) throw new AppError("Lead não encontrado", 404);
    return lead;
  }

  // --- INTERACTIONS ---

  async addInteraction(leadId, userId, { type, content }) {
    try {
        return await prisma.leadInteraction.create({
          data: {
            leadId,
            authorId: userId,
            type: type || 'NOTE', 
            content
          }
        });
    } catch (e) {
        throw new AppError("Erro ao adicionar interação", 500);
    }
  }

  // --- MISSIONS ---

  async createMission(data, userId) {
    try {
        return await prisma.mission.create({
          data: {
            ...data,
            coordinatorId: userId,
            status: data.status || 'PLANNED'
          }
        });
    } catch (e) {
        throw new AppError("Erro ao criar missão", 500);
    }
  }

  async getMissions(filters = {}) {
    return await prisma.mission.findMany({
      where: filters,
      include: {
        _count: { select: { leads: true } },
        coordinator: { select: { fullName: true } }
      },
      orderBy: { startDate: 'asc' }
    });
  }

  async assignLeadToMission(leadId, missionId) {
    try {
        return await prisma.lead.update({
          where: { id: leadId },
          data: { missionId }
        });
    } catch (e) {
        throw new AppError("Erro ao atribuir missão", 500);
    }
  }

  // --- PROPOSALS / PIPELINE ---

  async getPipeline() {
    const pipeline = await prisma.pipeline.findFirst({
      where: { type: 'SOLAR' },
      include: { stages: { orderBy: { order: 'asc' } } }
    });
    return pipeline || { stages: [] }; 
  }

  async createProposal(leadId, proposalPayload) {
    try {
        const { clientName, systemSize, paybackYears, monthlySavings, resumo_financeiro } = proposalPayload;

        return await prisma.solarProposal.create({
          data: {
            leadId,
            name: `Proposta Solar - ${clientName || 'Nova'}`,
            status: "DRAFT",
            systemSize: Number(systemSize) || 0,
            paybackYears: Number(paybackYears) || 0,
            monthlySavings: Number(monthlySavings) || 0,
            totalValue: Number(resumo_financeiro?.investimento_total_referencia) || 0,
            proposalData: proposalPayload
          }
        });
    } catch (e) {
        console.error(e);
        throw new AppError("Erro ao criar proposta", 500);
    }
  }
}

module.exports = new CommercialService();
