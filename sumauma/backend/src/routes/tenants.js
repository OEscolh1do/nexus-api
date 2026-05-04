const express = require('express');
const bcrypt = require('bcryptjs');
const prismaSumauma = require('../lib/prismaSumauma');
const { createLogtoOrg, createLogtoUser, deleteLogtoOrg } = require('../lib/logtoClient');
const { iacaClient } = require('../lib/m2mClient');
const { auditLog } = require('../lib/auditLogger');
const logger = require('../lib/logger');
const { PLAN_SEATS } = require('../lib/constants');

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
    select: { type: true, name: true, apiPlan: true, _count: { select: { users: true } } },
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
    const { name, apiPlan, apiMonthlyQuota, ownerFullName, ownerUsername, ownerPassword, type } = req.body;
    
    const tenantType = type === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'CORPORATE';
    let finalName = name;
    
    if (tenantType === 'INDIVIDUAL') {
      if (!ownerFullName || !ownerUsername || !ownerPassword) {
        return res.status(400).json({ error: 'Para autônomos, os dados do usuário são obrigatórios.' });
      }
      finalName = `Workspace de ${ownerFullName.trim()}`;
    } else {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome da organização é obrigatório para empresas (mínimo 2 caracteres)' });
      }
    }

    // 1. Criar no Banco Local (Fundação)
    const tenant = await prismaSumauma.tenant.create({
      data: {
        name: finalName.trim(),
        apiPlan: apiPlan || 'FREE',
        apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
        type: tenantType
      }
    });

    // 2. Criar Org Shadow Auth no Logto
    let logtoOrgId = null;
    try {
      logtoOrgId = await createLogtoOrg(finalName.trim());
      await prismaSumauma.tenant.update({
        where: { id: tenant.id },
        data: { ssoProvider: 'LOGTO', ssoDomain: logtoOrgId }
      });
    } catch (zErr) {
      logger.error('Falha ao criar org no Logto, revertendo.', { tenantId: tenant.id });
      await prismaSumauma.tenant.delete({ where: { id: tenant.id } });
      return res.status(502).json({ error: 'Falha de integração com o Logto ao criar organização.' });
    }

    await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_TENANT', entity: 'Tenant', resourceId: tenant.id, details: `Organização criada: ${tenant.name} (plan=${tenant.apiPlan})`, after: { id: tenant.id, name: tenant.name, apiPlan: tenant.apiPlan } });

    let createdUser = null;

    // 3. Criar Proprietário (se os dados foram fornecidos)
    if (ownerFullName && ownerUsername && ownerPassword) {
      try {
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        
        createdUser = await prismaSumauma.user.create({
          data: {
            username: ownerUsername.trim(),
            password: hashedPassword,
            fullName: ownerFullName.trim(),
            role: 'ADMIN', // Dono da org
            tenantId: tenant.id,
            status: 'ACTIVE'
          }
        });

        try {
          const logtoUserId = await createLogtoUser(tenant.id, {
            username: ownerUsername.trim(),
            firstName: ownerFullName.split(' ')[0],
            lastName: ownerFullName.split(' ').slice(1).join(' ') || 'User',
            email: `${ownerUsername.trim()}@neonorte.local`,
            password: ownerPassword,
            role: 'ADMIN',
            logtoOrgId,
          });
          
          await prismaSumauma.user.update({
            where: { id: createdUser.id },
            data: { authProviderId: logtoUserId }
          });
        } catch (logtoErr) {
          logger.error('Falha ao criar dono no Logto, revertendo criação do dono local.', { tenantId: tenant.id, userId: createdUser.id });
          await prismaSumauma.user.delete({ where: { id: createdUser.id } });
          createdUser = null;
          // Retornamos um aviso para a interface
          return res.status(201).json({ 
            data: tenant, 
            user: null, 
            message: 'A organização foi criada, mas houve uma falha de rede ao tentar criar o dono no Logto. Adicione o dono manualmente pela aba Usuários.' 
          });
        }

        await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_USER', entity: 'User', resourceId: createdUser.id, details: `Proprietário criado junto com a org: ${createdUser.username}` });
      } catch (userErr) {
        logger.error('Erro ao criar proprietário da org', { err: userErr.message });
        // Não falhamos a request toda se a org já foi criada
      }
    }

    res.status(201).json({ data: tenant, user: createdUser, message: 'Organização criada com sucesso na Fundação' });
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
      select: { 
        id: true, 
        name: true,
        type: true,
        apiPlan: true,
        _count: { select: { users: true } }
      },
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
      'ssoProvider', 'ssoDomain', 'ssoEnforced', 'status'
    ];

    const rawData = req.body;
    const safeData = Object.fromEntries(
      Object.entries(rawData).filter(([key]) => ALLOWED_PATCH_FIELDS.includes(key))
    );

    // POKA-YOKE: Prevenir downgrade de plano se tiver mais usuários que o permitido
    if (safeData.apiPlan && safeData.apiPlan !== tenant.apiPlan) {

      const maxSeats = PLAN_SEATS[safeData.apiPlan] ?? 5;
      
      if (tenant._count.users > maxSeats) {
        return res.status(409).json({
          error: `Não é possível realizar o downgrade. A organização possui ${tenant._count.users} usuários, mas o plano ${safeData.apiPlan} permite apenas ${maxSeats}.`,
          code: 'SEAT_LIMIT_EXCEEDED'
        });
      }
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
// DELETE /admin/tenants/:id — Excluir (Hard Delete)
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenant = await assertNotMaster(tenantId, res);
    if (!tenant) return;

    // 1. Auditoria ANTES de excluir
    await auditLog({ 
      ...ctx(req), 
      action: 'ADMIN_DELETE_TENANT', 
      entity: 'Tenant', 
      resourceId: tenantId, 
      details: `Organização excluída permanentemente: ${tenant.name} (users=${tenant._count.users})`,
      before: { id: tenantId, name: tenant.name }
    });

    // 2. Excluir TODOS os usuários do Logto associados a este tenant ANTES de excluir a Org
    const usersToDelete = await prismaSumauma.user.findMany({
      where: { tenantId, authProviderId: { not: null } },
      select: { authProviderId: true }
    });
    for (const user of usersToDelete) {
      if (user.authProviderId) {
        await deleteLogtoUser(user.authProviderId);
      }
    }

    // 3. Tentar excluir Org no Logto (usamos ssoDomain que guarda o logtoOrgId)
    if (tenant.ssoDomain) {
      await deleteLogtoOrg(tenant.ssoDomain);
    }

    // 4. Exclusão em Transação no Banco Local
    await prismaSumauma.$transaction([
      // Limpar API Keys
      prismaSumauma.tenantApiKey.deleteMany({ where: { tenantId } }),
      // Limpar AuditLogs do Tenant (os que não têm userId ou que pertencem ao tenant)
      prismaSumauma.auditLog.deleteMany({ where: { tenantId } }),
      // Limpar Usuários do Tenant
      prismaSumauma.user.deleteMany({ where: { tenantId } }),
      // Finalmente, excluir o Tenant
      prismaSumauma.tenant.delete({ where: { id: tenantId } })
    ]);

    res.json({ message: 'Organização e dependências excluídas com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir tenant', { tenantId: req.params.id, err: error.message });
    res.status(500).json({ error: 'Falha ao excluir organização. Verifique dependências de dados.' });
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
