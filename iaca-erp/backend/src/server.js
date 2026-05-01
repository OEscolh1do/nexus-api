const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initSlaCronJobs } = require('./jobs/sla.cron');
const { initJitCronJobs } = require('./jobs/jit.cron');
const prisma = require("./lib/prisma"); // Global RLS-aware Prisma Client

// 🛡️ Segurança & Validação
const { authenticateToken, protectProject } = require("./modules/iam/middleware/auth.middleware.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamic CORS for Cloudflare Pages and Fly.io
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const allowedOrigins = [
  ...envOrigins,
  "http://localhost:3000", // Iaçã Frontend (dev fallback)
  "http://localhost:5173", // Iaçã Frontend (Vite dev)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS policy: ' + origin))
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- AUTHENTICATION ---
const iamRouter = require("./modules/iam/controllers/iam.controller");

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
const finRouter = require("./modules/fin/controllers/fin.controller");
const biRouter = require("./modules/bi/bi.controller");

// --- OPS CONTROLLER (Explicit & Validated) ---
// --- OPS CONTROLLER (Explicit & Validated) ---
const OpsController = require("./modules/ops/controllers/ops.controller");
const StrategyController = require("./modules/strategy/controllers/strategy.controller");

// --- STRATEGY ROUTES ---
app.get("/api/v2/strategies", authenticateToken, StrategyController.getAll);
app.get("/api/v2/strategies/:id", authenticateToken, StrategyController.getById);
app.post("/api/v2/strategies", authenticateToken, StrategyController.create);
app.put("/api/v2/strategies/:id", authenticateToken, StrategyController.update);
app.delete("/api/v2/strategies/:id", authenticateToken, StrategyController.delete);

// Strategy Key Results, Risks & Check-ins
app.post("/api/v2/strategies/:id/key-results", authenticateToken, StrategyController.createKeyResult);
app.post("/api/v2/strategies/:id/risks", authenticateToken, StrategyController.createRisk);
app.post("/api/v2/key-results/:id/checkin", authenticateToken, StrategyController.createCheckIn);

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
app.get("/api/v2/ops/workload", authenticateToken, OpsController.getWorkload);
app.post("/api/v2/ops/inspections", authenticateToken, OpsController.processInspection);

// Team & Calendar (Ops Module)
app.get("/api/calendar/events", authenticateToken, OpsController.getCalendarEvents);
app.get("/api/team/hierarchy", authenticateToken, OpsController.getTeamHierarchy);
app.post("/api/hr/leaves", authenticateToken, OpsController.createLeave);

// Routes specific to legacy frontend bridging if needed
// e.g. frontend calls /api/v2/projects (generic list) -> we now route it to OpsController.getAllProjects
app.get("/api/v2/projects", authenticateToken, OpsController.getAllProjects);
// Note: We map /api/v2/projects to OpsController list to maintain frontend compatibility without generic controller.

app.use("/api/v2/fin", finRouter);
app.use("/api/v2/bi", biRouter);

// --- EXECUTIVE MODULE ROUTES ---
const executiveRouter = require("./modules/executive/controllers/executive.controller");
app.use("/api/v2/executive", executiveRouter);

// --- COMMERCIAL MODULE ROUTES (Wave 11) ---
const commercialController = require("./modules/commercial/controllers/commercial.controller");

const commercialRoutes = express.Router(); // Renamed to avoid shadowing
commercialRoutes.get("/activities", commercialController.getActivities);
commercialRoutes.get("/pipeline", commercialController.getPipeline);
commercialRoutes.get("/leads/kanban-stats", commercialController.getKanbanStats);
commercialRoutes.post("/leads", commercialController.createLead);
commercialRoutes.get("/leads", commercialController.getLeads);
commercialRoutes.get("/leads/:id", commercialController.getLeadDetails);
commercialRoutes.put("/leads/:id", commercialController.updateLead);
commercialRoutes.post("/leads/:id/interactions", commercialController.addInteraction);
commercialRoutes.put("/leads/:id/assign-mission", commercialController.assignMission);

commercialRoutes.get("/missions", commercialController.getMissions);
commercialRoutes.post("/missions", commercialController.createMission);

// Opportunities (Deals)
commercialRoutes.get("/opportunities/stats", commercialController.getKanbanStats);
commercialRoutes.post("/opportunities", commercialController.createOpportunity);
commercialRoutes.get("/opportunities", commercialController.getOpportunities);
commercialRoutes.put("/opportunities/:id", commercialController.updateOpportunity);

app.use("/api/v2/commercial", authenticateToken, commercialRoutes);

// --- EXTRANET ROUTES (PHASE 2 B2B/B2P) ---
const extranetRouter = require("./modules/extranet/extranet.controller");
app.use("/api/v2/extranet", extranetRouter);

// --- ENTERPRISE GATEWAY ROUTES (PHASE 3 MONETIZATION) ---
const gatewayRouter = require("./modules/gateway/gateway.controller");
app.use("/api/v2/gateway", gatewayRouter);

// --- INTERNAL M2M ROUTES (Kurupira → Iaçã) ---
// Protected by X-Service-Token header (NOT JWT)
const validateM2M = (req, res, next) => {
  const token = req.headers['x-service-token'];
  if (token !== process.env.M2M_SERVICE_TOKEN) {
    return res.status(403).json({ success: false, error: 'M2M access denied' });
  }
  next();
};

// Single lead fetch
app.get("/internal/leads/:id", validateM2M, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, phone: true, city: true, state: true, energyBillUrl: true }
    });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch leads fetch (prevents N+1 over HTTP)
