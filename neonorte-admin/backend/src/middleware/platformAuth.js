const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'Acesso restrito a operadores da plataforma',
      });
    }

    req.operator = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = platformAuth;
