const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const prismaSumauma = require('../lib/prismaSumauma');
const logger = require('../lib/logger');

const router = express.Router();

/**
 * GET /api/v1/team
 * Lista os usuários que pertencem ao mesmo tenant do usuário logado.
 * Operação Apenas Leitura (Read-Only) usando o prismaSumauma.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({ error: 'Sua conta não está vinculada a uma organização (Tenant).' });
    }

    const users = await prismaSumauma.user.findMany({
      where: {
        tenantId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      data: users,
      meta: {
        tenantId,
        count: users.length
      }
    });
  } catch (error) {
    logger.error('Erro ao listar equipe', { error: error.message, tenantId: req.user?.tenantId });
    res.status(500).json({ error: 'Erro interno ao consultar dados da equipe' });
  }
});

module.exports = router;
