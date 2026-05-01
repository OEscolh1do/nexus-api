const express = require('express');
const axios = require('axios');
const prismaIaca = require('../lib/prismaIaca');
const prismaKurupira = require('../lib/prismaKurupira');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

// ============================================
// GET /admin/system/health — Status dos serviços
// ============================================
router.get('/health', async (req, res) => {
  const probeService = async (name, url) => {
    const start = Date.now();
    try {
      // Timeout estrito de 3s conforme spec
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

  // Promise.allSettled para garantir que probes lentas não bloqueiem o resto
  const probes = await Promise.allSettled([
    probeService('Iaçã', process.env.IACA_INTERNAL_URL),
    probeService('Kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('MySQL (Iaçã)', prismaIaca),
    probeDb('MySQL (Kurupira)', prismaKurupira),
  ]);

  const results = probes.map(p => p.status === 'fulfilled' ? p.value : { status: 'error' });
  const allHealthy = results.every(r => r.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    checkedAt: new Date().toISOString(),
  });
});

// ============================================
// GET /admin/system/info — Informações de Ambiente
// ============================================
router.get('/info', (req, res) => {
  const envVars = [
    'JWT_SECRET',
    'M2M_SERVICE_TOKEN',
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
    
    // Lista detalhada das últimas 100 sessões ativas
    const sessions = await prismaIaca.session.findMany({
      where: { expiresAt: { gt: now } },
      take: 100,
      orderBy: { createdAt: 'desc' },
      // Nota: Como não temos relação direta no Prisma RO do Admin, 
      // fazemos uma query manual para buscar nomes se necessário ou retornamos o ID
    });

    // Enriquecer com dados de usuário (busca em lote)
    const userIds = [...new Set(sessions.map(s => s.userId))];
    const users = await prismaIaca.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullName: true, tenantId: true }
    });

    const tenants = await prismaIaca.tenant.findMany({
      where: { id: { in: users.map(u => u.tenantId) } },
      select: { id: true, name: true }
    });

    const enriched = sessions.map(session => {
      const user = users.find(u => u.id === session.userId);
      const tenant = tenants.find(t => t.id === user?.tenantId);
      return {
        ...session,
        user: user ? { username: user.username, fullName: user.fullName } : null,
        tenant: tenant ? { name: tenant.name } : null
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE /admin/system/sessions/:id — Revogar
// ============================================
router.delete('/sessions/:id', async (req, res) => {
  try {
    await iacaClient.delete(`/internal/sessions/${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ============================================
// DELETE /admin/system/users/:id/sessions — Flush
// ============================================
router.delete('/users/:id/sessions', async (req, res) => {
  try {
    await iacaClient.delete(`/internal/users/${req.params.id}/sessions`);
    res.json({ success: true });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

module.exports = router;
