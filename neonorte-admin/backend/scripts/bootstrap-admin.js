const { PrismaClient } = require('../node_modules/.prisma/client-iaca');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Usamos o Prisma Client padrão para escrita (Bootstrap)
// Apontamos para a URL principal do db_iaca (com permissão de escrita)
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_IACA_BOOTSTRAP || process.env.DATABASE_URL_IACA_RO.replace('user_admin', 'user_iaca').replace('admin_S3cur3_2026!', 'iaca_S3cur3_2026!') }
  }
});

async function main() {
  const username = 'admin';
  const password = 'admin_password_2026'; // Mude isso após o primeiro login
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('🚀 Iniciando bootstrap do Admin...');

  try {
    // Garantir que o tenant padrão existe (o banco está limpo)
    await prisma.tenant.upsert({
      where: { id: 'default-tenant-001' },
      update: {},
      create: {
        id: 'default-tenant-001',
        name: 'Neonorte Plataforma',
        type: 'MASTER'
      }
    });

    const user = await prisma.user.upsert({
      where: { username },
      update: {
        role: 'PLATFORM_ADMIN',
        password: hashedPassword
      },
      create: {
        username,
        password: hashedPassword,
        fullName: 'Administrador Root',
        role: 'PLATFORM_ADMIN',
        tenantId: 'default-tenant-001' // Assume que este tenant existe ou será criado
      }
    });

    console.log('✅ Usuário Admin criado/atualizado com sucesso!');
    console.log(`👤 Username: ${user.username}`);
    console.log(`🔑 Password: ${password}`);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
