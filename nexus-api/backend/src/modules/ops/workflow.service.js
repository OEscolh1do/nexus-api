const { withTenant } = require('../../lib/prisma');
const AppError = require('../../utils/AppError');

/**
 * WORKFLOW ENGINE SERVICE
 * Fase 2: Governância Operacional.
 * Responsável por gerir portões de aprovação (ApprovalGates) e Change Orders institucionais.
 */
class WorkflowService {
    /**
     * Solicita aprovação para um recurso específico corporativo.
     * Exemplo: Aprovar uma Invoice de Fornecedor ou Mudar o SLA de um Projeto.
     * 
     * @param {Object} params
     * @param {string} params.resourceType - 'PurchaseOrder', 'Invoice', 'ChangeOrder'
     * @param {string} params.resourceId - ID do recurso a ser travado/liberado
     * @param {string} params.requiredRole - O papel corporativo mínimo exigido (ex: 'C_LEVEL', 'DIRECTOR')
     * @param {string} params.requestedById - ID do usuário criando a solicitação
     * @param {number} params.slaHours - Horas até o SLA estourar (padrão: 48h)
     * @param {string} params.justification - Texto justificando o pedido
     * @returns {Promise<Object>} ApprovalGate criado
     */
    async requestApproval({ resourceType, resourceId, requiredRole, requestedById, slaHours = 48, justification }) {
        if (!resourceType || !resourceId || !requiredRole || !requestedById) {
            throw new AppError('Dados incompletos para solicitar aprovação', 400);
        }

        const payload = {
            resourceType,
            resourceId,
            requiredRole,
            requestedById,
            justification,
        };

        if (slaHours > 0) {
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + slaHours);
            payload.deadlineAt = deadline;
        }

        const gate = await withTenant(async (tx) => {
            // Prevents duplicate pending requests for the same exact resource
            const existing = await tx.approvalGate.findFirst({
                where: { resourceId, resourceType, status: 'PENDING' }
            });
            if (existing) {
                throw new AppError(`Já existe uma aprovação pendente para o recurso ${resourceId}.`, 409);
            }

            return tx.approvalGate.create({
                data: payload
            });
        });

        console.log(`[WORKFLOW] 🔐 Novo portão requerido: ${resourceType} para a regra ${requiredRole}`);
        return gate;
    }

    /**
     * Resolve um Portão de Aprovação.
     * Somente usuários com Role adequado ou superior devem chamar este método.
     * 
     * @param {string} gateId - ID do portão
     * @param {string} approvedById - ID do aprovador (Auditoria)
     * @param {string} decision - 'APPROVED' ou 'REJECTED'
     * @param {string} role - Role atual do aprovador para validação
     */
    async resolveGate(gateId, approvedById, decision, role) {
        if (!['APPROVED', 'REJECTED'].includes(decision)) {
            throw new AppError("A decisão deve ser 'APPROVED' ou 'REJECTED'.", 400);
        }

        const result = await withTenant(async (tx) => {
            const gate = await tx.approvalGate.findUnique({ where: { id: gateId } });
            if (!gate) throw new AppError('Approval Gate não encontrado', 404);
            if (gate.status !== 'PENDING') throw new AppError(`Este portão já foi processado como ${gate.status}`, 400);

            // Simple internal Role-Check logic
            // No mundo real, usaríamos o auth.middleware, mas validamos aqui para rigor duplo.
            if (gate.requiredRole === 'C_LEVEL' && role !== 'C_LEVEL') {
                throw new AppError('Autorização inválida: Apenas C-Level pode resolver este portão.', 403);
            }
            if (gate.requiredRole === 'DIRECTOR' && !['C_LEVEL', 'DIRECTOR'].includes(role)) {
                throw new AppError('Autorização inválida: Apenas Diretores ou superiores.', 403);
            }

            const updated = await tx.approvalGate.update({
                where: { id: gateId },
                data: {
                    status: decision,
                    approvedById
                }
            });

            // Aqui entra os Hooks de Sucesso. Por ex: 
            // Se for Invoice APPROVED, mudar Invoice.status = 'APPROVED'.
            if (decision === 'APPROVED') {
                if (gate.resourceType === 'Invoice') {
                    await tx.invoice.update({
                        where: { id: gate.resourceId },
                        data: { status: 'APPROVED' }
                    }).catch(e => console.error("Erro secundário atualizando invoice", e));
                } else if (gate.resourceType === 'PurchaseOrder') {
                    await tx.purchaseOrder.update({
                        where: { id: gate.resourceId },
                        data: { status: 'APPROVED' }
                    }).catch(e => console.error("Erro secundário atualizando PO", e));
                }
            }

            return updated;
        });

        console.log(`[WORKFLOW] 🚦 Portão ${gateId} resolvido como ${decision} por ${approvedById}.`);
        return result;
    }

    /**
     * Lista portões aguardando aprovação C-Level (Command Center Dashboard).
     */
    async getPendingApprovals() {
        return await withTenant(async (tx) => {
            return tx.approvalGate.findMany({
                where: { status: 'PENDING' },
                orderBy: { deadlineAt: 'asc' }
            });
        });
    }
}

module.exports = new WorkflowService();
