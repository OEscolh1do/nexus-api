const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const logger = require('../lib/logger');

const router = express.Router();

// ============================================
// GET /admin/operators — Listar Operadores de Plataforma
// Somente leitura. Sem criação via HTTP (Poka-Yoke).
// ============================================
router.get('/', async (req, res) => {
  try {
    const operators = await prismaSumauma.user.findMany({
      where: { role: 'PLATFORM_ADMIN' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        jobTitle: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: operators, total: operators.length });
  } catch (error) {
    logger.error('Erro ao listar operadores', { err: error.message });
    res.status(500).json({ error: 'Falha ao listar operadores' });
  }
});

// ============================================
// POST /admin/operators — BLOQUEADO
// ============================================
router.post('/', (req, res) => {
  res.status(405).json({
    error: 'Criação de operadores via HTTP não é permitida.',
    hint: 'Use o script CLI: node scripts/create-operator.js no servidor.',
    code: 'METHOD_NOT_ALLOWED',
  });
});

// ============================================
// PATCH /admin/operators/:id/block — Bloquear operador
// ============================================
router.patch('/:id/block', async (req, res) => {
  try {
    // Impedir auto-bloqueio
    if (req.operator?.id === req.params.id) {
      return res.status(403).json({ error: 'Você não pode bloquear a si mesmo' });
    }

    const updated = await prismaSumauma.user.update({
      where: { id: req.params.id, role: 'PLATFORM_ADMIN' }, // garante que só bloqueia operadores
      data: { status: 'BLOCKED' },
    });

    res.json({ data: updated, message: 'Operador bloqueado com sucesso' });
  } catch (error) {
    logger.error('Erro ao bloquear operador', { err: error.message });
    res.status(500).json({ error: 'Falha ao bloquear operador' });
  }
});

// ============================================
// PATCH /admin/operators/:id/unblock — Desbloquear operador
// ============================================
router.patch('/:id/unblock', async (req, res) => {
  try {
    const updated = await prismaSumauma.user.update({
      where: { id: req.params.id, role: 'PLATFORM_ADMIN' },
      data: { status: 'ACTIVE' },
    });
    res.json({ data: updated, message: 'Operador desbloqueado com sucesso' });
  } catch (error) {
    logger.error('Erro ao desbloquear operador', { err: error.message });
    res.status(500).json({ error: 'Falha ao desbloquear operador' });
  }
});

module.exports = router;
