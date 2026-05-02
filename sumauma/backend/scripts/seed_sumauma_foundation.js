const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed da Fundação Ywara...');

  // 1. Criar Tenant MASTER
  const masterTenant = await prisma.tenant.upsert({
    where: { id: 'master-tenant-id' },
    update: {},
    create: {
      id: 'master-tenant-id',
      name: 'Neonorte Foundation',
      type: 'MASTER',
      apiPlan: 'ENTERPRISE',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant MASTER criado:', masterTenant.name);

  // 2. Criar Unidade Organizacional Principal
  const mainOrg = await prisma.orgUnit.upsert({
    where: { id: 'main-org-unit-id' },
    update: {},
    create: {
      id: 'main-org-unit-id',
      tenantId: masterTenant.id,
      name: 'Sede Neonorte',
      type: 'MATRIZ',
    },
  });
  console.log('✅ Unidade Organizacional criada:', mainOrg.name);

  // 3. Criar Usuário Admin Supremo
  const adminPassword = await bcrypt.hash('neonorte_admin_2026!', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'tecnologianeonorte@gmail.com' },
    update: {
      authProviderId: null, 
    },
    create: {
      username: 'tecnologianeonorte@gmail.com',
      password: adminPassword,
      fullName: 'Admin Neonorte',
      role: 'PLATFORM_ADMIN',
      tenantId: masterTenant.id,
      orgUnitId: mainOrg.id,
      authProviderId: null, 
      status: 'ACTIVE',
    },
  });
  console.log('✅ Usuário Admin criado:', adminUser.username);

  console.log('🚀 Seed da Fundação finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
