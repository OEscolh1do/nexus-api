const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de RBAC...');

  // 1. Definir Permissões Base
  const permissionsData = [
    { slug: 'catalog:read', description: 'Visualizar catálogo de equipamentos' },
    { slug: 'catalog:write', description: 'Criar e editar equipamentos no catálogo' },
    { slug: 'users:read', description: 'Visualizar usuários da organização' },
    { slug: 'users:write', description: 'Gerenciar usuários da organização' },
    { slug: 'tenants:read', description: 'Visualizar dados da própria organização' },
    { slug: 'tenants:write', description: 'Gerenciar dados da própria organização (Plataforma)' },
    { slug: 'system:audit', description: 'Visualizar logs de auditoria' },
  ];

  console.log('Criando permissões...');
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 2. Criar Roles Padrão (Plataforma e Tenant)
  console.log('Criando Roles...');
  
  // PLATFORM_ADMIN (Global)
  const platformAdminRole = await prisma.role.create({
    data: {
      name: 'Platform Admin',
      level: 'PLATFORM',
      permissions: {
        create: permissionsData.map(p => ({
          permission: { connect: { slug: p.slug } }
        }))
      }
    }
  });

  // TENANT_ADMIN (Padrão para Empresas)
  const tenantAdminRole = await prisma.role.create({
    data: {
      name: 'Tenant Admin',
      level: 'TENANT',
      permissions: {
        create: [
          { permission: { connect: { slug: 'catalog:read' } } },
          { permission: { connect: { slug: 'users:read' } } },
          { permission: { connect: { slug: 'users:write' } } },
          { permission: { connect: { slug: 'tenants:read' } } },
          { permission: { connect: { slug: 'system:audit' } } },
        ]
      }
    }
  });

  // ENGINEER (Padrão para Empresas)
  const engineerRole = await prisma.role.create({
    data: {
      name: 'Engenheiro',
      level: 'TENANT',
      permissions: {
        create: [
          { permission: { connect: { slug: 'catalog:read' } } },
        ]
      }
    }
  });

  // 3. Migrar Usuários Existentes
  console.log('Migrando usuários existentes...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    let targetRoleId = null;
    if (user.role === 'PLATFORM_ADMIN') targetRoleId = platformAdminRole.id;
    else if (user.role === 'TENANT_ADMIN') targetRoleId = tenantAdminRole.id;
    else if (user.role === 'ENGINEER') targetRoleId = engineerRole.id;

    if (targetRoleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: targetRoleId }
      });
      console.log(`✅ Usuário ${user.username} migrado para role ${user.role}.`);
    }
  }

  console.log('🎉 Seed RBAC finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
