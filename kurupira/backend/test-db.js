const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to connect...");
    await prisma.$connect();
    console.log("Connection successful!");
    
    // Check if we can query anything (even if empty)
    // Note: If schema is not pushed, this might fail on query, but connect should work.
    
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
