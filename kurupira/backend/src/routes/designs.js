const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { fetchLeadContext } = require('../services/m2mClient');
const { extractDesignMetrics } = require('../utils/designMetrics');
const { createDesignSchema, updateDesignSchema, validate } = require('../validation/designs');
const logger = require('../lib/logger');

const safeError = (err) =>
  process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const designs = await prisma.technicalDesign.findMany({
      where: { tenantId: req.user.tenantId, status: { not: 'ARCHIVED' }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // Enriquecimento com métricas calculadas do designData (Power, Consumption, etc)
    const enrichedDesigns = designs.map(d => ({
      ...d,
      ...extractDesignMetrics(d.designData)
    }));

    res.json({ success: true, data: enrichedDesigns });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });

    if (!design) return res.status(404).json({ success: false, error: 'Not found' });

    // Enriquecimento opcional com dados do Iaçã (Leads)
    if (design.iacaLeadId) {
      try {
        const lead = await fetchLeadContext(design.iacaLeadId);
        design.leadContext = lead;
      } catch (err) {
        logger.warn(`[GET /designs/${req.params.id}] Falha ao buscar contexto do lead no Iaçã:`, err.message);
      }
    }

    // Mesclar métricas calculadas (Prioridade para o que está no DB se houver conflito)
    const enriched = {
      ...design,
      ...extractDesignMetrics(design.designData)
    };

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/', authenticateToken, validate(createDesignSchema), async (req, res) => {
  try {
    const { name, iacaLeadId, latitude, longitude } = req.body;
    const design = await prisma.technicalDesign.create({
      data: {
        name: name || `Projeto ${new Date().toLocaleDateString()}`,
        iacaLeadId,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
        status: 'DRAFT',
        designData: {},
        latitude: latitude || null,
        longitude: longitude || null
      }
    });
    res.status(201).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.put('/:id', authenticateToken, validate(updateDesignSchema), async (req, res) => {
  let { designData, name, status, notes, latitude, longitude } = req.body;
  
  // Sonda Ômega (Backend): Verificar se o designData sobreviveu à rede e validação
  console.log(`[Trace Backend] PUT /designs/${req.params.id} recebido.`);
  console.log(`[Trace Backend] typeof designData:`, typeof designData);
  console.log(`[Trace Backend] designData keys:`, designData ? Object.keys(designData) : 'null/undefined');

  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    // Merge-on-save: Sincronizar colunas estruturadas com o JSON de engenharia (Cadeia da Verdade)
    let extracted = {};
    if (designData) {
      const metrics = extractDesignMetrics(designData);
      const cd = (typeof designData === 'string' ? JSON.parse(designData) : designData).solar?.clientData || {};
      
      extracted = {
        latitude: metrics.lat || latitude,
        longitude: metrics.lng || longitude,
        clientName: metrics.clientName || cd.clientName || null,
        city: metrics.city || cd.city || null,
        state: metrics.state || cd.state || null,
        averageConsumption: metrics.averageConsumptionKwh || 0,
        targetPowerKwp: metrics.targetPowerKwp || 0
      };
    }

    const design = await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { 
        designData, 
        name, 
        status, 
        notes, 
        ...extracted 
      }
    });
    res.json({ success: true, data: design });
  } catch (error) {
    logger.error('[PUT /designs/:id] Error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedBy: req.user.id, status: 'ARCHIVED' }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

module.exports = router;
