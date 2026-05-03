const { createPublicKey } = require('crypto');
const jwt = require('jsonwebtoken');
const prismaSumauma = require('../lib/prismaSumauma');
const logger = require('../lib/logger');

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

  // Caminho Logto (JWKS: RS256, ES384, etc)
  if (header?.kid) {
    const publicKey = await getPublicKeyForKid(header.kid);
    if (!publicKey) throw new Error('JWKS key não encontrada para kid=' + header.kid);
    return jwt.verify(token, publicKey, { algorithms: ['RS256', 'ES384', 'ES256'] });
  }

  throw new Error(`Método de verificação inválido para o token (alg: ${header?.alg}). Apenas tokens do provedor de identidade (Logto) são permitidos em produção.`);
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
    
    // Fallback: Se o token for local (gerado para dev) e já contiver tenantId, usa direto.
    // Mas se for Logto, precisamos resolver o sub no db_sumauma.
    const sub = decoded.sub || decoded.id;
    
    if (!sub) {
      return res.status(401).json({ success: false, error: 'Token inválido: subject ausente' });
    }

    // Busca o usuário na base do Sumaúma (Fundação) usando o authProviderId (Logto) ou ID local
    const dbUser = await prismaSumauma.user.findFirst({
      where: {
        OR: [
          { authProviderId: sub },
          { id: sub } // Suporte a JWT local
        ]
      },
      include: {
        tenant: true
      }
    });

    if (!dbUser) {
      logger.warn('[Auth] Acesso bloqueado: Usuário Logto autenticado, mas não possui registro no banco de dados (Sumaúma).', { sub });
      return res.status(403).json({ success: false, error: 'Acesso negado: Seu usuário ainda não foi provisionado no sistema.' });
    }

    if (dbUser.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Usuário bloqueado ou inativo.' });
    }

    if (dbUser.tenant?.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Organização bloqueada ou inativa.' });
    }

    // Injeta os dados ricos do banco no request
    req.user = {
      ...decoded,
      id: dbUser.id,
      tenantId: dbUser.tenantId,
      role: dbUser.role,
      fullName: dbUser.fullName,
      tenantPlan: dbUser.tenant?.apiPlan
    };

    next();
  } catch (err) {
    logger.error('[Auth] Token verification failed', { error: err.message });
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
};

module.exports = { authenticateToken };
