const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('--- Verificando Tabelas ---');
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tabelas encontradas:', tables);

    console.log('\n--- Verificando Colunas de User ---');
    const userColumns = await prisma.$queryRaw`DESCRIBE User`;
    console.log('Colunas de User:', userColumns.map(c => c.Field));

    console.log('\n--- Verificando Roles ---');
    const rolesCount = await prisma.role.count();
    console.log('Quantidade de Roles:', rolesCount);

    console.log('\n--- Verificando Permissions ---');
    const permissionsCount = await prisma.permission.count();
    console.log('Quantidade de Permissions:', permissionsCount);

    console.log('\n--- Testando Query de Operadores ---');
    const ops = await prisma.user.findMany({
      where: { role: 'PLATFORM_ADMIN' },
      select: { id: true, username: true }
    });
    console.log('Operadores encontrados:', ops);

  } catch (err) {
    console.error('ERRO NO DIAGNÓSTICO:', err.message);
    if (err.code) console.error('Código do Erro Prisma:', err.code);
  } finally {
    await prisma.$disconnect();
  }
}

check();
