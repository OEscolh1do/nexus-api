const express = require('express');
const prismaIaca = require('../lib/prismaIaca');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

// ============================================
// GET /admin/tenants — Listar organizações
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, plan, type, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.type = status; // TODO: Add status field when Iaçã supports it
    if (plan) where.apiPlan = plan;
    if (type) where.type = type;
    if (q) where.name = { contains: q };

    const [tenants, total] = await Promise.all([
      prismaIaca.tenant.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          _count: { select: { users: true, auditLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prismaIaca.tenant.count({ where }),
    ]);

    res.json({
      data: tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Tenants] Erro ao listar:', error.message);
    res.status(500).json({ error: 'Falha ao listar organizações' });
  }
});

// ============================================
// GET /admin/tenants/:id — Detalhar organização
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const tenant = await prismaIaca.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, username: true, fullName: true, role: true, createdAt: true },
        },
        _count: { select: { users: true, auditLogs: true } },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Organização não encontrada' });
    }

    res.json({ data: tenant });
  } catch (error) {
    console.error('[Tenants] Erro ao detalhar:', error.message);
    res.status(500).json({ error: 'Falha ao buscar organização' });
  }
});

// ============================================
// PUT /admin/tenants/:id — Editar organização
// Fonte: M2M → Iaçã API
// ============================================
router.put('/:id', async (req, res) => {
  try {
    // Verificar se não é o tenant MASTER
    const tenant = await prismaIaca.tenant.findUnique({
      where: { id: req.params.id },
      select: { type: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Organização não encontrada' });
    }

    if (tenant.type === 'MASTER') {
      return res.status(403).json({ error: 'O tenant MASTER não pode ser modificado' });
    }

    const response = await iacaClient.put(`/internal/tenants/${req.params.id}`, req.body);
    res.json({ data: response.data, message: 'Organização atualizada com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar organização';
    console.error('[Tenants] Erro M2M:', message);
    res.status(status).json({ error: message });
  }
});

module.exports = router;