app.post("/internal/leads/batch", validateM2M, express.json(), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length > 100) {
      return res.status(400).json({ success: false, error: 'ids must be an array (max 100)' });
    }
    const leads = await prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, phone: true, city: true, state: true }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit trail receiver (Kurupira → Iaçã)
app.post("/internal/audit", validateM2M, express.json(), async (req, res) => {
  try {
    const { action, userId, resourceId, details, correlationId } = req.body;
    await prisma.auditLog.create({
      data: {
        tenantId: 'default-tenant-001',
        userId,
        action: `KURUPIRA:${action}`,
        resourceId,
        details: JSON.stringify({ ...JSON.parse(details || '{}'), correlationId, source: 'kurupira' }),
        entity: 'TechnicalDesign'
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Session Revocation (Admin BFF → Iaçã)
app.delete("/internal/sessions/:id", validateM2M, async (req, res) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/internal/users/:id/sessions", validateM2M, async (req, res) => {
  try {
    await prisma.session.deleteMany({ where: { userId: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar Tenant (Admin BFF → Iaçã)
app.post("/internal/tenants", validateM2M, async (req, res) => {
  try {
    const { name, apiPlan = 'FREE', apiMonthlyQuota = 1000 } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Nome da organização inválido (mínimo 2 caracteres)' });
    }

    // Verificar unicidade (case-insensitive)
    const existing = await prisma.tenant.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(409).json({ success: false, error: `Já existe uma organização com o nome "${name.trim()}"` });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        type: 'SUB_TENANT',
        apiPlan,
        apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
      },
    });

    // Criar OrgUnit raiz padrão para o tenant (sem tenantId — OrgUnit não tem esse campo)
    await prisma.orgUnit.create({
      data: { name: tenant.name, type: 'ROOT' },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'ADMIN_CREATE_TENANT',
        entity: 'Tenant',
        resourceId: tenant.id,
        details: JSON.stringify({ name: tenant.name, apiPlan: tenant.apiPlan, source: 'admin-bff' }),
      },
    }).catch(() => {}); // non-blocking

    res.status(201).json({ success: true, data: { id: tenant.id, name: tenant.name } });
  } catch (error) {
    console.error('[M2M] Erro ao criar tenant:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Editar Tenant (Admin BFF → Iaçã)
app.patch("/internal/tenants/:id", validateM2M, async (req, res) => {
  try {
    const allowed = ['name', 'apiPlan', 'apiMonthlyQuota', 'apiCurrentUsage', 'status', 'ssoProvider', 'ssoDomain', 'ssoEnforced'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: tenant });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Organização não encontrada' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar Usuário (Admin BFF → Iaçã) — Opção D: senha temporária + mustChangePassword
app.post("/internal/users", validateM2M, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { username, password, fullName, role, tenantId, jobTitle } = req.body;

    if (!username || !password || !fullName || !role || !tenantId) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios: username, password, fullName, role, tenantId' });
    }

    // Verificar unicidade do username
    const existingUser = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: `Username "${username.trim()}" já está em uso` });
    }

    // Verificar que tenant existe e não está bloqueado
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Organização não encontrada' });
    }
    if (tenant.status === 'BLOCKED') {
      return res.status(403).json({ success: false, error: 'Não é possível adicionar usuários a uma organização bloqueada' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        role,
        tenantId,
        jobTitle: jobTitle?.trim() || null,
        // mustChangePassword não existe no schema atual — roadmap: migração futura
      },
      select: { id: true, username: true, fullName: true, role: true, tenantId: true, createdAt: true },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: null,
        action: 'ADMIN_CREATE_USER',
        entity: 'User',
        resourceId: user.id,
        details: JSON.stringify({ username: user.username, role: user.role, source: 'admin-bff' }),
      },
    }).catch(() => {});

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('[M2M] Erro ao criar usuário:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Editar Usuário (Admin BFF → Iaçã)
app.patch("/internal/users/:id", validateM2M, async (req, res) => {
  try {
    const allowed = ['fullName', 'role', 'jobTitle', 'status'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, fullName: true, role: true, status: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});


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

    // L8 SEC-OPS PATCH: 
    // 1. Mandatory 'withTenant' wrapper to enforce RLS across dynamic models.
    // 2. Hard limit to 1000 rows to prevent Memory Heap Explosions (OOM).
    const { withTenant } = require("./lib/prisma");

    const data = await withTenant(async (tx) => {
      // O Tx repassa o RLS config. Encontramos a chave do model no Tx.
      // prisma[key] foi computado, mas 'model' é da instância original. 
      // Pra usar tx, precisamos do NOME da chave.
      // Hack seguro: extraímos o modelName ou nome da propriedade do Prisma.
      const modelName = model.name ? (model.name.charAt(0).toLowerCase() + model.name.slice(1)) : null;

      // Se conseguir inferir do Prisma AST, usa. Senão cai no fallback sem RLS se a IA estiver confusa.
      // Melhor forma: já descobrimos a `key` no getModel, mas a reescrevemos:
      const resourceLower = resource.toLowerCase();
      const key = Object.keys(tx).find((k) => {
        const kLower = k.toLowerCase();
        return kLower === resourceLower || kLower + "s" === resourceLower;
      });

      if (!key || !tx[key]) {
        // Fallback ultra safe
        return model.findMany({
          orderBy: sortConfig,
          take: 1000
        });
      }

      return tx[key].findMany({
        orderBy: sortConfig,
        take: 1000 // OOM Protection Hard Limit
      });
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

// --- HEALTH CHECK ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "iaca-backend", timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏛️ IAÇÃ Backend (Gestão) running on port ${PORT}`);
  // Start CRON services
  initSlaCronJobs();
  initJitCronJobs();
});
