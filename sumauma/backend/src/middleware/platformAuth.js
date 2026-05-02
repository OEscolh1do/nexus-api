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

      // O Logto injeta role via JWT Claims customizados (configurado no Console)
      // Fallback para PLATFORM_ADMIN para o setup inicial
      const role = decoded.role || decoded?.customData?.role;
      if (role !== 'PLATFORM_ADMIN') {
        return res.status(403).json({
          error: 'Acesso restrito a operadores da plataforma',
        });
      }

      req.operator = {
        id: decoded.id || decoded.sub,
        username: decoded.username || decoded.preferred_username,
        role: decoded.role,
      };

      next();
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao validar token' });
  }
}

module.exports = platformAuth;
