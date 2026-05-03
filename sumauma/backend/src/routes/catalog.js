const express = require('express');
const prismaKurupira = require('../lib/prismaKurupira');
const { kurupiraClient } = require('../lib/m2mClient');
const { auditLog } = require('../lib/auditLogger');

const router = express.Router();

// ============================================
// GET /admin/catalog/modules — Listar módulos FV
// ============================================
router.get('/modules', async (req, res) => {
  try {
    const { page = 1, limit = 50, manufacturer, isActive, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (manufacturer) where.manufacturer = manufacturer;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (q) {
      where.OR = [
        { model: { contains: q } },
        { manufacturer: { contains: q } },
      ];
    }

    const [modules, total] = await Promise.all([
      prismaKurupira.moduleCatalog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { manufacturer: 'asc' },
      }),
      prismaKurupira.moduleCatalog.count({ where }),
    ]);

    res.json({
      data: modules,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.warn('[Catalog] Aviso: Falha ao listar módulos:', error.message);
    res.json({ data: [], pagination: { total: 0, totalPages: 0 } });
  }
});

// ============================================
// GET /admin/catalog/inverters — Listar inversores
// ============================================
router.get('/inverters', async (req, res) => {
  try {
    const { page = 1, limit = 50, manufacturer, isActive, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (manufacturer) where.manufacturer = manufacturer;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (q) {
      where.OR = [
        { model: { contains: q } },
        { manufacturer: { contains: q } },
      ];
    }

    const [inverters, total] = await Promise.all([
      prismaKurupira.inverterCatalog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { manufacturer: 'asc' },
      }),
      prismaKurupira.inverterCatalog.count({ where }),
    ]);

    res.json({
      data: inverters,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.warn('[Catalog] Aviso: Falha ao listar inversores:', error.message);
    res.json({ data: [], pagination: { total: 0, totalPages: 0 } });
  }
});

// ============================================
// POST /admin/catalog/modules — Adicionar módulo
// ============================================
router.post('/modules', async (req, res) => {
  try {
    const response = await kurupiraClient.post('/internal/catalog/modules', req.body);

    const equipment = response.data.data;


    await auditLog({
      operator: req.operator,
      action: 'CREATE',
      entity: 'ModuleCatalog',
      resourceId: equipment.id,
      details: `Upload de módulo: ${equipment.manufacturer} ${equipment.model}`,
      after: equipment
    });

    res.status(201).json({ data: equipment, message: 'Módulo adicionado ao catálogo' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao adicionar módulo';
    console.error('[Catalog] Erro M2M módulo:', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// POST /admin/catalog/inverters — Adicionar inversor
// ============================================
router.post('/inverters', async (req, res) => {
  try {
    const response = await kurupiraClient.post('/internal/catalog/inverters', req.body);
    const equipment = response.data.data;

    await auditLog({
      operator: req.operator,
      action: 'CREATE',
      entity: 'InverterCatalog',
      resourceId: equipment.id,
      details: `Upload de inversor: ${equipment.manufacturer} ${equipment.model}`,
      after: equipment
    });

    res.status(201).json({ data: equipment, message: 'Inversor adicionado ao catálogo' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao adicionar inversor';
    console.error('[Catalog] Erro M2M inversor:', message);
    res.status(status).json({ error: message });
  }
});

// ============================================
// PATCH /admin/catalog/modules/:id — Atualizar módulo
// ============================================
router.patch('/modules/:id', async (req, res) => {
  try {
    const response = await kurupiraClient.patch(`/internal/catalog/modules/${req.params.id}`, req.body);
    const equipment = response.data.data;

    await auditLog({
      operator: req.operator,
      action: 'UPDATE',
      entity: 'ModuleCatalog',
      resourceId: req.params.id,
      details: `Atualização de módulo (Toggle/Edit)`,
      after: req.body
    });

    res.json({ data: equipment, message: 'Status do módulo atualizado' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar módulo';
    res.status(status).json({ error: message });
  }
});

// ============================================
// PATCH /admin/catalog/inverters/:id — Atualizar inversor
// ============================================
router.patch('/inverters/:id', async (req, res) => {
  try {
    const response = await kurupiraClient.patch(`/internal/catalog/inverters/${req.params.id}`, req.body);
    const equipment = response.data.data;

    await auditLog({
      operator: req.operator,
      action: 'UPDATE',
      entity: 'InverterCatalog',
      resourceId: req.params.id,
      details: `Atualização de inversor (Toggle/Edit)`,
      after: req.body
    });

    res.json({ data: equipment, message: 'Status do inversor atualizado' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao atualizar inversor';
    res.status(status).json({ error: message });
  }
});

// ============================================
// DELETE /admin/catalog/modules/:id — Excluir módulo
// ============================================
router.delete('/modules/:id', async (req, res) => {
  try {
    await kurupiraClient.delete(`/internal/catalog/modules/${req.params.id}`);
    
    await auditLog({
      operator: req.operator,
      action: 'DELETE',
      entity: 'ModuleCatalog',
      resourceId: req.params.id,
      details: `Exclusão permanente de módulo`
    });

    res.json({ message: 'Módulo excluído com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao excluir módulo';
    res.status(status).json({ error: message });
  }
});

// ============================================
// DELETE /admin/catalog/inverters/:id — Excluir inversor
// ============================================
router.delete('/inverters/:id', async (req, res) => {
  try {
    await kurupiraClient.delete(`/internal/catalog/inverters/${req.params.id}`);

    await auditLog({
      operator: req.operator,
      action: 'DELETE',
      entity: 'InverterCatalog',
      resourceId: req.params.id,
      details: `Exclusão permanente de inversor`
    });

    res.json({ message: 'Inversor excluído com sucesso' });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Falha ao excluir inversor';
    res.status(status).json({ error: message });
  }
});

// ============================================
// GET /admin/catalog/stats — Estatísticas
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const [modulesActive, modulesInactive, invertersActive, invertersInactive] = await Promise.all([
      prismaKurupira.moduleCatalog.count({ where: { isActive: true } }),
      prismaKurupira.moduleCatalog.count({ where: { isActive: false } }),
      prismaKurupira.inverterCatalog.count({ where: { isActive: true } }),
      prismaKurupira.inverterCatalog.count({ where: { isActive: false } }),
    ]);

    res.json({
      data: {
        modules: { active: modulesActive, inactive: modulesInactive, total: modulesActive + modulesInactive },
        inverters: { active: invertersActive, inactive: invertersInactive, total: invertersActive + invertersInactive },
      },
    });
  } catch (error) {
    res.json({
      data: {
        modules: { active: 0, inactive: 0, total: 0 },
        inverters: { active: 0, inactive: 0, total: 0 },
      },
    });
  }
});

module.exports = router;


module.exports = router;
