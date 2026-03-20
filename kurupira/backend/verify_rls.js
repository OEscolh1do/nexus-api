const prisma = require('./src/lib/prisma');
const { withTenant } = require('./src/lib/prisma');
const { asyncLocalStorage } = require('./src/lib/asyncContext');

async function testRLS() {
    const tenant1 = "default-tenant-001";
    const tenant2 = "test-tenant-002";

    console.log("--- RLS Verification Test (withTenant) ---");

    // Step 1: Ensure both tenants exist (runs without RLS)
    console.log("[SYSTEM] Ensuring tenants exist...");
    await prisma.tenant.upsert({
        where: { id: tenant1 },
        update: {},
        create: { id: tenant1, name: "Tenant 1", type: "MASTER" }
    });

    await prisma.tenant.upsert({
        where: { id: tenant2 },
        update: {},
        create: { id: tenant2, name: "Tenant 2", type: "SUB_TENANT" }
    });

    // Step 2: Insert data AS tenant 1
    let leadId;
    await asyncLocalStorage.run({ tenantId: tenant1 }, async () => {
        console.log(`[T1] Creating Lead for ${tenant1}...`);
        const lead = await withTenant(async (tx) => {
            return tx.lead.create({
                data: {
                    name: "RLS Test Lead",
                    phone: "555-CROSS-TENANT",
                    tenantId: tenant1
                }
            });
        });
        leadId = lead.id;
        console.log(`[T1] Created Lead ID: ${leadId}`);
    });

    // Step 3: Try to read AS tenant 2 (should NOT see the lead)
    await asyncLocalStorage.run({ tenantId: tenant2 }, async () => {
        console.log(`[T2] Attempting to read Lead ${leadId}...`);
        const leads = await withTenant(async (tx) => {
            return tx.lead.findMany({ where: { id: leadId } });
        });

        if (leads.length === 0) {
            console.log(`[T2] ✅ SUCCESS: Lead is completely hidden from Tenant 2 via RLS.`);
        } else {
            console.log(`[T2] ❌ FAIL: Lead was visible to Tenant 2! RLS bypassed.`);
        }
    });

    // Step 4: Read AS tenant 1 (should succeed)
    await asyncLocalStorage.run({ tenantId: tenant1 }, async () => {
        console.log(`[T1] Attempting to read Lead ${leadId}...`);
        const leads = await withTenant(async (tx) => {
            return tx.lead.findMany({ where: { id: leadId } });
        });

        if (leads.length > 0) {
            console.log(`[T1] ✅ SUCCESS: Lead is visible to Tenant 1 (own tenant).`);
        } else {
            console.log(`[T1] ❌ FAIL: Lead was NOT visible to Tenant 1!`);
        }
    });

    // Cleanup
    console.log("[SYSTEM] Cleaning up test data...");
    await prisma.lead.delete({ where: { id: leadId } });
    console.log("Clean up finished.");
}

testRLS().catch(e => {
    console.error("Test failed:", e);
}).finally(() => {
    process.exit(0);
});
