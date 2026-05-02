const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');

const router = express.Router();

// ============================================
// GET /admin/audit-logs — Listar logs de auditoria
// Fonte: Prisma Master → db_sumauma
// ============================================
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      tenantId,
      userId,
      action,
      entity,
      dateFrom,
      dateTo,
      q,
      resourceId,
    } = req.query;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (entity) where.entity = entity;
    if (resourceId) where.resourceId = resourceId;
    if (q) where.details = { contains: q };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const limitNum = Number(limit);
    
    const queryOptions = {
      where,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        tenant: { select: { id: true, name: true } },
      },
    };

    // Paginação por cursor
    const { cursor } = req.query;
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Pular o próprio cursor
    }

    const [logs, total] = await Promise.all([
      prismaSumauma.auditLog.findMany(queryOptions),
      prismaSumauma.auditLog.count({ where }),
    ]);

    const nextCursor = logs.length === limitNum ? logs[logs.length - 1].id : null;

    res.json({
      data: logs,
      pagination: {
        total,
        nextCursor,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[AuditLogs] Erro ao listar:', error.message);
    res.json({ data: [], pagination: { total: 0, limit: 50 } });
  }
});

// ============================================
// GET /admin/audit-logs/:id — Detalhar um log
// Fonte: Prisma Master → db_sumauma
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const log = await prismaSumauma.auditLog.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, fullName: true, role: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Log de auditoria não encontrado' });
    }

    res.json({ data: log });
  } catch (error) {
    console.error('[AuditLogs] Erro ao detalhar:', error.message);
    res.status(500).json({ error: 'Falha ao buscar log de auditoria' });
  }
});

// ============================================
// GET /admin/audit-logs/stats/summary — Estatísticas
// Fonte: Prisma Master → db_sumauma
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24hCount, last7dCount] = await Promise.all([
      prismaSumauma.auditLog.count(),
      prismaSumauma.auditLog.count({ where: { timestamp: { gte: last24h } } }),
      prismaSumauma.auditLog.count({ where: { timestamp: { gte: last7d } } }),
    ]);

    res.json({
      data: {
        total,
        last24h: last24hCount,
        last7d: last7dCount,
      },
    });
  } catch (error) {
    console.error('[AuditLogs] Erro ao buscar stats:', error.message);
    res.json({ data: { total: 0, last24h: 0, last7d: 0 } });
  }
});

// ============================================
// GET /admin/audit-logs/export — Exportar CSV
// Fonte: Prisma Master → db_sumauma
// ============================================
router.get('/export', async (req, res) => {
  try {
    const { tenantId, userId, action, entity, resourceId, dateFrom, dateTo, q } = req.query;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (entity) where.entity = entity;
    if (resourceId) where.resourceId = resourceId;
    if (q) where.details = { contains: q };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const logs = await prismaSumauma.auditLog.findMany({
      where,
      take: 5000,
      include: {
        user: { select: { username: true } },
        tenant: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    let csv = 'Timestamp,Usuario,Tenant,Acao,Entidade,IP,Detalhes\n';
    logs.forEach((log) => {
      const ts = new Date(log.timestamp).toISOString();
      const user = log.user?.username || 'N/A';
      const tenant = log.tenant?.name || 'N/A';
      const act = log.action;
      const ent = log.entity || 'N/A';
      const ip = log.ipAddress || 'N/A';
      const det = (log.details || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${ts},${user},${tenant},${act},${ent},${ip},${det}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('[AuditLogs] Erro ao exportar CSV:', error.message);
    res.status(500).json({ error: 'Falha ao exportar logs' });
  }
});

module.exports = router;
