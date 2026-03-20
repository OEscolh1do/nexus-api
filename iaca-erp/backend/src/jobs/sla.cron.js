const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { acquireCronLock, releaseCronLock } = require('../lib/cron-lock');

/**
 * Motor de SLA Corporativo. Varre a base de dados de tempos em tempos para punir/alertar atrasos no ApprovalGate.
 */
const checkSlaViolations = async () => {
    const CRON_ID = 'SLA_MONITOR_CRON';
    const lockSignature = await acquireCronLock(CRON_ID, 2); // Trava curta (2 min)

    if (!lockSignature) {
        console.log(`[CRON - SLA] ⏳ Outra instância já está executando o ${CRON_ID}.Pulando.`);
        return; // Outra instância já assumiu
    }

    console.log('[CRON-SLA] ⏳ Iniciando varredura de tickets expirados no ApprovalGate... (Lock Acquired)');

    try {
        // Como o CRON não está atrelado a uma Request Web (não tem asyncLocalStorage com tenantId),
        // precisamos rodar usando o Prisma root para o sistema inteiro,
        // mas iterando de forma segura (isso é uma rotina de Back-Office do Sistema).

        const now = new Date();
        let skip = 0;
        const take = 500;
        let hasMore = true;
        let failedGatesCount = 0;

        while (hasMore) {
            const expiredGates = await prisma.approvalGate.findMany({
                where: {
                    status: 'PENDING',
                    deadlineAt: {
                        // SLA estourado: data atual é > deadline
                        lt: now
                    }
                },
                take: take,
                skip: skip,
                orderBy: { id: 'asc' }
            });

            if (expiredGates.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`[CRON-SLA] Processando Batch Lote ${skip} a ${skip + expiredGates.length}...`);

            // Aqui conectaríamos um micro-serviço de Email (Nodemailer, SendGrid, BullMQ)
            // para escalar imediatamente a notificação aos diretores/C_LEVEL.
            for (const gate of expiredGates) {
                console.warn(`         -> Gate ${gate.id} | ${gate.resourceType} | Atrasado desde: ${gate.deadlineAt}`);
                failedGatesCount++;
            }

            skip += take;
        }

        if (failedGatesCount > 0) {
            console.log(`[CRON-SLA] 🚨 ALERTA RED: ${failedGatesCount} ApprovalGates totais com SLA estourado!`);
        } else {
            console.log('[CRON-SLA] ✅ Todos os SLAs de aprovação estão dentro do prazo.');
        }

        // Assuming 0 tickets are auto-rejected as per the original logic,
        // or this variable would be calculated if auto-rejection was implemented.
        const autoRejectedCount = 0;
        console.log(`[CRON - SLA] ✅ Varredura concluída.${autoRejectedCount} tickets penalizados.`);

    } catch (error) {
        console.error('[CRON-SLA] 🚨 Falha crítica no motor de SLA:', error);
    } finally {
        await releaseCronLock(CRON_ID, lockSignature); // Libera o recurso distribuído com a assinatura
        console.log(`[CRON - SLA] 🔓 Lock para ${CRON_ID} liberado.`);
    }
};

/**
 * ⏰ SLA MONITORING CRON
 * Fase 2: Eficiência Operacional
 * Varredura ativa para alertar a diretoria (C-LEVEL) quando portões de aprovação perdem o prazo.
 */
function initSlaCronJobs() {
    console.log('[CRON] ⏰ Motor de SLAs Automáticos inicializado.');

    // Roda a cada 60 minutos (no início da hora)
    // "0 * * * *" means every hour at minute 0
    cron.schedule('0 * * * *', checkSlaViolations);
}

module.exports = { initSlaCronJobs };
