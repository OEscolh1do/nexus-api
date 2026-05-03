const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { upload, validateMagicBytes } = require('../middleware/upload');
const { getCache, setCache, invalidateCache } = require('../lib/cache');

const safeError = (err) =>
  process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

const router = Router();

// --- MODULES ---

router.get('/modules', authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page || limit) {
      // Paginated path — bypass cache
      const take = Math.min(Number(limit) || 50, 200);
      const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
      const [data, total] = await Promise.all([
        prisma.moduleCatalog.findMany({ where: { isActive: true }, orderBy: { manufacturer: 'asc' }, take, skip }),
        prisma.moduleCatalog.count({ where: { isActive: true } }),
      ]);
      return res.json({ success: true, data, pagination: { page: Number(page) || 1, limit: take, total, totalPages: Math.ceil(total / take) } });
    }
    const cached = getCache('catalog:modules');
    if (cached) return res.json({ success: true, data: cached });
    const modules = await prisma.moduleCatalog.findMany({
      where: { isActive: true },
      orderBy: { manufacturer: 'asc' },
      take: 200,
    });
    setCache('catalog:modules', modules);
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/modules', authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const module = await prisma.moduleCatalog.create({
      data: { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef }
    });
    invalidateCache('catalog:modules');
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.put('/modules/:id', authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: { manufacturer, model, powerWp, efficiency, dimensions, weight, datasheet, isActive, electricalData, unifilarSymbolRef }
    });
    invalidateCache('catalog:modules');
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/modules/:id/image', authenticateToken, upload.single('image'), validateMagicBytes, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const imageUrl = `/uploads/catalog/${req.file.filename}`;
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

// --- INVERTERS ---

router.get('/inverters', authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page || limit) {
      const take = Math.min(Number(limit) || 50, 200);
      const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
      const [data, total] = await Promise.all([
        prisma.inverterCatalog.findMany({ where: { isActive: true }, orderBy: { manufacturer: 'asc' }, take, skip }),
        prisma.inverterCatalog.count({ where: { isActive: true } }),
      ]);
      return res.json({ success: true, data, pagination: { page: Number(page) || 1, limit: take, total, totalPages: Math.ceil(total / take) } });
    }
    const cached = getCache('catalog:inverters');
    if (cached) return res.json({ success: true, data: cached });
    const inverters = await prisma.inverterCatalog.findMany({
      where: { isActive: true },
      orderBy: { manufacturer: 'asc' },
      take: 200,
    });
    setCache('catalog:inverters', inverters);
    res.json({ success: true, data: inverters });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/inverters', authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const inverter = await prisma.inverterCatalog.create({
      data: { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef }
    });
    invalidateCache('catalog:inverters');
    res.status(201).json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.put('/inverters/:id', authenticateToken, async (req, res) => {
  try {
    const { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef } = req.body;
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: { manufacturer, model, nominalPowerW, maxInputV, mpptCount, efficiency, datasheet, isActive, electricalData, unifilarSymbolRef }
    });
    invalidateCache('catalog:inverters');
    res.json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.post('/inverters/:id/image', authenticateToken, upload.single('image'), validateMagicBytes, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const imageUrl = `/uploads/catalog/${req.file.filename}`;
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });
    res.json({ success: true, data: inverter });
  } catch (error) {
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

module.exports = router;
