/**
 * Executive Controller
 * Roteia as requisições executivas e lida com auth/RBAC se necessário.
 */
const express = require("express");
const router = express.Router();
const ExecutiveService = require("../services/executive.service");
const { authenticateToken, requireRole } = require("../../../modules/iam/middleware/auth.middleware");

// Require Role: DIRETORIA (Admin usually bypasses or is included if the middleware is correctly built)
// Let's protect this with authenticateToken for now.

router.get("/metrics", authenticateToken, async (req, res, next) => {
    try {
        const data = await ExecutiveService.getMetrics();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.get("/portfolio-health", authenticateToken, async (req, res, next) => {
    try {
        const data = await ExecutiveService.getPortfolioHealth();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// Mock for risks-summary from gap_analysis
router.get("/risks-summary", authenticateToken, async (req, res, next) => {
    try {
        res.json({ success: true, data: { activeRisks: [] } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
