const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Resetando usuário admin (Neonorte)...');

  const hashedPassword = await bcrypt.hash('bud4X891fd', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'tecnologianeonorte@gmail.com' },
    update: {
      password: hashedPassword,
      isActive: true,
      role: 'ADMIN',
    },
    create: {
      username: 'tecnologianeonorte@gmail.com',
      password: hashedPassword,
      fullName: 'Tecnologia Neonorte',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user reset:', adminUser.username);

  console.log('Seeding strategy...');
  const strategy = await prisma.strategy.upsert({
    where: { id: 'macro-solar-2024' },
    update: {},
    create: {
      id: 'macro-solar-2024',
      title: 'Macro Solar 2024',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      colorCode: 'bg-yellow-500'
    }
  });
  console.log('Strategy seeded:', strategy);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
