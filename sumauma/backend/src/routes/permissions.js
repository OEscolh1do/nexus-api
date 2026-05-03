const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const { checkPermission } = require('../lib/permissions');
const logger = require('../lib/logger');

const router = express.Router();

// ============================================
// GET /admin/permissions — Listar todas as permissões
// ============================================
router.get('/', checkPermission('tenants:read'), async (req, res) => {
  try {
    const permissions = await prismaSumauma.permission.findMany({
      orderBy: { slug: 'asc' }
    });

    // Opcional: Agrupar por módulo/recurso (a parte antes dos dois pontos)
    // ex: "catalog:write" -> group: "catalog"
    const grouped = permissions.reduce((acc, curr) => {
      const [moduleName] = curr.slug.split(':');
      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(curr);
      return acc;
    }, {});

    res.json({
      data: permissions,
      grouped: grouped, // Frontend vai amar isso para montar a matriz
    });
  } catch (error) {
    logger.error('Erro ao listar permissions', { err: error.message });
    res.status(500).json({ error: 'Falha ao listar permissões' });
  }
});

module.exports = router;
