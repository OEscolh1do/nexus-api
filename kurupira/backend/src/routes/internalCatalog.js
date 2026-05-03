const { Router } = require('express');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const validateM2M = require('../middleware/validateM2M');
const catalogService = require('../services/catalogService');
const { invalidateCache } = require('../lib/cache');
const logger = require('../lib/logger');

// Bucket único para todos os callers M2M — máximo 60 ops/min (1/s)
const internalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: () => 'internal-m2m',
  handler: (req, res) => {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Rate limit excedido para operações M2M. Tente em 60s.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const safeError = (err) =>
  process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

// --- Idempotency store (in-memory, 24h TTL) ---
const _idempotencyStore = new Map();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;

function idempotencyCheck(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const entry = _idempotencyStore.get(key);
  if (entry) {
    if (Date.now() < entry.exp) {
      return res.status(200).json(entry.response);
    }
    _idempotencyStore.delete(key);
  }

  res.idempotencyKey = key;
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 400 && res.idempotencyKey) {
      _idempotencyStore.set(res.idempotencyKey, { response: body, exp: Date.now() + IDEMPOTENCY_TTL });
    }
    return originalJson(body);
  };
  next();
}

// --- Correlation ID middleware ---
function correlationId(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
}

const router = Router();
router.use(internalRateLimit, validateM2M, correlationId);

// --- MÓDULOS M2M ---

router.post('/modules', idempotencyCheck, async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ success: false, error: 'filename e content são obrigatórios.' });
  }
  try {
    const module = await catalogService.processPanUpload(filename, content);
    invalidateCache('catalog:modules');
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    logger.error('M2M Catalog error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.patch('/modules/:id', async (req, res) => {
  try {
    const module = await prisma.moduleCatalog.update({
      where: { id: req.params.id },
      data: req.body
    });
    invalidateCache('catalog:modules');
    res.json({ success: true, data: module });
  } catch (error) {
    logger.error('M2M Catalog error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.delete('/modules/:id', async (req, res) => {
  try {
    await prisma.moduleCatalog.delete({ where: { id: req.params.id } });
    invalidateCache('catalog:modules');
    res.json({ success: true, message: 'Módulo excluído' });
  } catch (error) {
    logger.error('M2M Catalog delete error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

// --- INVERSORES M2M ---

router.post('/inverters', idempotencyCheck, async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ success: false, error: 'filename e content são obrigatórios.' });
  }
  try {
    const inverter = await catalogService.processOndUpload(filename, content);
    invalidateCache('catalog:inverters');
    res.status(201).json({ success: true, data: inverter });
  } catch (error) {
    logger.error('M2M Catalog error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.patch('/inverters/:id', async (req, res) => {
  try {
    const inverter = await prisma.inverterCatalog.update({
      where: { id: req.params.id },
      data: req.body
    });
    invalidateCache('catalog:inverters');
    res.json({ success: true, data: inverter });
  } catch (error) {
    logger.error('M2M Catalog error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

router.delete('/inverters/:id', async (req, res) => {
  try {
    await prisma.inverterCatalog.delete({ where: { id: req.params.id } });
    invalidateCache('catalog:inverters');
    res.json({ success: true, message: 'Inversor excluído' });
  } catch (error) {
    logger.error('M2M Catalog delete error', { cid: req.correlationId, err: error.message });
    res.status(500).json({ success: false, error: safeError(error) });
  }
});

module.exports = router;
