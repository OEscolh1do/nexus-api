const express = require('express');
const router = express.Router();
const lumiController = require('./lumi.controller');
const { authenticateToken } = require('../../iam/middleware/auth.middleware');

// Middleware de Autenticação para verificar origem do Lumi
// Podemos refinar depois para checar um "Lumi API Key" ou um TenantID
router.use(authenticateToken);

// Retorna todos os clientes do usuário (leads e prospecções)
router.get('/clients', lumiController.getClients);

// Recebe uma proposta gerada no Lumi para salvar/criar projeto
router.post('/proposals', lumiController.receiveProposal);

module.exports = router;
