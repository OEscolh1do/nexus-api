const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pipeline.findFirst({ include: { stages: true } })
    .then(d => console.log(JSON.stringify(d, null, 2)))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
