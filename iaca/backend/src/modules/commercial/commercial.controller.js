const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth.middleware"); // Adjust path if needed
const commercialService = require("./services/commercial.service");
const {
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateQuoteSchema,
  UpdateQuoteSchema,
  CreateOpportunitySchema,
  UpdateOpportunitySchema
} = require("./schemas/commercial.schemas");

// ==========================================
// MIDDLEWARES SPECIFIC
// ==========================================

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos (Schema Validation)",
      details: err.errors
    });
  }
};

// ==========================================
// LEADS ROUTES
// ==========================================

// LIST
router.get("/leads", authenticateToken, async (req, res) => {
  try {
    const leads = await commercialService.listLeads(req.query);
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
router.post("/leads", authenticateToken, validate(CreateLeadSchema), async (req, res) => {
  try {
    const lead = await commercialService.createLead({
      ...req.body,
      assignedTo: req.user.id // Auto-assign creator initially
    }, req.user.id); // Passing userId explicitly as expected by the new service signature
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE
router.put("/leads/:id", authenticateToken, validate(UpdateLeadSchema), async (req, res) => {
  try {
    const lead = await commercialService.updateLead(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// OPPORTUNITIES ROUTES (DEALS)
// ==========================================

// LIST
router.get("/opportunities", authenticateToken, async (req, res) => {
  try {
    const opportunities = await commercialService.getOpportunities(req.query, req.user.orgUnitId);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
router.post("/opportunities", authenticateToken, validate(CreateOpportunitySchema), async (req, res) => {
  try {
    const opportunity = await commercialService.createOpportunity(req.body, req.user.orgUnitId);
    res.json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE
router.put("/opportunities/:id", authenticateToken, validate(UpdateOpportunitySchema), async (req, res) => {
  try {
    const opportunity = await commercialService.updateOpportunity(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// STATS / KPIs
router.get("/opportunities/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await commercialService.getKanbanStats(req.user.orgUnitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// QUOTES ROUTES
// ==========================================

// LIST
router.get("/quotes", authenticateToken, async (req, res) => {
  try {
    const quotes = await commercialService.listQuotes(req.query);
    res.json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
router.post("/quotes", authenticateToken, validate(CreateQuoteSchema), async (req, res) => {
  try {
    const quote = await commercialService.createQuote({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ==========================================
// CONTRACTS ROUTES
// ==========================================

// LIST
router.get("/contracts", authenticateToken, async (req, res) => {
  try {
    const contracts = await commercialService.getContracts(req.user.tenantId || "default-tenant-001");
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
