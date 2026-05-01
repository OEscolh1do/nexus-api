const express = require('express');
const prismaIaca = require('../lib/prismaIaca');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

// ─── Helper: guard self-modification ─────────────────────────────────────────
function isSelf(req, targetUserId) {
  return req.operator?.id === targetUserId || req.operator?.sub === targetUserId;
}

// ============================================
// POST /admin/users — Criar usuário
// Fonte: M2M → Iaçã API
// ============================================
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, role, tenantId, jobTitle } = req.body;

    if (!username || !password || !fullName || !role || !tenantId) {
      return res.status(400).json({ error: 'Campos obrigatórios: username, senha, nome completo, role, organização' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
    }

    const response = await iacaClient.post('/internal/users', {
      username: username.trim(),
      password,
      fullName: fullName.trim(),
      role,
      tenantId,
      jobTitle: jobTitle?.trim() || undefined,
    });

    res.status(201).json({ data: response.data.data, message: 'Usuário criado com sucesso. O usuário deverá trocar a senha no primeiro acesso.' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao criar usuário';
    console.error('[Users] Erro M2M (POST):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// GET /admin/users — Listar usuários cross-tenant
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, tenantId, role, q } = req.query;
    const take = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * take;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { username: { contains: q } },
        { fullName: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      prismaIaca.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          jobTitle: true,
          tenantId: true,
          // status: true, // REMOVIDO: Campo não existe no schema.prisma
          createdAt: true,
          updatedAt: true,
          tenant: { select: { id: true, name: true, apiPlan: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prismaIaca.user.count({ where }),
    ]);

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('[Users] Erro ao listar:', error.message);
    res.status(500).json({ error: 'Falha ao listar usuários' });
  }
});

// ============================================
// GET /admin/users/:id — Detalhar usuário
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const user = await prismaIaca.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        jobTitle: true,
        tenantId: true,
        orgUnitId: true,
        // status: true, // REMOVIDO: Campo não existe no schema.prisma
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, type: true, apiPlan: true } },
        auditLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: { id: true, action: true, entity: true, timestamp: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('[Users] Erro ao detalhar:', error.message);
    res.status(500).json({ error: 'Falha ao buscar usuário' });
  }
});

// ============================================
// PATCH /admin/users/:id — Alterar usuário (ex: role)
// Fonte: M2M → Iaçã API
// ============================================
router.patch('/:id', async (req, res) => {
  try {
    if (isSelf(req, req.params.id)) {
      return res.status(403).json({ error: 'Você não pode alterar seu próprio nível de acesso' });
    }

    const response = await iacaClient.patch(`/internal/users/${req.params.id}`, req.body);
    res.json({ data: response.data, message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar usuário';
    console.error('[Users] Erro M2M (PATCH):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/users/:id/block — Bloquear usuário
// Fonte: M2M → Iaçã API
// ============================================
router.post('/:id/block', async (req, res) => {
  try {
    if (isSelf(req, req.params.id)) {
      return res.status(403).json({ error: 'Você não pode bloquear a si próprio' });
    }

    const user = await prismaIaca.user.findUnique({
      where: { id: req.params.id },
      select: { role: true },
    });

    if (user?.role === 'PLATFORM_ADMIN') {
      // Extra safety check: usually you wouldn't block a platform admin easily
      // Let's assume M2M handles the "last admin" logic, but we can log a warning
      console.warn(`[Users] PLATFORM_ADMIN ${req.params.id} is being blocked by another admin.`);
    }

    const response = await iacaClient.patch(`/internal/users/${req.params.id}`, {
      status: 'BLOCKED',
    });
    res.json({ data: response.data, message: 'Usuário bloqueado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao bloquear usuário';
    console.error('[Users] Erro M2M (block):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/users/:id/unblock — Desbloquear usuário
// ============================================
router.post('/:id/unblock', async (req, res) => {
  try {
    const response = await iacaClient.patch(`/internal/users/${req.params.id}`, {
      status: 'ACTIVE',
    });
    res.json({ data: response.data, message: 'Usuário desbloqueado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao desbloquear usuário';
    console.error('[Users] Erro M2M (unblock):', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/users/:id/reset-password — Reset de senha
// Fonte: M2M → Iaçã API
// ============================================
router.post('/:id/reset-password', async (req, res) => {
  try {
    // Calling Iaca internal which does the logic.
    await iacaClient.post(`/internal/users/${req.params.id}/reset-password`);
    // NOTE: Spec says "Não deve retornar a senha gerada no response." 
    // We only return success message.
    res.json({
      message: 'Reset de senha solicitado. A instrução foi enviada ou registrada no Iaçã.',
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao redefinir senha';
    console.error('[Users] Erro M2M reset-password:', message);
    res.status(status).json({ error: message });
  }
});

module.exports = router;
