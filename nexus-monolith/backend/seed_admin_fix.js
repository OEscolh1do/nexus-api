const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting admin user...');

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
        password: '123',
        isActive: true,
        role: 'ADMIN',
    },
    create: {
      username: 'admin',
      password: '123',
      fullName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user reset:', adminUser);

  console.log('Seeding strategy...');
  const strategy = await prisma.strategy.upsert({
    where: { id: 'macro-solar-2024' }, // Using a fixed ID for simplicity
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
