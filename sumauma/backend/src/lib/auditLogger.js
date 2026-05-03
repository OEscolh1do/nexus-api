const prismaSumauma = require('./prismaSumauma');

/**
 * Helper para registrar logs de auditoria no db_sumauma.
 */
async function auditLog({ operator, action, entity, resourceId, details, before, after, ipAddress, userAgent }) {
  try {
    // IDs agora são opcionais no schema
    const userId = operator?.id || null;
    const tenantId = operator?.tenantId || null;

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
    console.error('[AuditLogger] Falha ao registrar log:', error.message);
  }
}

module.exports = { auditLog };
