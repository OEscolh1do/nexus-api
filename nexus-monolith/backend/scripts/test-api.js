const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-dev-key";

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const token = jwt.sign(
        { id: admin.id, role: admin.role, username: admin.username },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    console.log("Testing GET /api/v2/iam/users...");
    try {
        const res = await fetch('http://localhost:3001/api/v2/iam/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Users Response:", res.status, data.data?.length, "users found.");
    } catch (e) {
        console.error("Users Error:", e);
    }

    console.log("\nTesting GET /api/v2/strategies...");
    try {
        const res = await fetch('http://localhost:3001/api/v2/strategies', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Strategies Response:", res.status, data.data?.length, "strategies found.");
    } catch (e) {
        console.error("Strategies Error:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
