const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

/**
 * Enterprise API Quota Middleware
 * Intercepts requests to the B2B Gateway, reads the x-api-key header,
 * maps to a Tenant, checks consumption metrics against the monthly limit,
 * and if allowed, increments the usage counter.
 */
async function enforceApiQuota(req, res, next) {
    const rawApiKey = req.headers['x-api-key'];

    if (!rawApiKey) {
        return res.status(401).json({
            success: false,
            error: 'API Key Ausente',
            message: 'O cabeçalho x-api-key é obrigatório para acessar o Gateway Nexus Enterprise.'
        });
    }

    try {
        // As keys usually hash for security, simulate verifying the keyHash.
        // For plain text (simplification): assume the rawApiKey is the `keyHash` or use a hash function.
        // Real-world: const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
        const keyHash = rawApiKey; // In our demo, the raw API Key acts as the identifier

        // Find the API Key and Include the Tenant Constraints
        const apiKeyRecord = await prisma.tenantApiKey.findUnique({
            where: { keyHash },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        apiPlan: true,
                        apiMonthlyQuota: true,
                        apiCurrentUsage: true
                    }
                }
            }
        });

        if (!apiKeyRecord) {
            return res.status(401).json({
                success: false,
                error: 'Chave de Acesso Inválida',
                message: 'A API Key fornecida não consta em nossos registros de Integração.'
            });
        }

        const tenant = apiKeyRecord.tenant;

        // Quota Verification
        if (tenant.apiCurrentUsage >= tenant.apiMonthlyQuota) {
            console.warn(`[API GATEWAY] ⛔ Quota Exceeded for Tenant ${tenant.name} (${tenant.id}) - Plan: ${tenant.apiPlan}`);
            return res.status(429).json({
                success: false,
                error: 'Quota Exceeded - Too Many Requests',
                message: `Você esgotou seu plano de chamadas de API (${tenant.apiMonthlyQuota} requests). Faça upgrade para o Enterprise para retomar operações.`,
                usage: tenant.apiCurrentUsage,
                limit: tenant.apiMonthlyQuota
            });
        }

        // Attach tenant to the request for the downstream Controllers
        req.tenant = tenant;
        req.apiKey = apiKeyRecord;

        // Let the request pass...
        next();

        // [Asynchronous Fire-and-Forget] Increment the usage
        // Non-blocking approach so the gateway remains extremely fast.
        setImmediate(() => {
            prisma.$transaction([
                prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { apiCurrentUsage: { increment: 1 } }
                }),
                prisma.tenantApiKey.update({
                    where: { id: apiKeyRecord.id },
                    data: { lastUsed: new Date() }
                })
            ]).catch(err => console.error('[API GATEWAY] Background Quota Update Failed:', err));
        });

    } catch (error) {
        console.error('[API GATEWAY] Internal Integration Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server Infrastructure Error parsing Gateway Middleware.'
        });
    }
}

module.exports = { enforceApiQuota };
