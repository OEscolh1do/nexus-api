const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const { createLogtoOrg } = require('../lib/logtoClient');

const router = express.Router();

// ─── Helper: guard MASTER tenant ────────────────────────────────────────────
async function assertNotMaster(id, res) {
  const tenant = await prismaSumauma.tenant.findUnique({
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
// POST /admin/tenants — Criar organização (MASTER)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { name, apiPlan, apiMonthlyQuota } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome da organização é obrigatório (mínimo 2 caracteres)' });
    }

    // 1. Criar no Banco Local (Fundação)
    const tenant = await prismaSumauma.tenant.create({
      data: {
        name: name.trim(),
        apiPlan: apiPlan || 'FREE',
        apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
        type: 'SUB_TENANT'
      }
    });

    // 2. Criar Org Shadow Auth no Logto
    try {
      const logtoOrgId = await createLogtoOrg(name.trim());
      await prismaSumauma.tenant.update({
        where: { id: tenant.id },
        data: { ssoProvider: 'LOGTO', ssoDomain: logtoOrgId }
      });
    } catch (zErr) {
      console.warn(`[Logto] Aviso: Falha ao criar org no Logto para o tenant ${tenant.id}`);
    }

    res.status(201).json({ data: tenant, message: 'Organização criada com sucesso na Fundação' });
  } catch (error) {
    console.error('[Tenants] Erro ao criar:', error.message);
    res.status(500).json({ error: 'Falha ao criar organização' });
  }
});

// ============================================
// GET /admin/tenants — Listar organizações
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
      prismaSumauma.tenant.findMany({
        where,
        skip,
        take,
        include: {
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prismaSumauma.tenant.count({ where }),
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
// ============================================
router.get('/options', async (req, res) => {
  try {
    const tenants = await prismaSumauma.tenant.findMany({
      where: { status: 'ACTIVE' },
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
    const tenant = await prismaSumauma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, username: true, fullName: true, role: true, createdAt: true },
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { users: true } },
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
// PATCH /admin/tenants/:id — Atualizar
// ============================================
router.patch('/:id', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    const updated = await prismaSumauma.tenant.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ data: updated, message: 'Organização atualizada com sucesso' });
  } catch (error) {
    console.error('[Tenants] Erro ao atualizar:', error.message);
    res.status(500).json({ error: 'Falha ao atualizar organização' });
  }
});

// ============================================
// POST /admin/tenants/:id/block — Bloquear
// ============================================
router.post('/:id/block', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    await prismaSumauma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' }
    });
    res.json({ message: 'Tenant bloqueado com sucesso' });
  } catch (error) {
    console.error('[Tenants] Erro ao bloquear:', error.message);
    res.status(500).json({ error: 'Falha ao bloquear organização' });
  }
});

// ============================================
// POST /admin/tenants/:id/unblock — Desbloquear
// ============================================
router.post('/:id/unblock', async (req, res) => {
  try {
    const tenant = await assertNotMaster(req.params.id, res);
    if (!tenant) return;

    await prismaSumauma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' }
    });
    res.json({ message: 'Tenant desbloqueado com sucesso' });
  } catch (error) {
    console.error('[Tenants] Erro ao desbloquear:', error.message);
    res.status(500).json({ error: 'Falha ao desbloquear organização' });
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
