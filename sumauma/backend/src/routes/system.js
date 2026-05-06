const express = require('express');
const axios = require('axios');
const prismaSumauma = require('../lib/prismaSumauma');
const prismaIaca = require('../lib/prismaIaca');
const prismaKurupira = require('../lib/prismaKurupira');
const logger = require('../lib/logger');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

let healthCache = {
  data: null,
  timestamp: 0,
};

// ============================================
// GET /admin/system/health — Status dos serviços
// ============================================
router.get('/health', async (req, res) => {
  const now = Date.now();
  if (healthCache.data && now - healthCache.timestamp < 30000) {
    return res.status(200).json({
      ...healthCache.data,
      fromCache: true,
    });
  }

  const probeService = async (name, url) => {
    const start = Date.now();
    try {
      if (!url) throw new Error('URL não configurada');
      const resp = await axios.get(`${url}/health`, { timeout: 3000 });
      return {
        name,
        status: resp.status === 200 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return { 
        name, 
        status: 'down', 
        latencyMs: Date.now() - start,
        error: err.message 
      };
    }
  };

  const probeDb = async (name, prismaClient) => {
    const start = Date.now();
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      return { name, status: 'healthy', latencyMs: Date.now() - start };
    } catch (err) {
      return { name, status: 'down', latencyMs: Date.now() - start, error: err.message };
    }
  };

  const probes = await Promise.allSettled([
    probeService('Iaçã', process.env.IACA_INTERNAL_URL),
    probeService('Kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('MySQL (Sumaúma)', prismaSumauma),
    probeDb('MySQL (Iaçã)', prismaIaca),
    probeDb('MySQL (Kurupira)', prismaKurupira),
  ]);

  const results = probes.map(p => p.status === 'fulfilled' ? p.value : { status: 'error', name: 'Unknown' });
  const criticalServicesDown = results.some(r => r.status === 'down' || r.status === 'error');
  const allHealthy = results.every(r => r.status === 'healthy');

  const responseData = {
    status: allHealthy ? 'healthy' : (criticalServicesDown ? 'degraded' : 'healthy'),
    services: results,
    checkedAt: new Date().toISOString(),
  };

  healthCache = { data: responseData, timestamp: now };
  // Retornamos 200 mesmo se degradado para evitar spam de 503 no console do navegador,
  // já que o BFF ainda está operacional. A UI tratará o campo 'status'.
  res.status(200).json(responseData);
});

// ============================================
// GET /admin/system/info — Informações de Ambiente
// ============================================
router.get('/info', (req, res) => {
  const envVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'DATABASE_URL_IACA_RO',
    'DATABASE_URL_KURUPIRA_RO',
    'IACA_INTERNAL_URL',
    'KURUPIRA_INTERNAL_URL'
  ];

  const envStatus = envVars.map(name => ({
    name,
    present: !!process.env[name]
  }));

  res.json({
    version: require('../../package.json').version,
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    envStatus
  });
});

// ============================================
// GET /admin/system/sessions — Sessões ativas
// ============================================
router.get('/sessions', async (req, res) => {
  try {
    const now = new Date();
    // No db_sumauma (Master)
    const sessions = await prismaSumauma.session.findMany({
      where: { expiresAt: { gt: now } },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({ data: sessions });
  } catch (error) {
    logger.error('Erro ao listar sessões', { err: error.message });
    res.json({ data: [] }); // Silencioso para não quebrar UI
  }
});

// ============================================
// DELETE /admin/system/sessions/:id — Revogar
// ============================================
router.delete('/sessions/:id', async (req, res) => {
  try {
    await prismaSumauma.session.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /admin/system/jobs — Status dos CronJobs
// ============================================
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prismaSumauma.cronLock.findMany({
      orderBy: { lockedAt: 'desc' },
    });
    res.json({ data: jobs });
  } catch (error) {
    logger.warn('CronLocks não disponíveis no momento');
    res.json({ data: [] });
  }
});

// ============================================
// GET /admin/system/api-usage — Uso de API por Tenant
// ============================================
router.get('/api-usage', async (req, res) => {
  try {
    const tenants = await prismaSumauma.tenant.findMany({
      select: {
        id: true,
        name: true,
        apiPlan: true,
        apiMonthlyQuota: true,
        apiCurrentUsage: true,
      },
      orderBy: { apiCurrentUsage: 'desc' },
    });
    res.json({ data: tenants });
  } catch (error) {
    logger.error('Erro ao listar uso de API', { err: error.message });
    res.json({ data: [] });
  }
});

module.exports = router;
