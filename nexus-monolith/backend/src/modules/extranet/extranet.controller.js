const express = require('express');
const { requireRole, authenticateToken } = require('../iam/middleware/auth.middleware');
const { withTenant } = require('../../lib/prisma');

const extranetRouter = express.Router();

/**
 * 🏢 B2B CLIENT PORTAL API
 * Strictly returns data where Project.clientId === req.user.id
 */
extranetRouter.get('/b2b/projects', authenticateToken, requireRole(['B2B_CLIENT', 'ADMIN']), async (req, res) => {
    try {
        const data = await withTenant(async (tx) => {
            // ADMIN ignora a trava de clientId pra testar o layout de clientes. B2B fica preso no próprio ID.
            const accessFilter = req.user.role === 'ADMIN' ? {} : { clientId: req.user.id };

            return tx.project.findMany({
                where: accessFilter,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    progressPercentage: true,
                    startDate: true,
                    endDate: true,
                    Budget: {
                        select: {
                            totalPlanned: true,
                            totalSpent: true,
                            currency: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('[EXTRANET B2B] Erro:', error);
        res.status(500).json({ success: false, error: 'Erro de infraestrutura ao buscar projetos do Portal do Cliente.' });
    }
});


/**
 * 👷 B2P VENDOR PORTAL API
 * Strictly returns Tasks and PurchaseOrders where vendorId or assignedTo matches the Vendor context.
 */
extranetRouter.get('/b2p/tasks', authenticateToken, requireRole(['B2P_VENDOR', 'ADMIN']), async (req, res) => {
    try {
        if (!req.user.vendorId && req.user.role === 'B2P_VENDOR') {
            return res.status(403).json({ success: false, error: 'Sua conta de Parceiro (B2P) precisa estar vinculada a um CNPJ/Vendor.' });
        }

        const data = await withTenant(async (tx) => {
            // O Parceiro consegue ver as tarefas (RDOs aguardando) atreladas à ordem de serviço do Fornecedor dele.
            return tx.operationalTask.findMany({
                where: {
                    PurchaseOrder: {
                        some: {
                            vendorId: req.user.vendorId
                        }
                    }
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    dueDate: true,
                    progressPercent: true, // actually it's completionPercent
                    completionPercent: true,
                    project: {
                        select: {
                            title: true
                        }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('[EXTRANET B2P] Erro:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar Tarefas do Empreiteiro.' });
    }
});

module.exports = extranetRouter;
