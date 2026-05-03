const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const logger = require('../lib/logger');

// Cliente JWKS do Logto Self-Hosted
// Dev local: http://localhost:3301/oidc/jwks
// Docker interno: http://logto:3001/oidc/jwks
const client = jwksClient({
  jwksUri: process.env.LOGTO_JWKS_URI || 'http://localhost:3301/oidc/jwks',
  cache: true,
  cacheMaxAge: 60 * 60 * 1000, // 1 hora — suporta rotação de chave em emergências
  rateLimit: true,
});

function getKey(header, callback) {
  if (header.kid) {
    client.getSigningKey(header.kid, function(err, key) {
      if (err) return callback(err);
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  } else {
    // Fallback para JWT local
    callback(null, process.env.JWT_SECRET);
  }
}

/**
 * Middleware de autenticação para operadores da plataforma.
 * Exige JWT válido com role = PLATFORM_ADMIN.
 */
function platformAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente' });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(401).json({ error: 'Token inválido' });
      }

      // O Logto injeta roles via array 'roles' ou claim customizada
      const roles = decoded.roles || [];
      const legacyRole = decoded.role || decoded?.customData?.role;

      let isAuthorized =
        legacyRole === 'PLATFORM_ADMIN' ||
        roles.includes('PLATFORM_ADMIN');

      const finalizeAuth = (operatorRole) => {
        req.operator = {
          id: decoded.id || decoded.sub,
          username: decoded.username || decoded.preferred_username || decoded.email,
          role: operatorRole,
        };
        next();
      };

      if (!isAuthorized) {
        // Fallback: verificar a role no banco de dados Master (db_sumauma)
        const prismaSumauma = require('../lib/prismaSumauma');
        const userId = decoded.id || decoded.sub;
        
        prismaSumauma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { authProviderId: userId }
            ]
          },
          select: { role: true }
        }).then(dbUser => {
          if (dbUser && dbUser.role === 'PLATFORM_ADMIN') {
            finalizeAuth('PLATFORM_ADMIN');
          } else {
            logger.warn('Acesso negado — role insuficiente no Token e DB', { sub: userId, dbRole: dbUser?.role });
            return res.status(403).json({
              error: 'Acesso restrito a operadores da plataforma',
            });
          }
        }).catch(err => {
          logger.error('Erro ao verificar role no banco', { err: err.message });
          return res.status(500).json({ error: 'Erro interno na autorização' });
        });
      } else {
        finalizeAuth('PLATFORM_ADMIN');
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao validar token' });
  }
}

module.exports = platformAuth;
