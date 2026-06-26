const cron = require('node-cron');
const logger = require('./logger');
const { runIdentityAudit, saveAuditHistory } = require('./identityAuditService');
const prismaSumauma = require('./prismaSumauma');

/**
 * Inicializa os jobs agendados da plataforma Sumaúma.
 */
function initCronJobs() {
  logger.info('Inicializando agendador de tarefas (CronJobs)...');

  // Job 1: Auditoria de Identidade Diária (03:00 AM)
  // '0 3 * * *' -> Meia-noite e 3 às 03:00
  cron.schedule('0 3 * * *', async () => {
    logger.info('Executando auditoria de identidade automática (Agendada)');
    try {
      const report = await runIdentityAudit();
      await saveAuditHistory(report);

      // Se houver discrepâncias, logar como aviso crítico
      if (report.summary.orphans_count > 0 || 
          report.summary.missing_count > 0 || 
          report.summary.attribute_mismatch_count > 0 ||
          report.summary.orphan_orgs_count > 0) {
        logger.warn('AUDITORIA AUTOMÁTICA: Detectadas discrepâncias de integridade!', report.summary);
      } else {
        logger.info('AUDITORIA AUTOMÁTICA: Integridade 100% preservada.');
      }
    } catch (error) {
      logger.error('Falha na execução da auditoria automática', { err: error.message });
    }
  });

  // Job 2: Limpeza de Sessões Expiradas (04:00 AM, diário)
  cron.schedule('0 4 * * *', async () => {
    logger.info('Executando limpeza de sessões expiradas...');
    try {
      const result = await prismaSumauma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info(`Limpeza de sessões: ${result.count} registro(s) removido(s).`);
    } catch (error) {
      logger.error('Falha na limpeza de sessões expiradas', { err: error.message });
    }
  });
}

module.exports = { initCronJobs };
