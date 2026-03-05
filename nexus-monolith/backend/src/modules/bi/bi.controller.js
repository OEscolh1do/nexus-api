const express = require('express');
const router = express.Router();
const BiService = require('./bi.service');
const { authenticateToken } = require('../../middleware/auth.middleware');

// GET /api/v2/bi/overview -> Dashboard Feed
router.get('/overview', authenticateToken, async (req, res) => {
    const data = await BiService.getOverview();
    res.json({ success: true, data });
});

module.exports = router;
