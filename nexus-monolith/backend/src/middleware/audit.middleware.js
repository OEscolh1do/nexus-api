const { Prisma } = require("@prisma/client");

/**
 * Audit Middleware for Prisma
 * Intercepts mutative queries (create, update, delete) on Core entities
 * and logs them to the AuditLog table.
 */
const { asyncLocalStorage } = require("../lib/asyncContext");

// Entities that require strict auditing (as per PHASE_1_FOUNDATION.md)
const AUDITABLE_MODELS = [
    "Project",
    "Opportunity",
    "SolarProposal",
    "User",
    "Tenant",
    "Contract",
    "PurchaseOrder"
];

function createAuditMiddleware() {
    return async (params, next) => {
        // 1. Check if the model is auditable and the action is mutative
        const isAuditableModel = AUDITABLE_MODELS.includes(params.model);
        const isMutativeAction = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"].includes(params.action);

        if (!isAuditableModel || !isMutativeAction) {
            // If not auditable, just proceed normally
            return next(params);
        }

        const { model, action, args } = params;

        // 2. Capture "Before" state if it's an update or delete
        let beforeState = null;
        let resourceId = null;

        // If there's a where clause (usually update/delete), try to fetch the previous state
        if (args.where && args.where.id) {
            resourceId = args.where.id;
            // We need to run a separate query to get the before state.
            // Note: In a real middleware we'd need access to the prisma instance.
            // Alternatively, Prisma Client Extensions (v4.16+) are better for this, 
            // but standard middleware works if we keep it simple.
        }

        // 3. Execute the actual query
        const result = await next(params);

        // 4. Capture "After" state
        let afterState = null;

        // Attempt to extract resource ID from result if it was a create
        if (result && result.id) {
            resourceId = result.id;
            afterState = JSON.stringify(result);
        } else if (action === 'delete') {
            beforeState = JSON.stringify(result);
        } else if (action === 'update' && result) {
            afterState = JSON.stringify(result);
        }

        // 5. Build and save the AuditLog
        // L8 SEC-OPS PATCH: Extraindo contexto ativo em vez de queimar dados dummy no console
        const context = asyncLocalStorage.getStore();
        const contextUserId = context?.userId || args?.__context?.userId || "system";
        const contextTenantId = context?.tenantId || args?.__context?.tenantId || "default-tenant-001";

        // Clean up internal context from args so Prisma doesn't crash
        if (args && args.__context) {
            delete args.__context;
        }

        try {
            console.log(`[AUDIT] Action: ${action} on ${model} | Resource: ${resourceId} | By: ${contextUserId}`);

            // Require dinamicamente para evitar dependência cíclica com o construtor Prisma original
            const corePrisma = require("../lib/prisma");

            // Log Assíncrono para não travar o pool de conexão atual
            corePrisma.auditLog.create({
                data: {
                    tenantId: contextTenantId,
                    userId: contextUserId,
                    action: action,
                    entity: model,
                    resourceId: resourceId || "bulk-operation",
                    details: `Executed ${action} with args: ${JSON.stringify(args).substring(0, 200)}`,
                    after: afterState,
                    before: beforeState
                }
            }).catch(e => console.error("[AUDIT ERROR CRITICAL] Failed to persist log:", e.message));

        } catch (auditErr) {
            console.error("[AUDIT ERROR] Generator fault:", auditErr);
        }

        return result;
    };
}

module.exports = {
    createAuditMiddleware
};
