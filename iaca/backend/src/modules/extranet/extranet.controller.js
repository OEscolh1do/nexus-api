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
/**
 * 📝 B2P VENDOR PORTAL - RDOs (Relatório Diário de Obra)
 * Allows vendors to create and list daily reports for tasks assigned to them.
 */
extranetRouter.get('/b2p/rdos', authenticateToken, requireRole(['B2P_VENDOR', 'ADMIN']), async (req, res) => {
    try {
        if (!req.user.vendorId && req.user.role === 'B2P_VENDOR') {
            return res.status(403).json({ success: false, error: 'Sua conta de Parceiro (B2P) precisa estar vinculada a um CNPJ/Vendor.' });
        }

        const data = await withTenant(async (tx) => {
            return tx.dailyReport.findMany({
                where: {
                    vendorId: req.user.vendorId
                },
                include: {
                    task: {
                        select: { title: true, project: { select: { title: true } } }
                    }
                },
                orderBy: { reportDate: 'desc' }
            });
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('[EXTRANET B2P RDO] Erro ao listar:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar Relatórios Diários de Obra.' });
    }
});

extranetRouter.post('/b2p/rdos', authenticateToken, requireRole(['B2P_VENDOR', 'ADMIN']), async (req, res) => {
    try {
        if (!req.user.vendorId && req.user.role === 'B2P_VENDOR') {
            return res.status(403).json({ success: false, error: 'Sua conta de Parceiro (B2P) precisa estar vinculada a um CNPJ/Vendor.' });
        }

        const { taskId, reportDate, weather, laborCount, progressNotes, incidentNotes } = req.body;

        if (!taskId || !reportDate || !progressNotes) {
            return res.status(400).json({ success: false, error: 'Campos obrigatórios: Tarefa (taskId), Data e Notas de Avanço.' });
        }

        // Validate if task belongs to this vendor
        const hasAccess = await withTenant(async (tx) => {
            const task = await tx.operationalTask.findFirst({
                where: {
                    id: taskId,
                    PurchaseOrder: { some: { vendorId: req.user.vendorId } }
                }
            });
            return !!task;
        });

        if (!hasAccess && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Você não tem permissão para relatar RDO nesta Tarefa/Serviço.' });
        }

        const report = await withTenant(async (tx) => {
            return tx.dailyReport.create({
                data: {
                    vendorId: req.user.vendorId,
                    taskId,
                    reportDate: new Date(reportDate),
                    weather: weather || null,
                    laborCount: parseInt(laborCount) || 0,
                    progressNotes,
                    incidentNotes: incidentNotes || null,
                    status: 'SUBMITTED'
                }
            });
        });

        res.json({ success: true, data: report });
    } catch (error) {
        console.error('[EXTRANET B2P RDO] Erro ao criar:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar o Relatório Diário de Obra (RDO).' });
    }
});

module.exports = extranetRouter;
