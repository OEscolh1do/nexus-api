const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Cliente JWKS do Logto Self-Hosted
// Dev local: http://localhost:3301/oidc/jwks
// Docker interno: http://logto:3001/oidc/jwks
const client = jwksClient({
  jwksUri: process.env.LOGTO_JWKS_URI || 'http://localhost:3301/oidc/jwks',
  cache: true,
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

      const isAuthorized =
        legacyRole === 'PLATFORM_ADMIN' ||
        roles.includes('PLATFORM_ADMIN');

      if (!isAuthorized) {
        console.warn(`[Auth] Acesso negado para ${decoded.sub}. Roles:`, roles);
        return res.status(403).json({
          error: 'Acesso restrito a operadores da plataforma',
        });
      }

      req.operator = {
        id: decoded.id || decoded.sub,
        username: decoded.username || decoded.preferred_username || decoded.email,
        role: legacyRole || (roles.includes('PLATFORM_ADMIN') ? 'PLATFORM_ADMIN' : 'GUEST'),
      };

      next();
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao validar token' });
  }
}

module.exports = platformAuth;
