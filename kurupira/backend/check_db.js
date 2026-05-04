const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe("SHOW TABLES;");
    console.log("Tables in db_kurupira:", JSON.stringify(tables, null, 2));
    
    const count = await prisma.technicalDesign.count();
    console.log("TechnicalDesign count:", count);
  } catch (err) {
    console.error("Error checking tables:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
