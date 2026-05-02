const express = require('express');
const prismaSumauma = require('../lib/prismaSumauma');
const { checkPermission } = require('../lib/permissions');

const router = express.Router();

// ============================================
// GET /admin/roles — Listar Perfis
// ============================================
router.get('/', checkPermission('users:read'), async (req, res) => {
  try {
    const { tenantId, level } = req.query;
    
    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (level) where.level = level; // PLATFORM ou TENANT

    // Se o usuário é de um tenant, ele só pode ver roles do seu tenant e as globais (opcional)
    // Para simplificar no BFF Admin, como o operador vê tudo, filtramos pelo query.

    const roles = await prismaSumauma.role.findMany({
      where,
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: { select: { users: true } },
        tenant: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: roles });
  } catch (error) {
    console.error('[Roles] Erro ao listar:', error.message);
    res.status(500).json({ error: 'Falha ao listar perfis' });
  }
});

// ============================================
// POST /admin/roles — Criar Perfil
// ============================================
router.post('/', checkPermission('users:write'), async (req, res) => {
  try {
    const { name, level, tenantId, permissionIds } = req.body;

    if (!name || !level) {
      return res.status(400).json({ error: 'Nome e Nível (PLATFORM/TENANT) são obrigatórios' });
    }
    
    // Se level == TENANT, tenantId é obrigatório
    if (level === 'TENANT' && !tenantId) {
      return res.status(400).json({ error: 'O ID da organização é obrigatório para perfis de Tenant' });
    }

    const role = await prismaSumauma.role.create({
      data: {
        name: name.trim(),
        level,
        tenantId: level === 'TENANT' ? tenantId : null,
        permissions: {
          create: (permissionIds || []).map(id => ({
            permission: { connect: { id } }
          }))
        }
      },
      include: {
        permissions: { include: { permission: true } }
      }
    });

    res.status(201).json({ data: role, message: 'Perfil criado com sucesso' });
  } catch (error) {
    console.error('[Roles] Erro ao criar:', error.message);
    res.status(500).json({ error: 'Falha ao criar perfil' });
  }
});

// ============================================
// PATCH /admin/roles/:id — Editar Perfil
// ============================================
router.patch('/:id', checkPermission('users:write'), async (req, res) => {
  try {
    const { name, permissionIds } = req.body;
    const roleId = req.params.id;

    // Se permissionIds foi enviado, precisamos atualizar as relações
    // No Prisma, atualizar relações m-n via tabela de junção requer deletar as antigas e criar novas
    let updateData = {};
    if (name) updateData.name = name.trim();

    if (permissionIds && Array.isArray(permissionIds)) {
      // Deleta as RolePermissions atuais
      await prismaSumauma.rolePermission.deleteMany({
        where: { roleId }
      });

      // Se houver novas, agenda a criação
      if (permissionIds.length > 0) {
        updateData.permissions = {
          create: permissionIds.map(id => ({
            permission: { connect: { id } }
          }))
        };
      }
    }

    const updatedRole = await prismaSumauma.role.update({
      where: { id: roleId },
      data: updateData,
      include: {
        permissions: { include: { permission: true } }
      }
    });

    res.json({ data: updatedRole, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('[Roles] Erro ao atualizar:', error.message);
    res.status(500).json({ error: 'Falha ao atualizar perfil' });
  }
});

module.exports = router;
