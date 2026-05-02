const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client MASTER para db_sumauma.
 * 
 * Este é o "God-Mode". Tem permissão de escrita total.
 * Gerencia: Tenants, Users, AuditLogs, API Keys.
 */
const prismaSumauma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prismaSumauma;
