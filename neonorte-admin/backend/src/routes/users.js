const express = require('express');
const prismaIaca = require('../lib/prismaIaca');
const { iacaClient } = require('../lib/m2mClient');

const router = express.Router();

// ============================================
// GET /admin/users — Listar usuários cross-tenant
// Fonte: Prisma READ-ONLY → db_iaca
// ============================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, tenantId, role, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

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
        take: Number(limit),
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          jobTitle: true,
          tenantId: true,
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
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
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
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, type: true, apiPlan: true } },
        auditLogs: {
          take: 20,
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
// PUT /admin/users/:id — Editar usuário
// Fonte: M2M → Iaçã API
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const response = await iacaClient.put(`/internal/users/${req.params.id}`, req.body);
    res.json({ data: response.data, message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar usuário';
    console.error('[Users] Erro M2M:', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/users/:id/reset-password — Reset de senha
// Fonte: M2M → Iaçã API
// ============================================
router.post('/:id/reset-password', async (req, res) => {
  try {
    const response = await iacaClient.post(`/internal/users/${req.params.id}/reset-password`);
    res.json({
      data: response.data,
      message: 'Senha redefinida com sucesso. A nova senha temporária foi gerada.',
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao redefinir senha';
    console.error('[Users] Erro M2M reset-password:', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// DELETE /admin/users/:id — Desativar usuário
// Fonte: M2M → Iaçã API
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const response = await iacaClient.delete(`/internal/users/${req.params.id}`);
    res.json({ data: response.data, message: 'Usuário desativado com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao desativar usuário';
    console.error('[Users] Erro M2M delete:', message);
    res.status(status).json({ error: message });
  }
});

module.exports = router;
