const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

// 🛡️ Segurança & Validação
// 🛡️ Segurança & Validação
const { authenticateToken, protectProject } = require("./modules/iam/middleware/auth.middleware.js");
const { validateSolarDetails } = require("./modules/solar/schemas/solar.schemas.js");

// 📊 Services
// const leadService = require("./services/leadService.js"); (DELETED)
// const quoteService = require("./services/quoteService.js"); (DELETED)

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ---
const iamRouter = require("./modules/iam/iam.controller");

// --- MODULE ROUTES ---
app.use("/api/v2/iam", iamRouter);

// --- LEGACY AUTH REDIRECT (Optional compatibility) ---
// app.post("/auth/login", (req, res) => res.redirect(307, "/api/v2/iam/login"));

// --- NAVIGATION CONTROLLER (V2 Dynamic) ---
const NavigationController = require("./modules/core/controllers/navigation.controller.js");
app.get("/api/v2/navigation/:module", authenticateToken, NavigationController.getNavigation);
app.post("/api/v2/navigation/:module", authenticateToken, NavigationController.updateNavigation);

// Legacy UI Route (Deprecated - redirect or remove if not used, keeping for safety but pointing to V2 logic if possible or leaving as is until frontend swap)
const { getNavigation } = require("./modules/iam/ui/navigation.controller.js");
app.get("/api/ui/navigation", authenticateToken, getNavigation);

// --- MODULAR V2 API (Strangler Pattern) ---
const solarRouter = require("./modules/solar/solar.controller");
const finRouter = require("./modules/fin/fin.controller");
const biRouter = require("./modules/bi/bi.controller");

// --- OPS CONTROLLER (Explicit & Validated) ---
// --- OPS CONTROLLER (Explicit & Validated) ---
const OpsController = require("./modules/ops/ops.controller");
const StrategyController = require("./modules/strategy/strategy.controller");

// --- STRATEGY ROUTES ---
app.get("/api/v2/strategies", authenticateToken, StrategyController.getAll);
app.get("/api/v2/strategies/:id", authenticateToken, StrategyController.getById);
app.post("/api/v2/strategies", authenticateToken, StrategyController.create);
app.put("/api/v2/strategies/:id", authenticateToken, StrategyController.update);
app.delete("/api/v2/strategies/:id", authenticateToken, StrategyController.delete);

// Projects
app.get("/api/v2/ops/projects", authenticateToken, OpsController.getAllProjects);
app.get("/api/v2/ops/projects/:id", authenticateToken, OpsController.getProjectById);
app.post("/api/v2/ops/projects", authenticateToken, OpsController.createProject);
app.put("/api/v2/ops/projects/:id", authenticateToken, OpsController.updateProject);
app.delete("/api/v2/ops/projects/:id", authenticateToken, OpsController.deleteProject);

// Tasks & Inspections
app.post("/api/v2/ops/projects/:id/tasks", authenticateToken, OpsController.addTask);
app.put("/api/v2/ops/tasks/:id", authenticateToken, OpsController.updateTask);
app.delete("/api/v2/ops/tasks/:id", authenticateToken, OpsController.deleteTask);

app.patch("/api/v2/ops/tasks/:id/status", authenticateToken, OpsController.updateTaskStatus);
app.patch("/api/v2/ops/tasks/:id/status", authenticateToken, OpsController.updateTaskStatus);
app.get("/api/v2/ops/workload", authenticateToken, OpsController.getWorkload);
app.post("/api/v2/ops/inspections", authenticateToken, OpsController.processInspection);

// Routes specific to legacy frontend bridging if needed
// e.g. frontend calls /api/v2/projects (generic list) -> we now route it to OpsController.getAllProjects
app.get("/api/v2/projects", authenticateToken, OpsController.getAllProjects); 
// Note: We map /api/v2/projects to OpsController list to maintain frontend compatibility without generic controller.

app.use("/api/v2/fin", finRouter);
app.use("/api/v2/bi", biRouter);

// --- COMMERCIAL MODULE ROUTES (Wave 11) ---
const commercialController = require("./modules/commercial/controllers/commercial.controller");

const commercialRoutes = express.Router(); // Renamed to avoid shadowing
commercialRoutes.get("/pipeline", commercialController.getPipeline);
commercialRoutes.get("/leads/kanban-stats", commercialController.getKanbanStats);
commercialRoutes.post("/leads", commercialController.createLead);
commercialRoutes.get("/leads", commercialController.getLeads);
commercialRoutes.get("/leads/:id", commercialController.getLeadDetails);
commercialRoutes.put("/leads/:id", commercialController.updateLead);
commercialRoutes.post("/leads/:leadId/proposals", commercialController.createProposal);
commercialRoutes.post("/leads/:id/interactions", commercialController.addInteraction);
commercialRoutes.put("/leads/:id/assign-mission", commercialController.assignMission);

commercialRoutes.get("/missions", commercialController.getMissions);
commercialRoutes.post("/missions", commercialController.createMission);

app.use("/api/v2/commercial", authenticateToken, commercialRoutes);

// --- UNIVERSAL CRUD CONTROLLER ---
// Maps /api/:resource to Prisma Models (e.g. /api/users -> prisma.user)

