const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  const admin = users.find(u => u.username === 'admin');
  
  if (admin) {
      console.log(`FULL ID: ${admin.id}`);
      console.log(`Token should be: dev-token-${admin.id}`);
      
      const check = await prisma.user.findUnique({ where: { id: admin.id } });
      console.log("FindUnique Result:", check ? "FOUND" : "NOT FOUND");
  } else {
      console.log("Admin not found!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
