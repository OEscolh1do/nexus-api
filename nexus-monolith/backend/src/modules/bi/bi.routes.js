const express = require('express');
const router = express.Router();
const predictiveService = require('./predictive.service');
const { authenticateToken, requireRole } = require('../iam/middleware/auth.middleware');

// Em produção, isso seria requireRole(['ADMIN', 'COORDENACAO'])
router.use(authenticateToken);

/**
 * Rota GET: /api/bi/capacity
 * Objetivo: Transmitir o array mapeado de previsão estrutural (Heatmap)
 * Acesso Rigoroso: Apenas "C_LEVEL" (Conselho Executivo) ou administradores podem ver gargalos de longo alcance.
 */
router.get('/capacity', requireRole(['C_LEVEL', 'DIRECTOR']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId; // Protegido pelo JWT middleware

        // Geramos previsão para o Semestre futuro (6 meses)
        const heatmapData = await predictiveService.getCapacityVortex(tenantId, 6);

        return res.json({
            success: true,
            message: "Capacity Vortex Prediction Array computed successfully.",
            data: heatmapData
        });

    } catch (error) {
        console.error('[PredictiveService] Critical Vortex Error: ', error);
        return res.status(500).json({
            success: false,
            message: "Predictive Analytics Algorithm failed to process future models.",
            error: error.message
        });
    }
});

module.exports = router;