// Helper to get model dynamically (Case insensitive)
const getModel = (resource) => {
  // 1. Explicit Mappings
  const MAPPING = {
    // Core Models
    // strategies: "strategy", // REMOVED: Now handled by explicit StrategyController
    keyResults: "keyResult",
    risks: "risk",
    // projects: "project", // REMOVED: Now handled by explicit OpsController
    // tasks: "operationalTask", // REMOVED: Now handled by explicit OpsController
    // operationalTasks: "operationalTask",
    taskDependencies: "taskDependency",
    checklists: "checklist",
    checklistItems: "checklistItem",
    
    // Organization
    orgUnits: "orgUnit",
    programs: "program",
    pipelines: "pipeline",
    stages: "stage",
    workflowRules: "workflowRule",
    
    // HR & Audit
    hrLeaves: "hRLeave",
    auditLogs: "auditLog",
    
    // Assets & Events
    assets: "asset",
    events: "event"
  };

  if (MAPPING[resource]) {
    return prisma[MAPPING[resource]];
  }

  // 2. Dynamic Discovery (CamelCase & Pluralization)
  const resourceLower = resource.toLowerCase();

  // Find key where key.lowercase == resource (User -> user)
  // OR key + 's' == resource (User -> users)
  const key = Object.keys(prisma).find((k) => {
    const kLower = k.toLowerCase();
    return kLower === resourceLower || kLower + "s" === resourceLower;
  });

  return key ? prisma[key] : null;
};

// --- STRATEGY CONTROLLER (Explicit & Validated) ---
// StrategyController imported at top


app.get("/api/v2/strategies", authenticateToken, StrategyController.getAll);
app.post("/api/v2/strategies", authenticateToken, StrategyController.create);
// app.get("/api/v2/strategies/:id", authenticateToken, StrategyController.getById); // Override generic manually if needed
// app.put("/api/v2/strategies/:id", authenticateToken, StrategyController.update);
// app.delete("/api/v2/strategies/:id", authenticateToken, StrategyController.delete);


// READ ALL
app.get("/api/v2/:resource", authenticateToken, async (req, res) => {
  try {
    const { resource } = req.params;
    const model = getModel(resource);

    if (!model) {
      console.log(`[DEBUG] No model found for resource: ${resource}`);
      return res.json({ success: true, data: [] });
    }

    console.log(`[DEBUG] Fetching ${resource} using model key.`);


    // Default sort order (can be customized per resource)
    const orderBy = {};
    if (resource === 'taskDependencies') {
      orderBy.id = 'asc'; // TaskDependency doesn't have createdAt
    } else {
       orderBy.createdAt = 'desc'; 
    }
    
    // Safety check: Resource-specific sort configurations
    let sortConfig = { createdAt: 'desc' }; // Default
    if (resource === 'taskDependencies' || resource === 'checklistItems' || resource === 'keyResults' || resource === 'risks') {
      sortConfig = { id: 'asc' }; // No createdAt field
    } else if (resource === 'auditLogs') {
      sortConfig = { timestamp: 'desc' }; // Uses 'timestamp', not 'createdAt'
    } else if (resource === 'hrLeaves') {
      sortConfig = { startDate: 'desc' }; // Uses 'startDate' instead
    }

    const data = await model.findMany({
      orderBy: sortConfig, 
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching ${req.params.resource}:`);
    console.error(error);

    // Handle Database Connection Errors
    if (error.code === 'P1001' || error.code === 'P1002') {
      return res.status(503).json({ 
        success: false, 
        error: 'Database Unavailable',
        details: 'Não foi possível conectar ao banco de dados remoto. Verifique a conexão com a internet ou o status do servidor.'
      });
    }

    res
      .status(500)
      .json({ success: false, error: error.message, stack: error.toString() });
  }
});

// READ ONE
app.get("/api/v2/:resource/:id", authenticateToken, async (req, res) => {
  try {
    const { resource, id } = req.params;
    const model = getModel(resource);
    if (!model) return res.status(404).json({ success: false });

    const item = await model.findUnique({ where: { id } });
    if (!item)
      return res.status(404).json({ success: false, error: "Not Found" });

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
app.post("/api/v2/:resource", authenticateToken, async (req, res) => {
    return res.status(405).json({ 
        success: false, 
        error: "Universal CREATE is disabled for security. Use specific controllers." 
    });
});

// UPDATE - PROJETOS (Rota migrada para OpsController.updateProject)

// UPDATE - GENÉRICO (para outros recursos que não são 'projects')
app.put("/api/v2/:resource/:id", authenticateToken, async (req, res) => {
    return res.status(405).json({ 
        success: false, 
        error: "Universal UPDATE is disabled for security. Use specific controllers." 
    });
});

// DELETE
app.delete("/api/v2/:resource/:id", authenticateToken, async (req, res, next) => {
  return res.status(405).json({ 
      success: false, 
      error: "Universal DELETE is disabled for security. Use specific controllers." 
  });
});

// 🛡️ GLOBAL ERROR HANDLER
const errorHandler = require("./middleware/error.middleware");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 NEXUS 2.0 Backend running on port ${PORT}`);
});

