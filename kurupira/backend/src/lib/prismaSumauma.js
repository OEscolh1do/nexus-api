const { PrismaClient } = require('../../../node_modules/.prisma/client-sumauma');

/**
 * Prisma Client READ-ONLY para db_sumauma.
 * 
 * Conectado com user_admin (SELECT only).
 * Usado pelo middleware de autenticação e RBAC para resolver tokens Logto
 * em tenantId e role, garantindo o Tenant Isolation.
 */
const prismaSumauma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_SUMAUMA_RO },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prismaSumauma;
