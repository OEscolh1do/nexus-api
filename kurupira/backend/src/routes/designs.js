const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { fetchLeadContext, fetchLeadsBatch } = require('../services/m2mClient');
const { extractDesignMetrics } = require('../utils/designMetrics');
const { createDesignSchema, updateDesignSchema, validate } = require('../validation/designs');

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

    const leadIds = [...new Set(designs.map(d => d.iacaLeadId).filter(Boolean))];
    const leads = leadIds.length > 0 ? await fetchLeadsBatch(leadIds) : [];
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

    const enriched = designs.map(d => {
      const metrics = extractDesignMetrics(d.designData);
      return {
        ...d,
        designData: undefined,
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
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null },
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
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.get('/:id/lead-context', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null },
      select: { iacaLeadId: true }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });
    if (!design.iacaLeadId) return res.json({ success: true, data: null });

    const leadContext = await fetchLeadContext(design.iacaLeadId);
    res.json({ success: true, data: leadContext || { unavailable: true, message: 'Contexto comercial indisponível' } });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/', authenticateToken, validate(createDesignSchema), async (req, res) => {
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
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.put('/:id', authenticateToken, validate(updateDesignSchema), async (req, res) => {
  try {
    const existing = await prisma.technicalDesign.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const { designData, name, status, notes, latitude, longitude } = req.body;
    const design = await prisma.technicalDesign.update({
      where: { id: req.params.id },
      data: { designData, name, status, notes, latitude, longitude }
    });
    res.json({ success: true, data: design });
  } catch (error) {
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

router.post('/:designId/roof-sections', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.designId, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });

    const section = await prisma.roofSection.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/:designId/pv-arrays', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.designId, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });

    const pvArray = await prisma.pVArray.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: pvArray });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/:designId/simulations', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.technicalDesign.findFirst({
      where: { id: req.params.designId, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!design) return res.status(404).json({ success: false, error: 'Design not found' });

    const simulation = await prisma.simulation.create({
      data: { technicalDesignId: req.params.designId, ...req.body }
    });
    res.status(201).json({ success: true, data: simulation });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

module.exports = router;
