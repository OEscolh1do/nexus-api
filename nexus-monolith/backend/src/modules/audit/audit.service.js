/**
 * 🔍 AUDIT SERVICE
 *
 * Responsável por registrar mudanças críticas no sistema.
 *
 * Casos de uso:
 * 1. UPDATE em Project.details (SolarFlow e outros módulos)
 * 2. DELETE de projetos
 * 3. Mudanças em permissões de usuários (futuro)
 *
 * Autor: Antigravity AI
 * Data: 2026-01-20
 */

const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Registra uma ação de auditoria.
 *
 * @param {object} params - Parâmetros da auditoria
 * @param {string} params.userId - ID do usuário que executou a ação
 * @param {string} params.action - Tipo de ação (ex: "UPDATE_PROJECT_DETAILS")
 * @param {string} params.resourceId - ID do recurso afetado
 * @param {object|null} params.before - Estado anterior (será serializado)
 * @param {object|null} params.after - Estado novo (será serializado)
 * @param {string|null} params.ipAddress - IP de origem (opcional)
 * @param {string|null} params.userAgent - User-Agent do navegador (opcional)
 * @returns {Promise<object>} Registro de auditoria criado
 */
async function logAudit({
  userId,
  action,
  resourceId,
  before,
  after,
  ipAddress,
  userAgent,
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceId,
        before: before || Prisma.DbNull,
        after: after || Prisma.DbNull,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    console.log(
      `[AUDIT] ✅ Log criado: ${action} por userId=${userId} em recurso=${resourceId}`,
    );
    return auditLog;
  } catch (error) {
    // NÃO falhar a operação principal se auditoria falhar
    console.error(
      `[AUDIT] ❌ Erro ao criar log (operação principal continua):`,
      error.message,
    );
    return null;
  }
}

/**
 * Busca logs de auditoria de um recurso específico.
 *
 * @param {string} resourceId - ID do recurso
 * @param {number} limit - Número máximo de logs (padrão: 50)
 * @returns {Promise<Array>} Array de logs ordenados por timestamp desc
 */
async function getAuditLogs(resourceId, limit = 50) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { resourceId },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        resourceId: true,
        details: true,
        timestamp: true,
        ipAddress: true,
        user: {
          select: {
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return logs;
  } catch (error) {
    console.error(`[AUDIT] Erro ao buscar logs:`, error);
    return [];
  }
}

/**
 * Busca logs de auditoria de um usuário específico.
 *
 * @param {string} userId - ID do usuário
 * @param {number} limit - Número máximo de logs (padrão: 50)
 * @returns {Promise<Array>} Array de logs ordenados por timestamp desc
 */
async function getAuditLogsByUser(userId, limit = 50) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error(`[AUDIT] Erro ao buscar logs do usuário:`, error);
    return [];
  }
}

module.exports = {
  logAudit,
  getAuditLogs,
  getAuditLogsByUser,
};
