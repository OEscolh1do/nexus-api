const prisma = require('./src/lib/prisma');

async function atomicTest() {
    console.log("--- Atomic RLS Test (Pure SQL inside $transaction) ---");

    // Test: Within a single transaction, set tenant_id and then query
    const result = await prisma.$transaction(async (tx) => {
        // Set tenant to "test-tenant-002" (which has no leads)
        await tx.$executeRawUnsafe(
            "SELECT set_config('app.tenant_id', $1, true)",
            "test-tenant-002"
        );

        // Verify config is set
        const configResult = await tx.$queryRawUnsafe(
            "SELECT current_setting('app.tenant_id', true) as tid"
        );
        console.log("Config check:", JSON.stringify(configResult));

        // Query leads - should return 0 for test-tenant-002
        const leads = await tx.$queryRawUnsafe('SELECT id, name, "tenantId" FROM "Lead" LIMIT 5');
        console.log("Raw SQL leads:", JSON.stringify(leads));

        // Also test via Prisma ORM
        const prismaLeads = await tx.lead.findMany({ take: 5 });
        console.log("Prisma ORM leads:", prismaLeads.length);

        return { config: configResult, rawLeads: leads, prismaLeadCount: prismaLeads.length };
    });

    console.log("Final:", JSON.stringify(result, null, 2));
}

atomicTest().catch(e => {
    console.error("Error:", e.message);
}).finally(() => process.exit(0));
