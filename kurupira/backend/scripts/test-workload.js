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

    console.log("Testing GET /api/v2/ops/workload...");
    try {
        const res = await fetch('http://localhost:3001/api/v2/ops/workload', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Workload Response:", res.status, data.data ? `${data.data.length} users workloads found.` : data);
    } catch (e) {
        console.error("Workload Error:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
