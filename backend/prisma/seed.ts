import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Admin User
  const email = 'admin@neonorte.com';
  const hashedPassword = await bcrypt.hash('neonorte@2026', 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
        password: hashedPassword, // Ensure password is updated if exists
        role: 'ADMIN'
    },
    create: {
      email,
      name: 'Administrador Neonorte',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user created/updated: ${admin.email}`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
