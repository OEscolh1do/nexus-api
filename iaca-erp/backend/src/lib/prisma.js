const { PrismaClient } = require("@prisma/client");
const { asyncLocalStorage } = require("./asyncContext");
const { createAuditMiddleware } = require("../middleware/audit.middleware.js");

const prisma = new PrismaClient();

// Foundation: Audit Trail
prisma.$use(createAuditMiddleware());

/**
 * 🛡️ SaaS Multi-Tenancy: MySQL-Compatible Tenant Wrapper
 * 
 * Unlike PostgreSQL (which supports set_config for RLS), MySQL requires
 * explicit WHERE tenantId filtering. This wrapper provides the same
 * API (withTenant) but applies filtering at the application layer.
 * 
 * Usage remains identical:
 *   const { withTenant } = require('../../lib/prisma');
 *   
 *   async function getLeads() {
 *     return withTenant(async (tx) => {
 *       return tx.lead.findMany(); // caller adds tenantId filter
 *     });
 *   }
 * 
 * @param {Function} callback - Receives a Prisma-like client with tenant context
 * @returns {Promise<any>} Result of the callback
 */
async function withTenant(callback) {
    const store = asyncLocalStorage.getStore();
    const tenantId = store?.tenantId;

    if (tenantId) {
        // MySQL approach: wrap in transaction, attach tenantId for downstream use
        return prisma.$transaction(async (tx) => {
            tx._tenantId = tenantId;
            return callback(tx);
        });
    }

    // No tenant context — run without filtering (Service Role / Login / Cron)
    return callback(prisma);
}

module.exports = prisma;
module.exports.withTenant = withTenant;
