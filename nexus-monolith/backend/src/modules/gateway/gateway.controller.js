const express = require('express');
const { enforceApiQuota } = require('../../middleware/api-quota.middleware');
const { asyncLocalStorage } = require('../../lib/asyncContext');
const { withTenant } = require('../../lib/prisma');

const gatewayRouter = express.Router();

// Apply the Monetization Firewall to all routes inside the Gateway
gatewayRouter.use(enforceApiQuota);

// Middleware to inject the Tenant context based on the API Key Owner
gatewayRouter.use((req, res, next) => {
    asyncLocalStorage.run({
        tenantId: req.tenant.id,
        // Gateway calls don't have a human 'userId', we run as the System/API Key
        userId: 'API_GW_' + req.apiKey.id.substring(0, 8)
    }, () => {
        next();
    });
});

/**
 * GET /api/v2/gateway/ping
 * Simulates a handshake from an external ERP.
 */
gatewayRouter.get('/ping', (req, res) => {
    res.json({
        success: true,
        gateway: 'Nexus Enterprise OData',
        tenant: req.tenant.name,
        plan: req.tenant.apiPlan,
        usage: `${req.tenant.apiCurrentUsage + 1} / ${req.tenant.apiMonthlyQuota}`
    });
});

/**
 * GET /api/v2/gateway/projects
 * Typical B2B data feed. External systems pull all active projects.
 */
gatewayRouter.get('/projects', async (req, res) => {
    try {
        const data = await withTenant(async (tx) => {
            return tx.project.findMany({
                select: {
                    id: true,
                    title: true,
                    status: true,
                    progressPercentage: true,
                    startDate: true,
                    budget: true // Demo, assuming there is financial routing
                },
                take: 100 // Hard limit for API pagination
            });
        });

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        console.error('[GATEWAY] Data Fetch Error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch data stream.' });
    }
});

module.exports = gatewayRouter;
