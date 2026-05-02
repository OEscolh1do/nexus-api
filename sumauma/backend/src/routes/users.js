const express = require('express');
const bcrypt = require('bcryptjs');
const prismaSumauma = require('../lib/prismaSumauma');
const { createLogtoUser } = require('../lib/logtoClient');

const router = express.Router();

// ─── Helper: guard self-modification ─────────────────────────────────────────
function isSelf(req, targetUserId) {
  return req.operator?.id === targetUserId || req.operator?.sub === targetUserId;
}

// ============================================
// POST /admin/users — Criar usuário (MASTER)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, role, roleId, tenantId, jobTitle, orgUnitId } = req.body;

    if (!username || !password || !fullName || !tenantId) {
      return res.status(400).json({ error: 'Campos obrigatórios: username, senha, nome completo, organização' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
    }

    // ── POKA-YOKE: Operadores de plataforma jamais podem ser criados via HTTP ──
    if (role === 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'Acesso negado: Operadores de plataforma devem ser criados via script CLI no servidor.',
        code: 'PLATFORM_ADMIN_CREATION_FORBIDDEN'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Criar no Banco Local (Fundação)
    const user = await prismaSumauma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        role: role || 'ENGINEER', // Mantido para retrocompatibilidade
        roleId: roleId || undefined,
        tenantId,
        orgUnitId,
        jobTitle: jobTitle?.trim() || undefined,
        status: 'ACTIVE'
      }
    });

    // 2. Criar Shadow Auth no Logto
    try {
      const logtoUserId = await createLogtoUser(tenantId, {
        username: username.trim(),
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || 'User',
        email: `${username.trim()}@neonorte.local`,
        password,
      });
      
      await prismaSumauma.user.update({
        where: { id: user.id },
        data: { authProviderId: logtoUserId }
      });
    } catch (zErr) {
      console.warn(`[Logto] Aviso: Falha ao criar usuário no Logto para o user ${user.id}`);
    }

    res.status(201).json({ data: user, message: 'Usuário criado com sucesso na Fundação' });
  } catch (error) {
    console.error('[Users] Erro ao criar:', error.message);
    res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

// ============================================
// GET /admin/users — Listar usuários cross-tenant
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
      prismaSumauma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          roleRef: { select: { id: true, name: true, level: true } },
          jobTitle: true,
          tenantId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          tenant: { select: { id: true, name: true, apiPlan: true } },
          orgUnit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prismaSumauma.user.count({ where }),
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
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const user = await prismaSumauma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        roleRef: { select: { id: true, name: true, level: true, permissions: { select: { permission: { select: { slug: true } } } } } },
        jobTitle: true,
        tenantId: true,
        orgUnitId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, type: true, apiPlan: true } },
        orgUnit: { select: { id: true, name: true } },
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
// PATCH /admin/users/:id — Alterar usuário
// ============================================
router.patch('/:id', async (req, res) => {
  try {
    if (isSelf(req, req.params.id)) {
      return res.status(403).json({ error: 'Você não pode alterar seu próprio nível de acesso' });
    }

    // ── POKA-YOKE: Impedir promoção para PLATFORM_ADMIN via API ──
    if (req.body.role === 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'Acesso negado: Não é permitido promover usuários para Operador de Plataforma via interface.',
        code: 'PLATFORM_ADMIN_PROMOTION_FORBIDDEN'
      });
    }

    // Remover campos protegidos do payload para evitar injeção
    const { role, ...safeData } = req.body;
    const allowedRole = role && role !== 'PLATFORM_ADMIN' ? role : undefined;

    const updated = await prismaSumauma.user.update({
      where: { id: req.params.id },
      data: { ...safeData, ...(allowedRole ? { role: allowedRole } : {}) }
    });
    res.json({ data: updated, message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('[Users] Erro ao atualizar:', error.message);
    res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
});

// ============================================
// POST /admin/users/:id/block — Bloquear usuário
// ============================================
router.post('/:id/block', async (req, res) => {
  try {
    if (isSelf(req, req.params.id)) {
      return res.status(403).json({ error: 'Você não pode bloquear a si próprio' });
    }

    await prismaSumauma.user.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' }
    });
    res.json({ message: 'Usuário bloqueado com sucesso' });
  } catch (error) {
    console.error('[Users] Erro ao bloquear:', error.message);
    res.status(500).json({ error: 'Falha ao bloquear usuário' });
  }
});

// ============================================
// POST /admin/users/:id/unblock — Desbloquear usuário
// ============================================
router.post('/:id/unblock', async (req, res) => {
  try {
    await prismaSumauma.user.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' }
    });
    res.json({ message: 'Usuário desbloqueado com sucesso' });
  } catch (error) {
    console.error('[Users] Erro ao desbloquear:', error.message);
    res.status(500).json({ error: 'Falha ao desbloquear usuário' });
  }
});

// ============================================
// POST /admin/users/:id/reset-password — Reset de senha
// ============================================
router.post('/:id/reset-password', async (req, res) => {
  try {
    // Para simplificar agora, apenas marcamos que ele deve trocar a senha
    await prismaSumauma.user.update({
      where: { id: req.params.id },
      data: { mustChangePassword: true }
    });
    res.json({
      message: 'Reset de senha solicitado. O usuário deverá trocar a senha no próximo acesso.',
    });
  } catch (error) {
    console.error('[Users] Erro ao resetar senha:', error.message);
    res.status(500).json({ error: 'Falha ao redefinir senha' });
  }
});

module.exports = router;
