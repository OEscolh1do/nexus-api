const OpsService = require('../services/ops.service');
const { createProjectSchema, updateProjectSchema, taskSchema, updateTaskSchema } = require('../schemas/ops.schema');

const OpsController = {

    // ========================
    // PROJECTS
    // ========================

    getAllProjects: async (req, res) => {
        // Delegate query logic to Service
        const list = await OpsService.getAllProjects();
        return res.json({ success: true, data: list });
    },

    getProjectById: async (req, res) => {
        const project = await OpsService.getProjectTree(req.params.id);
        return res.json({ success: true, data: project });
    },

    createProject: async (req, res) => {
        // Zod Validation (Throws if invalid)
        const data = createProjectSchema.parse(req.body);

        const project = await OpsService.createProject({
            ...data,
            userId: req.user.id
        });
        return res.status(201).json({ success: true, data: project });
    },

    updateProject: async (req, res) => {
        const { id } = req.params;
        const data = updateProjectSchema.parse(req.body);

        const updated = await OpsService.updateProject(id, data);
        return res.json({ success: true, data: updated });
    },

    deleteProject: async (req, res) => {
        await OpsService.deleteProject(req.params.id);
        return res.json({ success: true });
    },

    // ========================
    // TASKS
    // ========================

    addTask: async (req, res) => {
        const data = taskSchema.parse(req.body);
        const task = await OpsService.addTask(req.params.id, data);
        return res.status(201).json({ success: true, data: task });
    },

    updateTask: async (req, res) => {
        const data = updateTaskSchema.parse(req.body);

        // Pass user ID for auditing
        const task = await OpsService.updateTask(req.params.id, data, req.user.id);
        return res.json({ success: true, data: task });
    },

    updateTaskStatus: async (req, res) => {
        const { status } = req.body;

        // Simple validation for status enum existence
        if (!status) throw new Error("Status is required");

        const task = await OpsService.updateTaskStatus(req.params.id, status, req.user.id);
        return res.json({ success: true, data: task });
    },

    deleteTask: async (req, res, next) => {
        try {
            await OpsService.deleteTask(req.params.id, req.user.id);
            res.json({ success: true, message: "Tarefa excluída" });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/v2/ops/workload
     * Multi-tenancy enabled.
     */
    async getWorkload(req, res, next) {
        try {
            // 1. Zod Validation for Query Params
            const { getWorkloadSchema } = require("../schemas/ops.schema");
            const validation = getWorkloadSchema.safeParse({ query: req.query });

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid filters",
                    details: validation.error.format()
                });
            }

            // 2. Call Service with Tenant Context
            // FALLBACK: Use orgUnitId as tenant context if tenantId is null (legacy users)
            const tenantContext = req.user.tenantId || req.user.orgUnitId || 'default-tenant-001';
            const data = await OpsService.getGlobalWorkload(tenantContext, req.query);

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Legacy Legacy support if needed, but getTeamWorkload service is gone.
    // We can redirect or remove specific legacy controllers if safe.
    // For now, removing getTeamWorkload from controller export or mapping it to new logic.

    async processInspection(req, res, next) {
        try {
            const results = await OpsService.processInspection(req.body, req.user.id);
            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = OpsController;
