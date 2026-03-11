const prisma = require('./prisma');

/**
 * 🔒 Distribured Lock Manager para Cron Jobs (Tech Debt Sprint: Idempotência)
 * Garante que múltiplos servidores (Instâncias Vercel/Fly.io) não engatilhem a mesma rotina no mesmo minuto,
 * varrendo a chance de criar notificações/compras duplicadas.
 */
async function acquireCronLock(cronId, lockMinutes = 5) {
    try {
        try {
            // Garante que o registro da Trava existe, inicializando como "expirado" (Epoch 0)
            await prisma.cronLock.upsert({
                where: { id: cronId },
                update: {}, // Não atualiza se existir
                create: { id: cronId, lockedAt: new Date(0), expiresAt: new Date(0) }
            });
        } catch (upsertError) {
            // Se instâncias acordarem juntas e derem INSERT ao mesmo tempo,
            // ignoramos o viés P2002 (Unique Exception) pacificamente.
            if (upsertError.code !== 'P2002') {
                throw upsertError;
            }
        }

        const now = new Date();
        const expirationTime = new Date(now.getTime() + lockMinutes * 60000);

        // Bloqueio Otimista / Atômico do PostgreSQL:
        // Só deixará o "count" ser > 0 se o horário atual ultrapassou a expiração do último lock.
        const lockUpdate = await prisma.cronLock.updateMany({
            where: {
                id: cronId,
                expiresAt: {
                    lt: now // Só pega a trava se ela já venceu
                }
            },
            data: {
                lockedAt: now,
                expiresAt: expirationTime
            }
        });

        // Se conseguiu atualizar a linha no banco, devolvemos a assinatura (Owner Token)
        if (lockUpdate.count > 0) return now;
        return null;
    } catch (error) {
        console.error(`[LOCK-SYSTEM] Falha ao adquirir Distributed Lock para ${cronId}:`, error);
        return null;
    }
}

/**
 * Libera a trava manualmente garantindo que nós ainda somos os donos dela!
 * (Previne que o Servidor A, atrasado, delete o lock do Servidor B acidentalmente)
 */
async function releaseCronLock(cronId, lockSignature) {
    if (!lockSignature) return; // Nenhuma assinatura foi provida

    try {
        await prisma.cronLock.updateMany({
            where: {
                id: cronId,
                lockedAt: lockSignature // MUST EXACTLY MATCH: Só dono solta a coleira
            },
            data: { expiresAt: new Date(0) } // Força a expiração imediata
        });
    } catch (error) {
        console.error(`[LOCK-SYSTEM] Falha ao liberar Distributed Lock para ${cronId}:`, error);
    }
}

module.exports = { acquireCronLock, releaseCronLock };
