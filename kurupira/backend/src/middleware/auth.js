const { createPublicKey } = require('crypto');
const jwt = require('jsonwebtoken');

// JWKS cache para verificação de tokens Logto (RS256)
const _jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL = 60 * 60 * 1000; // 1 hora

async function fetchJwksKeys() {
  const uri = process.env.LOGTO_JWKS_URI;
  if (!uri) return null;
  try {
    const res = await fetch(uri, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const { keys } = await res.json();
    return keys || null;
  } catch {
    return null;
  }
}

async function getPublicKeyForKid(kid) {
  const now = Date.now();
  if (!_jwksCache.keys || now - _jwksCache.fetchedAt > JWKS_TTL) {
    const keys = await fetchJwksKeys();
    if (keys) { _jwksCache.keys = keys; _jwksCache.fetchedAt = now; }
  }
  if (!_jwksCache.keys) return null;
  const jwk = _jwksCache.keys.find(k => k.kid === kid);
  return jwk ? createPublicKey({ key: jwk, format: 'jwk' }) : null;
}

// Tenta verificar como RS256 (Logto) e, se não houver JWKS configurado,
// cai para HS256 (JWT_SECRET local — útil em dev sem Logto).
async function verifyToken(token) {
  const header = jwt.decode(token, { complete: true })?.header;

  // Caminho RS256: Logto
  if (header?.alg === 'RS256' && header?.kid) {
    const publicKey = await getPublicKeyForKid(header.kid);
    if (!publicKey) throw new Error('JWKS key não encontrada para kid=' + header.kid);
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  }

  // Caminho HS256: JWT local (dev / testes com JWT_SECRET)
  if (process.env.JWT_SECRET) {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  }

  throw new Error('Nenhum método de verificação disponível para o token recebido');
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.cookies?.nexus_session) {
    token = req.cookies.nexus_session;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = await verifyToken(token);
    const tenantId = decoded.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Token inválido: tenantId ausente' });
    }
    req.user = { ...decoded, id: decoded.id || decoded.sub, tenantId };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
};

module.exports = { authenticateToken };
