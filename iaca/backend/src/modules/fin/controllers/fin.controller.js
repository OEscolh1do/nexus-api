const express = require('express');
const router = express.Router();
const FinService = require('../services/fin.service');
const { authenticateToken, requireRole } = require('../../iam/middleware/auth.middleware');

// GET /api/v2/fin/ledger -> list transactions
router.get('/ledger', authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await FinService.getLedger({ startDate, endDate });
    res.json({ success: true, data });
});

// GET /api/v2/fin/balance -> summary
router.get('/balance', authenticateToken, async (req, res) => {
    const data = await FinService.getBalance();
    res.json({ success: true, data });
});

// POST /api/v2/fin/transactions -> add entry
router.post('/transactions', authenticateToken, async (req, res) => {
    // Note: Validation is handled in service for this simple module, 
    // or we could add Zod here if it grows.
    const transaction = await FinService.recordTransaction(req.body, req.user.id);
    res.json({ success: true, data: transaction });
});

module.exports = router;
