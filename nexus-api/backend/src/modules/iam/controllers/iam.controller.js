const express = require('express');
const router = express.Router();
const IamService = require('../services/iam.service');
const { authenticateToken } = require('../middleware/auth.middleware');
const { LoginSchema } = require('../schemas/iam.schemas');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// L8 SEC-OPS PATCH: DDoS Protection for Auth Endpoints (Previne 100% CPU lock por Bcrypt parsing)
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    max: 10, // Limite de 10 tentativas de Auth por IP
    message: {
        success: false,
        error: "Muitas tentativas falhas de login. Arquitetura de segurança ativada. Aguarde 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 🛡️ Helper para Validação Zod (Pode ser movido para middleware global)
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        next(err); // Passa para o Error Handler global
    }
};

// POST /api/v2/iam/login
router.post('/login', loginRateLimiter, validate(LoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(`[IAM] Login Attempt: ${username}`);

        // --- Phase 3: ENTERPRISE SSO DOMAIN INTERCEPTOR ---
        if (username.includes('@')) {
            const domain = username.split('@')[1];

            // Check if this domain belongs to any tenant that ENFORCES SSO
            const ssoTenant = await prisma.tenant.findFirst({
                where: {
                    ssoDomain: domain,
                    ssoEnforced: true
                }
            });

            if (ssoTenant) {
                console.warn(`[IAM 🛡️] SSO Intercepted for ${username} -> Routing to ${ssoTenant.ssoProvider}`);
                return res.status(401).json({
                    success: false,
                    isSSO: true,
                    ssoProvider: ssoTenant.ssoProvider,
                    message: `O domínio corporativo '${domain}' exige autenticação via Portal Corporativo (${ssoTenant.ssoProvider}).`
                });
            }
        }
        // --------------------------------------------------

        const result = await IamService.login(username, password);

        console.log(`[IAM] Success: ${username}`);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/iam/sso/callback
// (Conceptual Endpoint for receiving SAML/OIDC Tokens)
router.get('/sso/callback/:provider', async (req, res, next) => {
    try {
        const provider = req.params.provider;
        // In a real scenario, passport.js or a library validates the token from Microsoft/Google.
        // We will mock a successful issuance based on the domain.
        res.json({ success: true, message: `SSO Flow Callback Mapped for ${provider}. Implementation pending third-party IDP certificates.` });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/iam/me -> Current User Data & Permissions
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        // req.user is set by authenticateToken middleware
        const permissions = IamService.getPermissionsForRole(req.user.role);

        res.json({
            success: true,
            data: {
                user: req.user,
                permissions
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v2/iam/users -> All Users (for Assignees)
router.get('/users', authenticateToken, async (req, res, next) => {
    try {
        // L8 SEC-OPS PATCH: Bind Request Tenant ID to prevent mass identity dump
        const users = await IamService.getAllUsers(req.user.tenantId || req.user.orgUnitId);
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
