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

const { Prisma } = require("@prisma/client");
const prisma = require('../../lib/prisma');
const { withTenant } = require('../../lib/prisma');

/**
 * Registra uma ação de auditoria.
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
    const auditLog = await withTenant(async (tx) => {
      return tx.auditLog.create({
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
 */
async function getAuditLogs(resourceId, limit = 50) {
  try {
    return await withTenant(async (tx) => {
      return tx.auditLog.findMany({
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
    });
  } catch (error) {
    console.error(`[AUDIT] Erro ao buscar logs:`, error);
    return [];
  }
}

/**
 * Busca logs de auditoria de um usuário específico.
 */
async function getAuditLogsByUser(userId, limit = 50) {
  try {
    return await withTenant(async (tx) => {
      return tx.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
    });
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
