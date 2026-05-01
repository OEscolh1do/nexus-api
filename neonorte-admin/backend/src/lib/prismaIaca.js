const { PrismaClient } = require('../../node_modules/.prisma/client-iaca');

/**
 * Prisma Client READ-ONLY para db_iaca.
 * 
 * Conectado com user_admin (SELECT only).
 * Usado para: listar tenants, users, audit logs, sessions, cron locks.
 */
const prismaIaca = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_IACA_RO },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prismaIaca;
