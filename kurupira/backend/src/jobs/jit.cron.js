const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { acquireCronLock, releaseCronLock } = require('../lib/cron-lock');
const logger = require('../lib/logger');

/**
 * 🚛 JIT LOGISTICS ENGINE (Phase 3 Corporate Strategy)
 * 
 * Filosofia: Reduzir capital imobilizado engatilhando compras apenas
 * no timing exato ("Lead Time") em que o fornecedor exige para 
 * entregar no "Start Date" da Tarefa no campo (Gantt).
 */
const checkJitLogisticsTriggers = async () => {
    const CRON_ID = 'JIT_LOGISTICS_CRON';
    const lockSignature = await acquireCronLock(CRON_ID, 10); // Recebe o Token Dono

    if (!lockSignature) {
        // Outra instância / servidor já assumiu essa varredura!
        return;
    }

    logger.info('Iniciando varredura diária de Alocação Just-In-Time... (Lock acquired)');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera hora para precisão de "Dias Brutos"

        let triggeredCount = 0;
        let skip = 0;
        const take = 500; // Paginação em Lote para proteger a memória (OOM Bug)
        let hasMore = true;

        while (hasMore) {
            // 1. Encontrar todas as Ordens de Compra em "DRAFT" que têm uma Tarefa de Gantt amarrada
            const pendingPurchaseOrders = await prisma.purchaseOrder.findMany({
                where: {
                    status: 'DRAFT',
                    taskId: { not: null }
                },
                include: {
                    material: true,
                    task: true,
                    vendor: true
                },
                take: take,
                skip: skip,
                orderBy: { id: 'asc' } // Necessário para a paginação ser determinística
            });

            if (pendingPurchaseOrders.length === 0) {
                hasMore = false;
                break;
            }

            for (const po of pendingPurchaseOrders) {
                // Defesa QA: Se a Ordem for um Rascunho Órfão (Sem Tarefa atrelada ou deletada), pular graciosamente
                if (!po.task || !po.task.startDate) continue;

                const taskStartDate = new Date(po.task.startDate);
                taskStartDate.setHours(0, 0, 0, 0);

                // Defesa QA DST Bug: Usar Math.round para compensar o Horário de Verão (+/- 1 hr)
                const diffTime = taskStartDate.getTime() - today.getTime();
                const daysUntilTaskStarts = Math.round(diffTime / (1000 * 60 * 60 * 24));

                const supplierLeadTime = po.material.leadTimeDays || 15;

                // O Gatilho JIT (Aceita Tasks Atrasadas no Passado e Janelas Exatas do Futuro)
                if (daysUntilTaskStarts <= supplierLeadTime) {

                    // 2. Verificar se já não engatilhamos uma Aprovação JIT para essa PO
                    const existingGate = await prisma.approvalGate.findFirst({
                        where: { resourceType: 'PurchaseOrder', resourceId: po.id }
                    });

                    if (!existingGate) {
                        // 3. O Robo de suprimentos insere a pendência diretamente no painel do Diretor.
                        // L8 SEC-OPS PATCH: Recupera o Tenant ID nativo da tarefa, evitando o "Buraco Negro do Default-Tenant"
                        const isolatedTenantContext = po.task.tenantId || po.vendor.tenantId || "default-tenant-001";

                        await prisma.approvalGate.create({
                            data: {
                                tenantId: isolatedTenantContext,
                                resourceType: 'PurchaseOrder',
                                resourceId: po.id,
                                requiredRole: (po.totalPrice > 50000) ? 'C_LEVEL' : 'DIRECTOR',
                                status: 'PENDING',
                                requestedById: po.task.assignedTo || "sys_jit_00000000000000000", // UID Canônico Reservado para o Robô JIT
                                justification: `[JIT TRIGGER] O material ${po.material.name} tem Lead Time logístico de ${supplierLeadTime} dias e a tarefa "${po.task.title}" iniciará em ${daysUntilTaskStarts} dias. Aprovação Urgente requerida para evitar atrasos na obra ou multa contratual.`,
                                deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // SLA de 48h para a Diretoria agir
                            }
                        });

                        logger.info(`Gatilho Ativado: PO-${po.id} (Material: ${po.material.name}) para Fornecedor ${po.vendor.name}.`);
                        triggeredCount++;
                    }
                }
            }

            skip += take; // Pavança para a próxima página
        }

        logger.info(`Varredura concluída. ${triggeredCount} Requisições(s) Just-In-Time enviada(s) à Diretoria.`);

    } catch (error) {
        logger.error('Erro Catastrófico no Motor Logístico: ', error);
    } finally {
        await releaseCronLock(CRON_ID, lockSignature); // Só o dono solta o lock
    }
}

// Inicia os Crons do Subsistema de Operações (Logística)
const initJitCronJobs = () => {
    // Roda todos os dias às 03:00 AM
    cron.schedule('0 3 * * *', () => {
        checkJitLogisticsTriggers();
    });

    // **Apenas para Teste de Verificação Manual (Fase 3):** Roda a cada 2 minutos
    cron.schedule('*/2 * * * *', () => {
        checkJitLogisticsTriggers();
    });

    logger.info('🚛 JIT Corporate Logistics Module Initialized.');
};

module.exports = { initJitCronJobs, checkJitLogisticsTriggers };
