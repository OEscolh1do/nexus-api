const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { username: 'tecnologianeonorte@gmail.com' },
    data: { authProviderId: '371075727359575554' }
  });
  console.log('✅ Usuário local sincronizado com ZITADEL Admin ID.');
  await prisma.$disconnect();
}
main();
