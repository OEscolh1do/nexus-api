const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-dev-key";

async function main() {
    console.log("Checking JWT and User...");
    // 1. Let's find any user (admin)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.log("No admin found.");
        return;
    }
    console.log("Found admin ID:", admin.id);

    // Simulate login token
    const token = jwt.sign(
        { id: admin.id, role: admin.role, username: admin.username },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    // Simulate verifyToken
    console.log("\nSimulating IamService.verifyToken...");
    const decoded = jwt.verify(token, JWT_SECRET);

    try {
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                role: true,
                orgUnitId: true,
                tenantId: true,
            },
        });
        console.log("DB User Result:", user);

        if (!user.tenantId && !user.orgUnitId) {
            console.log("CRITICAL: Both tenantId and orgUnitId are missing!");
        } else {
            console.log("Tenant Context looks OK.");
        }
    } catch (e) {
        console.error("Prisma error:", e);
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
