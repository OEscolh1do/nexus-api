const { PrismaClient } = require("@prisma/client");
const { asyncLocalStorage } = require("./asyncContext");
const { createAuditMiddleware } = require("../middleware/audit.middleware.js");

const prisma = new PrismaClient();

// Foundation: Audit Trail
prisma.$use(createAuditMiddleware());

/**
 * 🛡️ SaaS Multi-Tenancy: RLS-Aware Transaction Wrapper
 * 
 * Executes a callback inside a Prisma Interactive Transaction, 
 * ensuring `set_config('app.tenant_id', ...)` and the actual 
 * queries run on the SAME Postgres connection.
 * 
 * Usage in services:
 *   const { withTenant } = require('../../lib/prisma');
 *   
 *   async function getLeads() {
 *     return withTenant(async (tx) => {
 *       return tx.lead.findMany();
 *     });
 *   }
 * 
 * If no tenant context is found (e.g., login, cron jobs), 
 * the callback runs directly on the base prisma client (bypassing RLS).
 * 
 * @param {Function} callback - Receives a Prisma TransactionClient (tx)
 * @returns {Promise<any>} Result of the callback
 */
async function withTenant(callback) {
    const store = asyncLocalStorage.getStore();
    const tenantId = store?.tenantId;

    if (tenantId) {
        return prisma.$transaction(async (tx) => {
            // Set tenant context on THIS connection
            await tx.$executeRawUnsafe(
                `SELECT set_config('app.tenant_id', $1, true)`,
                tenantId
            );
            // Execute the business logic on the SAME connection
            return callback(tx);
        });
    }

    // No tenant context — run without RLS (Service Role / Login / Cron)
    return callback(prisma);
}

module.exports = prisma;
module.exports.withTenant = withTenant;
