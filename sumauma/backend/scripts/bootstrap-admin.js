const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Usamos o Prisma Client padrão (MASTER) para db_sumauma
const prisma = new PrismaClient();

async function main() {
  const logtoId = process.argv[2] || null;
  const username = process.argv[3] || 'admin';
  const password = 'admin_password_2026'; // Mude isso após o primeiro login
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('🚀 Iniciando bootstrap do Admin...');
  if (logtoId) {
    console.log(`🔗 Logto ID mapeado: ${logtoId}`);
  }

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
        password: hashedPassword,
        ...(logtoId ? { authProviderId: logtoId } : {})
      },
      create: {
        username,
        password: hashedPassword,
        fullName: 'Administrador Root',
        role: 'PLATFORM_ADMIN',
        tenantId: 'default-tenant-001', // Assume que este tenant existe ou será criado
        ...(logtoId ? { authProviderId: logtoId } : {})
      }
    });

    console.log('✅ Usuário Admin criado/atualizado com sucesso!');
    console.log(`👤 Username: ${user.username}`);
    console.log(`🔑 Password: ${password}`);
    if (user.authProviderId) {
      console.log(`🔗 AuthProvider (Logto ID): ${user.authProviderId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
