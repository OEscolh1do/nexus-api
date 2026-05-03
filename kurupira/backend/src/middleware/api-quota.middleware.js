const prismaSumauma = require('../lib/prismaSumauma');
const crypto = require('crypto');
const logger = require('../lib/logger');

/**
 * Enterprise API Quota Middleware
 * Intercepts requests to the B2B Gateway, reads the x-api-key header,
 * maps to a Tenant, checks consumption metrics against the monthly limit.
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
        const keyHash = rawApiKey; // In our demo, the raw API Key acts as the identifier

        // Find the API Key and Include the Tenant Constraints in db_sumauma
        const apiKeyRecord = await prismaSumauma.tenantApiKey.findUnique({
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
            logger.warn(`[API GATEWAY] ⛔ Quota Exceeded for Tenant ${tenant.name} (${tenant.id}) - Plan: ${tenant.apiPlan}`);
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

        // [TODO M2M] O Kurupira não pode incrementar a quota diretamente pois usa uma conexão Read-Only com db_sumauma.
        // O incremento de quota deve ser delegado ao Sumaúma via fila Kafka/RabbitMQ ou M2M endpoint.
        // Para a SPEC-006, apenas deixamos o rastro em log.
        logger.info(`[API GATEWAY] Quota trace: Tenant ${tenant.id} usou API Key ${apiKeyRecord.id}`);

    } catch (error) {
        logger.error('[API GATEWAY] Internal Integration Error:', { err: error.message });
        return res.status(500).json({
            success: false,
            error: 'Server Infrastructure Error parsing Gateway Middleware.'
        });
    }
}

module.exports = { enforceApiQuota };
