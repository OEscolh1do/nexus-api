const express = require('express');
const axios = require('axios');
const prismaIaca = require('../lib/prismaIaca');
const prismaKurupira = require('../lib/prismaKurupira');

const router = express.Router();

// ============================================
// GET /admin/system/health — Status dos serviços
// Fonte: HTTP probes + DB probes
// ============================================
router.get('/health', async (req, res) => {
  const results = {
    iaca: { status: 'unknown', latencyMs: null },
    kurupira: { status: 'unknown', latencyMs: null },
    dbIaca: { status: 'unknown' },
    dbKurupira: { status: 'unknown' },
  };

  const probeService = async (name, url) => {
    const start = Date.now();
    try {
      const resp = await axios.get(`${url}/health`, { timeout: 5000 });
      results[name] = {
        status: resp.status === 200 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - start,
      };
    } catch {
      results[name] = { status: 'down', latencyMs: Date.now() - start };
    }
  };

  const probeDb = async (name, prismaClient) => {
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      results[name] = { status: 'healthy' };
    } catch {
      results[name] = { status: 'down' };
    }
  };

  await Promise.all([
    probeService('iaca', process.env.IACA_INTERNAL_URL),
    probeService('kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('dbIaca', prismaIaca),
    probeDb('dbKurupira', prismaKurupira),
  ]);

  const allHealthy = Object.values(results).every((r) => r.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    checkedAt: new Date().toISOString(),
  });
});

// ============================================
// GET /admin/system/jobs — Status dos CronLocks
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/jobs', async (req, res) => {
  try {
    const locks = await prismaIaca.cronLock.findMany();

    const jobs = locks.map((lock) => ({
      id: lock.id,
      lastRun: lock.lockedAt,
      expiresAt: lock.expiresAt,
      isExpired: new Date() > lock.expiresAt,
    }));

    res.json({ data: jobs });
  } catch (error) {
    console.error('[System] Erro ao buscar jobs:', error.message);
    res.status(500).json({ error: 'Falha ao buscar status dos jobs' });
  }
});

// ============================================
// GET /admin/system/sessions — Sessões ativas
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/sessions', async (req, res) => {
  try {
    const now = new Date();

    const [active, expired] = await Promise.all([
      prismaIaca.session.count({ where: { expiresAt: { gt: now } } }),
      prismaIaca.session.count({ where: { expiresAt: { lte: now } } }),
    ]);

    res.json({
      data: {
        active,
        expired,
        total: active + expired,
      },
    });
  } catch (error) {
    console.error('[System] Erro ao buscar sessões:', error.message);
    res.status(500).json({ error: 'Falha ao buscar sessões' });
  }
});

// ============================================
// GET /admin/system/api-usage — Uso de API por tenant
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/api-usage', async (req, res) => {
  try {
    const tenants = await prismaIaca.tenant.findMany({
      where: { apiPlan: { not: 'FREE' } },
      select: {
        id: true,
        name: true,
        apiPlan: true,
        apiMonthlyQuota: true,
        apiCurrentUsage: true,
      },
      orderBy: { apiCurrentUsage: 'desc' },
    });

    const data = tenants.map((t) => ({
      ...t,
      usagePercent: t.apiMonthlyQuota > 0
        ? Math.round((t.apiCurrentUsage / t.apiMonthlyQuota) * 100)
        : 0,
      isNearLimit: t.apiMonthlyQuota > 0 && (t.apiCurrentUsage / t.apiMonthlyQuota) >= 0.8,
    }));

    res.json({ data });
  } catch (error) {
    console.error('[System] Erro ao buscar uso de API:', error.message);
    res.status(500).json({ error: 'Falha ao buscar uso de API' });
  }
});

module.exports = router;
