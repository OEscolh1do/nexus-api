const prismaSumauma = require('./prismaSumauma');
const logger = require('./logger');

/**
 * Helper para registrar logs de auditoria no db_sumauma.
 */
const HIGH_RISK_ACTIONS = ['ADMIN_DELETE', 'DELETE'];

async function auditLog({ operator, action, entity, resourceId, details, before, after, ipAddress, userAgent }) {
  const userId = operator?.id || null;
  const tenantId = operator?.tenantId || null;

  try {
    await prismaSumauma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entity,
        resourceId: String(resourceId),
        details: typeof details === 'string' ? details : JSON.stringify(details),
        before: before || undefined,
        after: after || undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Para ações de alto risco, a falha de auditoria deve ser visível — não pode passar silenciosamente
    if (HIGH_RISK_ACTIONS.includes(action)) {
      logger.error('CRÍTICO: falha ao registrar audit log de alto risco', { action, entity, resourceId, err: error.message });
    } else {
      logger.warn('Falha ao registrar audit log', { action, entity, resourceId, err: error.message });
    }
  }
}

module.exports = { auditLog };
