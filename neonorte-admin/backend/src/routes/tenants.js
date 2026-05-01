const express = require('express');
const prismaIaca = require('../lib/prismaIaca');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

// ─── Helper: guard MASTER tenant ────────────────────────────────────────────
async function assertNotMaster(id, res) {
  const tenant = await prismaIaca.tenant.findUnique({
    where: { id },
    select: { type: true, name: true, _count: { select: { users: true } } },
  });
  if (!tenant) {
    res.status(404).json({ error: 'Organização não encontrada' });
    return null;
  }
  if (tenant.type === 'MASTER') {
    res.status(403).json({ error: 'O tenant MASTER não pode ser modificado' });
    return null;
  }
  return tenant;
}

// ============================================
// POST /admin/tenants — Criar organização
// Fonte: M2M → Iaçã API
// ============================================
router.post('/', async (req, res) => {
  try {
    const { name, apiPlan, apiMonthlyQuota } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome da organização é obrigatório (mínimo 2 caracteres)' });
    }

    const response = await iacaClient.post('/internal/tenants', {
      name: name.trim(),
      apiPlan: apiPlan || 'FREE',
      apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
    });
    res.status(201).json({ data: response.data.data, message: 'Organização criada com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao criar organização';
    console.error('[Tenants] Erro M2M (POST):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// GET /admin/tenants — Listar organizações
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, plan, type, q } = req.query;
    const take = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * take;

    const where = {};
    if (plan) where.apiPlan = plan;
    if (type) where.type = type;
    if (q) where.name = { contains: q };

    const [tenants, total] = await Promise.all([
      prismaIaca.tenant.findMany({
        where,
        skip,
        take,
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
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('[Tenants] Erro ao listar:', error.message);
    res.status(500).json({ error: 'Falha ao listar organizações' });
  }
});

// ============================================
// GET /admin/tenants/options — Dropdown options
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/options', async (req, res) => {
  try {
    const tenants = await prismaIaca.tenant.findMany({
      where: { type: { not: 'MASTER' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: tenants });
  } catch (error) {
    console.error('[Tenants] Erro ao listar options:', error.message);
    res.status(500).json({ error: 'Falha ao listar opções de organizações' });
  }
});

// ============================================
// GET /admin/tenants/:id — Detalhar organização
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const tenant = await prismaIaca.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, username: true, fullName: true, role: true, createdAt: true },
          take: 100,
          orderBy: { createdAt: 'desc' },
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
// PATCH /admin/tenants/:id — Mutação genérica
// Payloads: { apiPlan, apiMonthlyQuota }, { apiCurrentUsage: 0 }
// ============================================
router.patch('/:id', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    const response = await iacaClient.patch(`/internal/tenants/${req.params.id}`, req.body);
    res.json({ data: response.data, message: 'Organização atualizada com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar organização';
    console.error('[Tenants] Erro M2M (PATCH):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/tenants/:id/block — Bloquear tenant (cascata)
// ============================================
router.post('/:id/block', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    const response = await iacaClient.patch(`/internal/tenants/${req.params.id}`, {
      status: 'BLOCKED',
    });
    res.json({
      data: response.data,
      message: `Tenant bloqueado. ${tenant._count.users} usuário(s) afetados.`,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao bloquear organização';
    console.error('[Tenants] Erro M2M (block):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/tenants/:id/unblock — Desbloquear tenant
// ============================================
router.post('/:id/unblock', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    const response = await iacaClient.patch(`/internal/tenants/${req.params.id}`, {
      status: 'ACTIVE',
    });
    res.json({ data: response.data, message: 'Tenant desbloqueado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao desbloquear organização';
    console.error('[Tenants] Erro M2M (unblock):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// PUT /admin/tenants/:id — Retrocompat
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    const response = await iacaClient.put(`/internal/tenants/${req.params.id}`, req.body);
    res.json({ data: response.data, message: 'Organização atualizada com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar organização';
    console.error('[Tenants] Erro M2M (PUT):', message);
    res.status(status).json({ error: message });
  }
});


module.exports = router;
