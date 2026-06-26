const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const developers = [
  {
    authProviderId: 'ymtn9yx8m382',
    email: 'neonorte.eng@yahoo.com',
    username: 'andrei',
    fullName: 'Andrei User',
  },
  {
    authProviderId: 'lw81oqfd1sla',
    email: 'neonorte@yahoo.com',
    username: 'breno_nunes',
    fullName: 'Breno Nunes',
  },
  {
    authProviderId: 'sgcspyt0fh3m',
    email: 'emesom.silva@outlook.com',
    username: 'emesom_silva',
    fullName: 'Emesom Carlos Feitosa Silva',
  },
  {
    authProviderId: 'osvx1gwongdh',
    email: 'tecnologianeonorte@gmail.com',
    username: 'tecnologianeonorte',
    fullName: 'Admin Neonorte',
  }
];

async function main() {
  console.log('🚀 Iniciando bootstrap de operadores do Logto...');
  const password = 'neonorte_admin_2026!';
  const hashedPassword = await bcrypt.hash(password, 12);

  // Garantir tenant MASTER
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
  console.log('✅ Tenant MASTER verificado:', masterTenant.id);

  // Garantir Org Unit principal
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
  console.log('✅ Unidade Organizacional principal verificada:', mainOrg.id);

  for (const dev of developers) {
    try {
      const user = await prisma.user.upsert({
        where: { username: dev.username },
        update: {
          authProviderId: dev.authProviderId,
          email: dev.email,
          fullName: dev.fullName,
          role: 'PLATFORM_ADMIN',
          tenantId: masterTenant.id,
          orgUnitId: mainOrg.id,
          status: 'ACTIVE',
        },
        create: {
          username: dev.username,
          password: hashedPassword,
          fullName: dev.fullName,
          email: dev.email,
          authProviderId: dev.authProviderId,
          role: 'PLATFORM_ADMIN',
          tenantId: masterTenant.id,
          orgUnitId: mainOrg.id,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Operador mapeado: ${user.username} (Logto ID: ${user.authProviderId})`);
    } catch (err) {
      console.error(`❌ Erro ao mapear ${dev.username}:`, err.message);
    }
  }

  console.log('🎉 Fim do mapeamento dos operadores.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed/bootstrap:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
