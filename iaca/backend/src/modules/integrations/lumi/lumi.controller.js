const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const lumiController = {
  // Retorna os Leads do Tenant logado
  getClients: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;

      const clients = await prisma.lead.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          company: true,
          status: true,
          phone: true,
          email: true,
          value: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json(clients);
    } catch (error) {
      console.error('[Lumi Integration] Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Falha ao buscar clientes para o Lumi.' });
    }
  },

  // Recebe um Projeto Gerado e insere no Banco do Nexus
  receiveProposal: async (req, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { 
        leadId, 
        systemSizeKwp, 
        totalInvestment, 
        moduleCount, 
        inverterCount, 
        notes 
      } = req.body;

      if (!leadId) {
        return res.status(400).json({ error: 'ID do Cliente (leadId) é obrigatório.' });
      }

      // 1. Verificar se o Lead existe e pertence ao Tenant
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, tenantId }
      });

      if (!lead) {
        return res.status(404).json({ error: 'Cliente não encontrado no Nexus.' });
      }

      // 2. Criar a "Oportunidade/Projeto" no Nexus baseado no Lumi
      // Como a arquitetura aceita Projects (tipo SOLAR)
      const newProject = await prisma.project.create({
        data: {
          name: `Usina Solar - ${lead.name}`,
          type: 'SOLAR',
          status: 'PLANNING',
          tenantId,
          // Relacionar o lead ou clientId, aqui supomos uma amarração de negócio local.
          // Isso requer verificar no seu schema onde guardamos o "ClientId" do Project.
          budget: totalInvestment || 0,
          description: `Projeto Fotovoltaico via Lumi. \nPotência: ${systemSizeKwp} kWp\nMódulos: ${moduleCount}\nInversores: ${inverterCount}\nNotas: ${notes || ''}`,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Duração estimada 1 mes
        }
      });

      res.status(201).json({ 
        message: 'Projeto Integrado com Sucesso', 
        project: newProject 
      });

    } catch (error) {
      console.error('[Lumi Integration] Erro ao receber proposta:', error);
      res.status(500).json({ error: 'Falha ao processar proposta oriunda do Lumi.' });
    }
  }
};

module.exports = lumiController;
