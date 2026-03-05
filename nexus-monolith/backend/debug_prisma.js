const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Diagnosing Prisma Client...");

  // 1. Check Connection
  try {
    await prisma.$connect();
    console.log("✅ Database Connection: OK");
  } catch (error) {
    console.error("❌ Database Connection: FAILED", error);
    process.exit(1);
  }

  // 2. Check keys on prisma instance
  const keys = Object.keys(prisma);
  console.log("Found Prisma keys:", keys.filter(k => !k.startsWith('_') && !k.startsWith('$')));

  // 3. Check specific model mapping
  if (prisma.taskDependency) {
    console.log("✅ prisma.taskDependency exists");
    try {
      const count = await prisma.taskDependency.count();
      console.log(`✅ prisma.taskDependency.count() works. Count: ${count}`);
      
      const items = await prisma.taskDependency.findMany({ take: 1 });
      console.log("✅ prisma.taskDependency.findMany() works", items);
    } catch (e) {
      console.error("❌ prisma.taskDependency query FAILED", e);
    }
  } else {
    console.error("❌ prisma.taskDependency DOES NOT EXIST on client instance");
    // Check for slightly different casings
    const similar = keys.filter(k => k.toLowerCase().includes('dependency'));
    console.log("Did you mean one of these?", similar);
  }

  // 4. Check Strategy (known working)
  if (prisma.strategy) {
     console.log("✅ prisma.strategy exists (Baseline check)");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
