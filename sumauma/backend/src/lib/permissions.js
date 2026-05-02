const prismaSumauma = require('./prismaSumauma');

/**
 * Middleware para checar se o usuário autenticado possui uma permissão específica.
 * Exige que o middleware `platformAuth` tenha sido executado antes (para popular req.operator).
 * 
 * @param {string} requiredPermission - O slug da permissão necessária (ex: 'catalog:write')
 */
function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      // 1. Fallback / Super Admin (Se for PLATFORM_ADMIN via JWT, passa direto)
      if (req.operator && req.operator.role === 'PLATFORM_ADMIN') {
        return next();
      }

      // Se não tem operador populado, algo deu errado na auth
      if (!req.operator || !req.operator.id) {
        return res.status(401).json({ error: 'Operador não identificado' });
      }

      // 2. Buscar o usuário e suas permissões no banco
      // O ID que vem do token (req.operator.id) geralmente é o authProviderId (Logto)
      const user = await prismaSumauma.user.findFirst({
        where: { 
          OR: [
            { authProviderId: req.operator.id },
            { id: req.operator.id } // Fallback para login local antigo
          ]
        },
        include: {
          roleRef: {
            include: { 
              permissions: { 
                include: { permission: true } 
              } 
            }
          }
        }
      });

      if (!user || !user.roleRef) {
        return res.status(403).json({ error: 'Acesso negado: Perfil de acesso não configurado ou não encontrado.' });
      }

      // 3. Verificar se a role possui a permissão requerida
      const hasPermission = user.roleRef.permissions.some(rp => rp.permission.slug === requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({ error: `Acesso negado: Permissão '${requiredPermission}' é necessária.` });
      }

      // 4. Injetar dados avançados de acesso no request para uso nas rotas
      req.accessContext = {
        userId: user.id,
        tenantId: user.tenantId,
        orgUnitId: user.orgUnitId,
        roleLevel: user.roleRef.level, // 'PLATFORM' ou 'TENANT'
      };

      next();
    } catch (error) {
      console.error('[Permissions] Erro ao validar acesso:', error);
      res.status(500).json({ error: 'Erro interno de validação de acesso' });
    }
  };
}

module.exports = {
  checkPermission
};
