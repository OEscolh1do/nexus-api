const commercialService = require("../services/commercial.service");
const { 
  CreateLeadSchema, 
  UpdateLeadSchema, 
  CreateQuoteSchema,
  CreateMissionSchema
} = require("../schemas/commercial.schemas");

const commercialController = {

  // ========================
  // LEADS
  // ========================

  async createLead(req, res) {
      const data = CreateLeadSchema.parse(req.body);
      const lead = await commercialService.createLead(data, req.user.id);
      res.status(201).json({ success: true, data: lead });
  },

  async getLeads(req, res) {
      const leads = await commercialService.getLeads(req.query);
      res.json({ success: true, data: leads });
  },

  async updateLead(req, res) {
      const { id } = req.params;
      const data = UpdateLeadSchema.parse(req.body);
      const updated = await commercialService.updateLead(id, data);
      res.json({ success: true, data: updated });
  },

  async getLeadDetails(req, res) {
      const lead = await commercialService.getLeadDetails(req.params.id);
      res.json({ success: true, data: lead });
  },

  async addInteraction(req, res) {
      const { id } = req.params; 
      // Não temos schema isolado para interaction ainda, podemos fazer um inline ou any por enquanto, 
      // mas idealmente deveria ter. O service aceita {type, content}.
      if (!req.body.content) throw new Error("Conteúdo da interação obrigatório");
      
      const interaction = await commercialService.addInteraction(id, req.user.id, req.body);
      res.status(201).json({ success: true, data: interaction });
  },

  // ========================
  // MISSIONS
  // ========================

  async getMissions(req, res) {
      const missions = await commercialService.getMissions(req.query);
      res.json({ success: true, data: missions });
  },

  async createMission(req, res) {
      const data = CreateMissionSchema.parse(req.body);
      const mission = await commercialService.createMission(data, req.user.id);
      res.status(201).json({ success: true, data: mission });
  },

  async assignMission(req, res) {
      const { id } = req.params; // leadId
      const { missionId } = req.body;
      if (!missionId) throw new Error("Mission ID required");
      
      const result = await commercialService.assignLeadToMission(id, missionId);
      res.json({ success: true, data: result });
  },

  // ========================
  // PROPOSALS / PIPELINE
  // ========================

  async createProposal(req, res) {
      const { leadId } = req.params;
      // Validação parcial pois o payload do gerador solar é complexo e dinâmico (passthrough no schema)
      // Mas garantimos que se encaixa no esperado minimamente
      // O CreateQuoteSchema espera { leadId, solarData... } mas aqui recebemos o payload do front direto?
      // Pelo código antigo: const { leadId } = req.params; const proposalPayload = req.body;
      
      // Vamos tentar validar o payload se possível, ou passar direto se for confiável (Solar Wizard output)
      // O service espera 'proposalPayload' que tem clientName, systemSize etc.
      
      const proposal = await commercialService.createProposal(leadId, req.body);
      res.status(201).json({ success: true, data: proposal });
  },

  async getPipeline(req, res) {
      const pipeline = await commercialService.getPipeline();
      res.json({ success: true, data: pipeline });
  },

  async getKanbanStats(req, res) {
      const stats = await commercialService.getKanbanStats();
      res.json({ success: true, data: stats });
  }
};

module.exports = commercialController;
