const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Creating Admin user...");
  
  try {
    const user = await prisma.user.upsert({
      where: { username: "Admin" },
      update: {
        password: "123", // Plaintext as per current IamService impl
        fullName: "System Administrator",
        role: "ADMIN"
      },
      create: {
        username: "Admin",
        password: "123",
        fullName: "System Administrator",
        role: "ADMIN"
      }
    });
    
    console.log("✅ User 'Admin' configured successfully.");
    console.log(`User ID: ${user.id}`);
    
  } catch (e) {
    console.error("❌ Failed to create user:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
