const express = require('express');
const prismaIaca = require('../lib/prismaIaca');

const router = express.Router();

// ============================================
// GET /admin/audit-logs — Listar logs de auditoria
// Fonte: Prisma READ-ONLY → db_iaca
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
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (entity) where.entity = entity;
    if (q) where.details = { contains: q };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prismaIaca.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, username: true, fullName: true } },
          tenant: { select: { id: true, name: true } },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prismaIaca.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[AuditLogs] Erro ao listar:', error.message);
    res.status(500).json({ error: 'Falha ao listar logs de auditoria' });
  }
});

// ============================================
// GET /admin/audit-logs/:id — Detalhar um log
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const log = await prismaIaca.auditLog.findUnique({
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
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24hCount, last7dCount] = await Promise.all([
      prismaIaca.auditLog.count(),
      prismaIaca.auditLog.count({ where: { timestamp: { gte: last24h } } }),
      prismaIaca.auditLog.count({ where: { timestamp: { gte: last7d } } }),
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
    res.status(500).json({ error: 'Falha ao buscar estatísticas de auditoria' });
  }
});

module.exports = router;
