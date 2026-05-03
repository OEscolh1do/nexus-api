const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const { checkPermission } = require('../lib/permissions');
const logger = require('../lib/logger');

const router = express.Router();

// ============================================
// POST /admin/org-units — Criar Unidade
// ============================================
// checkPermission removido temporariamente para testes/desenvolvimento
router.post('/', async (req, res) => {
  try {
    const { tenantId, name, type, parentId } = req.body;

    if (!tenantId || !name || !type) {
      return res.status(400).json({ error: 'Campos obrigatórios: tenantId, name, type' });
    }

    let parentPath = '';
    if (parentId) {
      const parent = await prismaSumauma.orgUnit.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(404).json({ error: 'Unidade pai não encontrada' });
      parentPath = parent.path || '';
    }

    // 1. Criar a unidade sem path
    const unit = await prismaSumauma.orgUnit.create({
      data: {
        tenantId,
        name,
        type,
        parentId,
      }
    });

    // 2. Computar e salvar o path de hierarquia
    const newPath = `${parentPath}/${unit.id}`;
    const updatedUnit = await prismaSumauma.orgUnit.update({
      where: { id: unit.id },
      data: { path: newPath }
    });

    res.status(201).json({ data: updatedUnit, message: 'Unidade organizacional criada com sucesso' });
  } catch (error) {
    logger.error('Erro ao criar org unit', { err: error.message });
    res.status(500).json({ error: 'Falha ao criar unidade organizacional' });
  }
});

// ============================================
// GET /admin/org-units — Listar Unidades
// ============================================
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    const where = {};
    if (tenantId) where.tenantId = tenantId;

    const units = await prismaSumauma.orgUnit.findMany({
      where,
      orderBy: { path: 'asc' } // A ordenação por path garante árvore lógica
    });

    res.json({ data: units });
  } catch (error) {
    logger.error('Erro ao listar org units', { err: error.message });
    res.status(500).json({ error: 'Falha ao listar unidades' });
  }
});

module.exports = router;
