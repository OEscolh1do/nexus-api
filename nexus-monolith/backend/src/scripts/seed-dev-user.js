const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 [Nexus IAM] Seed — Credencial Neonorte Padrão');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tenantId = 'default-tenant-001';
  const username = 'tecnologianeonorte@gmail.com';
  const plainPassword = 'bud4X891fd';

  // 1. Garantir Tenant
  console.log('   [1/4] Verificando Tenant...');
  await prisma.orgUnit.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Neonorte Matriz',
      type: 'HOLDING',
    }
  });

  // 2. Limpar usuários anteriores
  console.log('   [2/4] Limpando usuários anteriores...');
  const deletedCount = await prisma.user.deleteMany({});
  console.log(`         ${deletedCount.count} usuário(s) removido(s).`);

  // 3. Hash da senha com Bcrypt
  console.log('   [3/4] Gerando hash Bcrypt...');
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 4. Criar usuário canônico
  console.log('   [4/4] Criando usuário padrão Neonorte...');
  const user = await prisma.user.create({
    data: {
      username: username,
      fullName: 'Tecnologia Neonorte',
      password: hashedPassword,
      role: 'ADMIN',
      jobTitle: 'Responsável Técnico',
      hierarchyLevel: 'C-LEVEL',
      badgeId: 'NEO-001'
    },
    select: {
      id: true,
      username: true,
      role: true
    }
  });

  console.log('');
  console.log('✅ Credencial injetada com sucesso.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ID:       ${user.id}`);
  console.log(`   Login:    ${username}`);
  console.log(`   Senha:    ${plainPassword}`);
  console.log(`   Role:     ${user.role}`);
  console.log(`   Hash:     ${hashedPassword.substring(0, 20)}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
