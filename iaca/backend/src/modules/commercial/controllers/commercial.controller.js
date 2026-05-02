const commercialService = require("../services/commercial.service");
const {
    CreateLeadSchema,
    UpdateLeadSchema,
    CreateMissionSchema,
    CreateOpportunitySchema,
    UpdateOpportunitySchema
} = require("../schemas/commercial.schemas");
const { z } = require("zod");

// L8 SEC-OPS PATCH: Validação Forte para Evitar Payload Poisoning nas anotações
const AddInteractionSchema = z.object({
    type: z.string().optional(),
    content: z.string().min(1, "Conteúdo da interação obrigatório").max(5000, "Conteúdo longo demais")
});

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

        // L8 SEC-OPS PATCH: Passar o payload pelo funil Zod para desarmar injeção
        const validatedData = AddInteractionSchema.parse(req.body);

        const interaction = await commercialService.addInteraction(id, req.user.id, validatedData);
        res.status(201).json({ success: true, data: interaction });
    },

    // ========================
    // OPPORTUNITIES (DEALS)
    // ========================

    async createOpportunity(req, res) {
        const data = CreateOpportunitySchema.parse(req.body);
        const opportunity = await commercialService.createOpportunity(data, req.user.orgUnitId);
        res.status(201).json({ success: true, data: opportunity });
    },

    async getOpportunities(req, res) {
        const opportunities = await commercialService.getOpportunities(req.query, req.user.orgUnitId);
        res.json({ success: true, data: opportunities });
    },

    async updateOpportunity(req, res) {
        const { id } = req.params;
        const data = UpdateOpportunitySchema.parse(req.body);
        const updated = await commercialService.updateOpportunity(id, data, req.user.id);
        res.json({ success: true, data: updated });
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

    async getPipeline(req, res) {
        // L8 SEC-OPS PATCH: Restringe por Tenant
        const pipeline = await commercialService.getPipeline(req.user.orgUnitId);
        res.json({ success: true, data: pipeline });
    },

    async getKanbanStats(req, res) {
        const stats = await commercialService.getKanbanStats();
        res.json({ success: true, data: stats });
    },

    // ========================
    // DASHBOARD / ACTIVITIES
    // ========================

    async getActivities(req, res) {
        const activities = await commercialService.getRecentActivities(req.user.orgUnitId);
        res.json({ success: true, data: activities });
    }
};

module.exports = commercialController;
