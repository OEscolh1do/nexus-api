const express = require("express");
const router = express.Router();
const { SolarProposalSchema } = require("./solar.schema");
const SolarService = require("./solar.service");
const { authenticateToken } = require("../../middleware/auth.middleware");

// POST /api/v2/solar/proposals
router.post("/proposals", authenticateToken, async (req, res) => {
    // 1. VALIDAÇÃO ZOD (Trust No One)
    // Zod throws error which is caught by global handler
    const validatedData = SolarProposalSchema.parse(req.body);

    // 2. CHAMADA AO SERVIÇO
    const newProject = await SolarService.createProposal(
      validatedData, 
      req.user.id
    );

    // 3. RETORNO PADRONIZADO
    res.status(201).json({
      success: true,
      data: newProject,
      message: "Proposta criada com sucesso"
    });
});

module.exports = router;
