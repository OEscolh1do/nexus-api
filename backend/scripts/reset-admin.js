const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  const email = 'admin@neonorte.com';
  const password = 'admin123'; // Senha padrão
  const name = 'Administrador Neonorte';

  console.log(`🔄 Resetando usuário admin...`);
  console.log(`Email: ${email}`);
  console.log(`Nova Senha: ${password}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: name,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Usuário Admin resetado com sucesso!`);
  console.log(`ID: ${user.id}`);
}

resetAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
