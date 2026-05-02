const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Testing connection to: " + process.env.DATABASE_URL);
  try {
    await prisma.$connect();
    console.log("✅ Connection Successful!");
    
    // Try a simple query
    const count = await prisma.user.count();
    console.log(`✅ Database reachable. User count: ${count}`);
    
  } catch (e) {
    console.error("❌ Connection Failed:");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
