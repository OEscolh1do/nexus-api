const prisma = require('./src/lib/prisma');

async function checkRole() {
    const result = await prisma.$queryRawUnsafe("SELECT current_user");
    console.log("Current User:", JSON.stringify(result));
    process.exit(0);
}

checkRole().catch(e => { console.error(e); process.exit(1); });
