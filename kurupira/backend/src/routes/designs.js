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
  console.log('[GET /designs] Entrou na rota. User:', JSON.stringify(req.user));
  try {
    console.log('[GET /designs] Buscando no banco com tenantId:', req.user.tenantId);
    const designs = await prisma.technicalDesign.findMany({
      where: { tenantId: req.user.tenantId, status: { not: 'ARCHIVED' }, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
    console.log(`[GET /designs] Designs encontrados: ${designs.length}`);

    // Enriquecimento com métricas calculadas do designData (Power, Consumption, etc)
    const enrichedDesigns = designs.map((d, index) => {
      console.log(`[GET /designs] Enriquecendo design [${index}] ID: ${d.id}...`);
      try {
        const metrics = extractDesignMetrics(d.designData);
        return { ...d, ...metrics };
      } catch (err) {
        console.error(`[GET /designs] Erro ao extrair métricas do design ${d.id}:`, err.message);
        return d;
      }
    });

    console.log('[GET /designs] Enviando resposta...');
    res.json({ success: true, data: enrichedDesigns });
  } catch (error) {
    console.error('[GET /designs] Erro fatal na rota:', error);
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
  const { designData, name, status, notes, latitude, longitude } = req.body;
  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const design = await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { designData, name, status, notes, latitude, longitude }
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
