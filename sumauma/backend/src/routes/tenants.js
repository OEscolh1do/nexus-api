const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const { createLogtoOrg } = require('../lib/logtoClient');
const { iacaClient } = require('../lib/m2mClient');
const { auditLog } = require('../lib/auditLogger');
const logger = require('../lib/logger');

const router = express.Router();

const ctx = (req) => ({
  operator: req.operator,
  ipAddress: req.ip || req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
});

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
    const { name, apiPlan, apiMonthlyQuota, type } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome da organização é obrigatório (mínimo 2 caracteres)' });
    }

    // Validar tipo (poka-yoke)
    const allowedTypes = ['INDIVIDUAL', 'CORPORATE'];
    const tenantType = allowedTypes.includes(type) ? type : 'CORPORATE';

    // 1. Criar no Banco Local (Fundação)
    const tenant = await prismaSumauma.tenant.create({
      data: {
        name: name.trim(),
        apiPlan: apiPlan || 'FREE',
        apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
        type: tenantType // NUNCA aceita 'MASTER' da request
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
      logger.warn('Falha ao criar org no Logto', { tenantId: tenant.id });
    }

    await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_TENANT', entity: 'Tenant', resourceId: tenant.id, details: `Organização criada: ${tenant.name} (plan=${tenant.apiPlan})`, after: { id: tenant.id, name: tenant.name, apiPlan: tenant.apiPlan } });

    res.status(201).json({ data: tenant, message: 'Organização criada com sucesso na Fundação' });
  } catch (error) {
    logger.error('Erro ao criar tenant', { err: error.message });
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

    // POKA-YOKE: Tenant MASTER é infraestrutura de plataforma, não um cliente gerenciável
    const where = { type: { not: 'MASTER' } };
    if (plan) where.apiPlan = plan;
    if (type && type !== 'MASTER') where.type = type;
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
    logger.error('Erro ao listar tenants', { err: error.message });
    res.status(500).json({ error: 'Falha ao listar organizações' });
  }
});

// ============================================
// GET /admin/tenants/options — Dropdown options
// ============================================
router.get('/options', async (req, res) => {
  try {
    const tenants = await prismaSumauma.tenant.findMany({
      // POKA-YOKE: Excluir MASTER do dropdown de opções de organização
      where: { status: 'ACTIVE', type: { not: 'MASTER' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: tenants });
  } catch (error) {
    logger.error('Erro ao listar tenant options', { err: error.message });
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
    logger.error('Erro ao detalhar tenant', { err: error.message });
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

    const ALLOWED_PATCH_FIELDS = [
      'name', 'apiPlan', 'apiMonthlyQuota', 'apiCurrentUsage',
      'ssoProvider', 'ssoDomain', 'ssoEnforced', 'status', 'type'
    ];
    const PROTECTED_TYPE_VALUES = ['MASTER'];

    const rawData = req.body;
    const safeData = Object.fromEntries(
      Object.entries(rawData).filter(([key]) => ALLOWED_PATCH_FIELDS.includes(key))
    );

    // Nunca permitir promoção para MASTER via PATCH
    if (safeData.type && PROTECTED_TYPE_VALUES.includes(safeData.type)) {
      return res.status(403).json({
        error: 'Não é permitido alterar o tipo para MASTER via interface.',
        code: 'MASTER_PROMOTION_FORBIDDEN'
      });
    }

    // Validar valores permitidos de type
    if (safeData.type && !['INDIVIDUAL', 'CORPORATE'].includes(safeData.type)) {
      return res.status(400).json({ error: 'Tipo inválido. Use INDIVIDUAL ou CORPORATE.' });
    }

    const updated = await prismaSumauma.tenant.update({
      where: { id: req.params.id },
      data: safeData
    });

    await auditLog({ ...ctx(req), action: 'ADMIN_UPDATE_TENANT', entity: 'Tenant', resourceId: req.params.id, details: `Organização atualizada: ${updated.name}`, after: req.body });

    res.json({ data: updated, message: 'Organização atualizada com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar tenant', { err: error.message });
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

    await auditLog({ ...ctx(req), action: 'ADMIN_BLOCK_TENANT', entity: 'Tenant', resourceId: req.params.id, details: `Tenant bloqueado: ${tenant.name}` });

    res.json({ message: 'Tenant bloqueado com sucesso' });
  } catch (error) {
    logger.error('Erro ao bloquear tenant', { err: error.message });
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

    await auditLog({ ...ctx(req), action: 'ADMIN_UNBLOCK_TENANT', entity: 'Tenant', resourceId: req.params.id, details: `Tenant desbloqueado: ${tenant.name}` });

    res.json({ message: 'Tenant desbloqueado com sucesso' });
  } catch (error) {
    logger.error('Erro ao desbloquear tenant', { err: error.message });
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
    logger.error('Erro M2M PUT tenant', { message });
    res.status(status).json({ error: message });
  }
});


module.exports = router;
