const StrategyService = require("../services/strategy.service");
const { createStrategySchema, updateStrategySchema, createCheckInSchema } = require("../schemas/strategy.schema");

const StrategyController = {
    // GET ALL (Tree Structure)
    getAll: async (req, res) => {
        const strategies = await StrategyService.getAll();
        return res.json({ success: true, data: strategies });
    },

    // GET ONE
    getById: async (req, res) => {
        const strategy = await StrategyService.getById(req.params.id);
        return res.json({ success: true, data: strategy });
    },

    // CREATE STRATEGY
    create: async (req, res) => {
        // 1. Validate Payload (Zod throws 400 if fails)
        const data = createStrategySchema.parse(req.body);

        // 2. Delegate to Service
        const newStrategy = await StrategyService.create(data, req.user?.username);

        return res.status(201).json({ success: true, data: newStrategy });
    },

    // CREATE KEY RESULT
    createKeyResult: async (req, res) => {
        const { id } = req.params; // Strategy ID
        
        // Zod validation isn't strict here since we just reuse the schema but ensure parent is set
        const { keyResultSchema } = require("../schemas/strategy.schema");
        const data = keyResultSchema.parse(req.body);

        // Delegate to service
        const newKr = await StrategyService.createKeyResult(id, data, req.user?.id);

        return res.status(201).json({ success: true, data: newKr });
    },

    // CREATE RISK
    createRisk: async (req, res) => {
        const { id } = req.params; // Strategy ID
        const { createRiskSchema } = require("../schemas/strategy.schema");
        const data = createRiskSchema.parse(req.body);

        const newRisk = await StrategyService.createRisk(id, data, req.user?.id);
        return res.status(201).json({ success: true, data: newRisk });
    },

    // UPDATE
    update: async (req, res) => {
        const { id } = req.params;
        const data = updateStrategySchema.parse(req.body);

        const updated = await StrategyService.update(id, data);
        return res.json({ success: true, data: updated });
    },

    // DELETE
    delete: async (req, res) => {
        await StrategyService.delete(req.params.id);
        return res.json({ success: true });
    },

    // CREATE CHECK-IN
    createCheckIn: async (req, res) => {
        const { id } = req.params; // It's expected to be the keyResultId
        const data = createCheckInSchema.parse(req.body);

        const checkIn = await StrategyService.createCheckIn(id, data, req.user?.id);
        return res.status(201).json({ success: true, data: checkIn });
    }
};

module.exports = StrategyController;
