const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Iniciando seed de usuário administrativo...');

  const tenantId = 'default-tenant-001';
  const username = 'NeonorteTecnologia';
  const plainPassword = 'neonorte@2026';

  // 1. Garantir que o Tenant (OrgUnit) existe
  console.log(`   Verificando Tenant ID: ${tenantId}...`);
  await prisma.orgUnit.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Neonorte Matriz',
      type: 'HOLDING',
    }
  });

  // 2. Gerar Hash da Senha
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 3. Upsert do Usuário
  console.log(`   Sincronizando usuário: ${username}...`);
  // 3. Upsert do Usuário
  console.log(`   Sincronizando usuário: ${username}...`);
  await prisma.user.upsert({
    where: { username: username },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      // orgUnitId: tenantId // Comentado para evitar erro P2022
    },
    create: {
      username: username,
      fullName: 'Neonorte Tecnologia Admin',
      password: hashedPassword,
      role: 'ADMIN',
      // orgUnitId: tenantId, // Comentado temporariamente
      jobTitle: 'System Administrator',
      badgeId: 'SYS-001'
    },
    select: {
      id: true,
      username: true,
      role: true
    }
  });

  console.log('✅ Usuário administrativo sincronizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
