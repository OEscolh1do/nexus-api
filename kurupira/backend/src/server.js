// =============================================================
// KURUPIRA — Servidor Backend (Engenharia Solar)
// Operação Guardiões: Motor de cálculo e simulação
// =============================================================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const validateM2M = require("./middleware/validateM2M");
const catalogService = require("./services/catalogService");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5174", // Kurupira Frontend (Vite dev)
  "http://localhost:5173", // Kurupira Frontend (fallback)
  "https://neonorte-kurupira.vercel.app", // Kurupira Frontend (Production/Vercel)
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
// MIDDLEWARE: Upload & Static Files
// =============================================================
const uploadDir = path.join(__dirname, "../uploads/catalog");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.id + '-' + uniqueSuffix + '.webp');
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// =============================================================
// MIDDLEWARE: JWT Validation (Stateless — chave partilhada com Iaçã)
// =============================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Fallback: HTTPOnly cookie bridge (SSO com Iaçã)
  if (!token && req.cookies?.nexus_session) {
    token = req.cookies.nexus_session;
  }

  if (!token) {
    if (process.env.NODE_ENV !== 'production' || process.env.IS_DEMO === 'true') {
      // Sincronizando com o Fallback Standalone do AuthProvider.tsx
      req.user = { id: 'dev-engineer', tenantId: 'dev-tenant', role: 'ADMIN' };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normaliza campo de ID e tenantId
    req.user = {
      ...decoded,
      id: decoded.id || decoded.sub,
      tenantId: decoded.tenantId || 'default-tenant-001'
    };
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

// List all designs (scoped by tenant)
// Extrai métricas resumidas do blob designData (evita enviar o blob inteiro na listagem)
function extractDesignMetrics(designData) {
  try {
    // Tratamento defensivo: se designData for string, tenta parsear
    let data = designData;
    if (typeof designData === 'string') {
      try {
        data = JSON.parse(designData);
      } catch (e) {
        console.error('[Metrics] Failed to parse designData string:', e);
      }
    }

    // Se não houver dados solares ou técnicos, retorna zerado
    if (!data?.solar) {
      return { 
        targetPowerKwp: 0, 
        averageConsumptionKwh: 0, 
        lat: null, 
        lng: null, 
        clientName: null, 
        city: null, 
        state: null,
        moduleCount: 0,
        inverterCount: 0,
        voltage: null
      };
    }

    const cd = data.solar.clientData || {};
    const avgConsumption = cd.averageConsumption || 0;
    const lat = cd.lat || null;
    const lng = cd.lng || null;
    const clientName = cd.clientName || null;
    const city = cd.city || null;
    const state = cd.state || null;
    
    // Tensão (Voltage): Tenta topo, depois invoices[0]
    const voltage = cd.voltage || (cd.invoices && cd.invoices[0]?.voltage) || null;

    // Potência Planejada (da Jornada)
    let kWpAlvo = data.tech?.kWpAlvo || 0;
    
    // FALLBACK: Se o kWpAlvo estiver zerado (projetos antigos), tenta recalcular do consumo
    if (kWpAlvo === 0 && avgConsumption > 0) {
      const hsp = 4.5; // Média conservadora se não houver weatherData
      kWpAlvo = (avgConsumption * 12) / (hsp * 365 * 0.80);
    }

    // Equipamentos — Sincronizado com V3.1 (Zustand Slices)
    const placedModulesCount = data.solar.project?.placedModules?.length || 0;
    const inverterCount = data.tech?.inverters?.ids?.length || 0;

    const moduleIds = data.solar.modules?.ids || [];
    const entities = data.solar.modules?.entities || {};
    const firstModule = moduleIds.length > 0 ? entities[moduleIds[0]] : null;
    
    // Se o usuário usou a prancheta 2D, usa placedModules. 
    // Se não usou a prancheta, mas adicionou no catálogo (UI de equipamentos), usa moduleIds.length.
    const moduleCount = placedModulesCount > 0 ? placedModulesCount : moduleIds.length;

    const modulePowerW = firstModule?.power || firstModule?.powerWp || 550; // 550W como fallback de mercado
    const systemKwp = (moduleCount * modulePowerW) / 1000;

    // kWp Final
    const calculatedKwp = Math.round(systemKwp * 100) / 100;
    const finalPowerKwp = calculatedKwp > 0 ? calculatedKwp : (Math.round(kWpAlvo * 100) / 100);

    // Estimativa de Módulos
    let finalModuleCount = moduleCount;
    if (moduleCount === 0 && finalPowerKwp > 0) {
      finalModuleCount = Math.ceil((finalPowerKwp * 1000) / modulePowerW);
    }

    return {
      targetPowerKwp: finalPowerKwp,
      averageConsumptionKwh: Math.round(avgConsumption),
      lat: lat && lat !== 0 ? lat : null,
      lng: lng && lng !== 0 ? lng : null,
      clientName,
      city,
      state,
      moduleCount: finalModuleCount,
      inverterCount,
      voltage
    };
  } catch (error) {
    console.error('[Metrics] Extraction failed:', error);
    return {
      targetPowerKwp: 0,
      averageConsumptionKwh: 0,
      lat: null, 
      lng: null, 
      clientName: null, 
      city: null, 
      state: null,
      moduleCount: 0,
      inverterCount: 0,
      voltage: null
    };
  }
}

app.get("/api/v1/designs", authenticateToken, async (req, res) => {
  try {
    const designs = await prisma.technicalDesign.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: { not: 'ARCHIVED' },
        OR: [
          { iacaLeadId: null },
          { iacaLeadId: { not: '__settings__' } }
        ]
      },
      include: { roofSections: true, pvArrays: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // Batch fetch lead names from Iaçã (apenas designs com leadId)
    const leadIds = [...new Set(designs.map(d => d.iacaLeadId).filter(Boolean))];
    const leads = leadIds.length > 0 ? await fetchLeadsBatch(leadIds) : [];
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

    const enriched = designs.map(d => {
      const metrics = extractDesignMetrics(d.designData);
      return {
        ...d,
        designData: undefined, // Não enviar blob completo na listagem
        targetPowerKwp: metrics.targetPowerKwp,
        averageConsumptionKwh: metrics.averageConsumptionKwh,
        moduleCount: metrics.moduleCount,
        inverterCount: metrics.inverterCount,
        voltage: metrics.voltage,
        lat: d.latitude ?? metrics.lat,
        lng: d.longitude ?? metrics.lng,
        clientName: metrics.clientName,
        city: metrics.city,
        state: metrics.state,
        leadContext: d.iacaLeadId ? (leadMap[d.iacaLeadId] || { unavailable: true }) : null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single design (with full lead context)
app.get("/api/v1/designs/:id", authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { roofSections: true, pvArrays: true, simulations: true }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });

    const leadContext = design.iacaLeadId ? await fetchLeadContext(design.iacaLeadId) : null;

    res.json({
      success: true,
      data: {
        ...design,
        lat: design.latitude,
        lng: design.longitude,
        leadContext: leadContext || { unavailable: true, message: 'Contexto comercial indisponível' }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create design (standalone ou via CRM deep link)
app.post("/api/v1/designs", authenticateToken, async (req, res) => {
  try {
    const { iacaLeadId, name, latitude, longitude } = req.body;

    const design = await prisma.technicalDesign.create({
      data: {
        tenantId: req.user.tenantId,
        iacaLeadId: iacaLeadId || null,
        name: name || 'Novo Projeto Técnico',
        createdBy: req.user.id,
        latitude: latitude || null,
        longitude: longitude || null
      }
    });

    res.status(201).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete design (verifica tenant antes de deletar)
app.delete("/api/v1/designs/:id", authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    await prisma.technicalDesign.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update design (verifica tenant antes de atualizar)
app.put("/api/v1/designs/:id", authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const { designData, name, status, notes, latitude, longitude } = req.body;
    const design = await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { designData, name, status, notes, latitude, longitude }
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

// --- MODULES ---

app.post("/api/v1/catalog/modules", authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const module = await prisma.moduleCatalog.create({
      data: {
        manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef
      }
    });
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/v1/catalog/modules/:id", authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: {
        manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef
      }
    });
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/v1/catalog/modules/:id/image", authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const imageUrl = `/uploads/catalog/${req.file.filename}`;
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- INVERTERS ---

app.post("/api/v1/catalog/inverters", authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const inverter = await prisma.inverterCatalog.create({
      data: {
        manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef
      }
    });
    res.status(201).json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/v1/catalog/inverters/:id", authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: {
        manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef
      }
    });
    res.json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/v1/catalog/inverters/:id/image", authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const imageUrl = `/uploads/catalog/${req.file.filename}`;
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });
    res.json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
// ROUTES: INTERNAL M2M API (Usado pelo Admin BFF)
// =============================================================

// --- MÓDULOS M2M ---
app.post("/internal/catalog/modules", validateM2M, async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (content && filename) {
      // É um upload de arquivo .PAN
      const module = await catalogService.processPanUpload(filename, content);
      return res.status(201).json({ success: true, data: module });
    }

    // É uma criação manual
    const module = await prisma.moduleCatalog.create({ data: req.body });
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    console.error('[M2M Catalog]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch("/internal/catalog/modules/:id", validateM2M, async (req, res) => {
  try {
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: module });
  } catch (error) {
    console.error('[M2M Catalog]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- INVERSORES M2M ---
app.post("/internal/catalog/inverters", validateM2M, async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (content && filename) {
      // É um upload de arquivo .OND
      const inverter = await catalogService.processOndUpload(filename, content);
      return res.status(201).json({ success: true, data: inverter });
    }

    // É uma criação manual
    const inverter = await prisma.inverterCatalog.create({ data: req.body });
    res.status(201).json({ success: true, data: inverter });
  } catch (error) {
    console.error('[M2M Catalog]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch("/internal/catalog/inverters/:id", validateM2M, async (req, res) => {
  try {
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: inverter });
  } catch (error) {
    console.error('[M2M Catalog]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// ROUTES: User Settings (persisted via TechnicalDesign como registro especial)
// =============================================================

const SETTINGS_LEAD_ID = '__settings__';

app.get("/api/v1/settings", authenticateToken, async (req, res) => {
  try {
    const name = `settings-${req.user.id}`;
    const record = await prisma.technicalDesign.findFirst({
      where: { iacaLeadId: SETTINGS_LEAD_ID, createdBy: req.user.id }
    });
    res.json({ success: true, data: record?.designData ?? null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/v1/settings", authenticateToken, async (req, res) => {
  try {
    const name = `settings-${req.user.id}`;
    const existing = await prisma.technicalDesign.findFirst({
      where: { iacaLeadId: SETTINGS_LEAD_ID, createdBy: req.user.id }
    });

    const record = existing
      ? await prisma.technicalDesign.update({
          where: { id: existing.id },
          data: { designData: req.body }
        })
      : await prisma.technicalDesign.create({
          data: {
            tenantId: req.user.tenantId,
            iacaLeadId: SETTINGS_LEAD_ID,
            name,
            createdBy: req.user.id,
            designData: req.body
          }
        });

    res.json({ success: true, data: record.designData });
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
