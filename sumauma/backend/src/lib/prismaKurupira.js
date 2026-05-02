const { PrismaClient } = require('../../node_modules/.prisma/client-kurupira');

/**
 * Prisma Client READ-ONLY para db_kurupira.
 * 
 * Conectado com user_admin (SELECT only).
 * Usado para: listar catálogo de módulos, inversores, projetos técnicos.
 */
const prismaKurupira = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_KURUPIRA_RO },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prismaKurupira;
