const logger = require('../lib/logger');

/**
 * Middleware para restringir o acesso baseado no role do usuário.
 * Exige que req.user tenha sido injetado pelo auth.js.
 * 
 * @param {string[]} allowedRoles Array de roles permitidas (ex: ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ENGINEER'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn('[RBAC] Acesso negado: req.user ou req.user.role ausente', { url: req.originalUrl });
      return res.status(403).json({ error: 'Acesso negado: Perfil não identificado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`[RBAC] Acesso negado: Role ${req.user.role} não está no array de permitidos [${allowedRoles.join(',')}]`, { 
        userId: req.user.id, 
        url: req.originalUrl 
      });
      return res.status(403).json({ error: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
    }

    next();
  };
};

module.exports = {
  requireRole
};
