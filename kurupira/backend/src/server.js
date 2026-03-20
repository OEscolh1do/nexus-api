// =============================================================
// KURUPIRA — Servidor Backend (Engenharia Solar)
// Operação Guardiões: Motor de cálculo e simulação
// =============================================================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5174", // Kurupira Frontend (Vite dev)
  "http://localhost:5173", // Kurupira Frontend (fallback)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// =============================================================
// MIDDLEWARE: JWT Validation (Stateless — chave partilhada com Iaçã)
// =============================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, role, orgUnitId, exp }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

// =============================================================
// M2M CLIENT: Injeção de contexto comercial do Iaçã
// =============================================================
const IACA_URL = process.env.IACA_INTERNAL_URL || "http://iaca-backend:3001";
const M2M_TOKEN = process.env.M2M_SERVICE_TOKEN;

async function fetchLeadContext(leadId) {
  try {
    const response = await fetch(`${IACA_URL}/internal/leads/${leadId}`, {
      headers: { 'X-Service-Token': M2M_TOKEN },
      signal: AbortSignal.timeout(2000) // Circuit breaker: 2s timeout
    });
    if (!response.ok) return null;
    const { data } = await response.json();
    return data;
  } catch (error) {
    // Circuit breaker: degrade gracefully
    console.warn(`[M2M] Failed to fetch lead ${leadId} from Iaçã: ${error.message}`);
    return null;
  }
}

async function fetchLeadsBatch(ids) {
  try {
    const response = await fetch(`${IACA_URL}/internal/leads/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': M2M_TOKEN
      },
      body: JSON.stringify({ ids }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return [];
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.warn(`[M2M] Batch fetch failed: ${error.message}`);
    return [];
  }
}

// =============================================================
// ROUTES: Technical Designs (CRUD)
// =============================================================

// List all designs (with lead context injection)
app.get("/api/v1/designs", authenticateToken, async (req, res) => {
  try {
    const designs = await prisma.technicalDesign.findMany({
      include: { roofSections: true, pvArrays: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // Batch fetch lead names from Iaçã
    const leadIds = [...new Set(designs.map(d => d.iacaLeadId))];
    const leads = await fetchLeadsBatch(leadIds);
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

    const enriched = designs.map(d => ({
      ...d,
      leadContext: leadMap[d.iacaLeadId] || { unavailable: true }
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single design (with full lead context)
app.get("/api/v1/designs/:id", authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findUnique({
      where: { id: req.params.id },
      include: { roofSections: true, pvArrays: true, simulations: true }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });

    const leadContext = await fetchLeadContext(design.iacaLeadId);

    res.json({
      success: true,
      data: {
        ...design,
        leadContext: leadContext || { unavailable: true, message: 'Contexto comercial indisponível' }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create design (from CRM deep link)
app.post("/api/v1/designs", authenticateToken, async (req, res) => {
  try {
    const { iacaLeadId, name } = req.body;
    if (!iacaLeadId) return res.status(400).json({ success: false, error: 'iacaLeadId is required' });

    const design = await prisma.technicalDesign.create({
      data: {
        iacaLeadId,
        name: name || 'Novo Projeto Técnico',
        createdBy: req.user.sub
      }
    });

    res.status(201).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update design
app.put("/api/v1/designs/:id", authenticateToken, async (req, res) => {
  try {
    const { designData, name, status, notes } = req.body;
    const design = await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { designData, name, status, notes }
    });
    res.json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// ROUTES: Roof Sections
// =============================================================

app.post("/api/v1/designs/:designId/roof-sections", authenticateToken, async (req, res) => {
  try {
    const section = await prisma.roofSection.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// ROUTES: PV Arrays
// =============================================================

app.post("/api/v1/designs/:designId/pv-arrays", authenticateToken, async (req, res) => {
  try {
    const pvArray = await prisma.pVArray.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: pvArray });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// ROUTES: Simulations
// =============================================================

app.post("/api/v1/designs/:designId/simulations", authenticateToken, async (req, res) => {
  try {
    const simulation = await prisma.simulation.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: simulation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// ROUTES: Equipment Catalogs
// =============================================================

app.get("/api/v1/catalog/modules", authenticateToken, async (req, res) => {
  try {
    const modules = await prisma.moduleCatalog.findMany({
      where: { isActive: true },
      orderBy: { manufacturer: 'asc' }
    });
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/catalog/inverters", authenticateToken, async (req, res) => {
  try {
    const inverters = await prisma.inverterCatalog.findMany({
      where: { isActive: true },
      orderBy: { manufacturer: 'asc' }
    });
    res.json({ success: true, data: inverters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// HEALTH CHECK
// =============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "kurupira-backend",
    timestamp: new Date().toISOString()
  });
});

// =============================================================
// ERROR HANDLER & STARTUP
// =============================================================

app.use((err, req, res, next) => {
  console.error('[Kurupira Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ KURUPIRA Backend (Engenharia) running on port ${PORT}`);
});
