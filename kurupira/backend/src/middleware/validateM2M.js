const { createPublicKey } = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');

// JWKS cache — refreshed every hour
const jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL = 60 * 60 * 1000;

async function fetchJwks() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  if (!endpoint) return null;
  try {
    const res = await fetch(`${endpoint}/oidc/jwks`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const { keys } = await res.json();
    return keys || null;
  } catch {
    return null;
  }
}

async function getPublicKey(kid) {
  const now = Date.now();
  if (!jwksCache.keys || now - jwksCache.fetchedAt > JWKS_TTL) {
    const keys = await fetchJwks();
    if (keys) { jwksCache.keys = keys; jwksCache.fetchedAt = now; }
  }
  if (!jwksCache.keys) return null;
  const jwk = jwksCache.keys.find(k => k.kid === kid);
  if (!jwk) return null;
  return createPublicKey({ key: jwk, format: 'jwk' });
}

async function verifyLogtoToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header?.kid) throw new Error('Token missing kid header');

  const publicKey = await getPublicKey(decoded.header.kid);
  if (!publicKey) throw new Error(`Public key not found for kid: ${decoded.header.kid}`);

  const payload = decoded.payload;
  const header = decoded.header;
  const receivedIssuer = payload.iss;
  const expectedIssuer = `${process.env.LOGTO_ENDPOINT}/oidc`;
  const fallbackIssuer = process.env.LOGTO_ENDPOINT;
  const audience = process.env.LOGTO_M2M_RESOURCE;

  try {
    const validIssuers = [expectedIssuer, fallbackIssuer];
    const issuer = validIssuers.includes(receivedIssuer) ? receivedIssuer : expectedIssuer;

    jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'ES384'],
      issuer,
      audience,
    });
  } catch (err) {
    logger.error('M2M JWT Verification failed', {
      name: err.name,
      message: err.message,
      issuer: receivedIssuer,
      audience
    });
    throw new Error(`Invalid M2M token: ${err.message}`);
  }
}

// Legacy shared-secret fallback — accepted during migration window
function verifyLegacyToken(req) {
  const legacy = req.headers['x-service-token'];
  if (!legacy || !process.env.M2M_SERVICE_TOKEN) return false;
  if (legacy !== process.env.M2M_SERVICE_TOKEN) return false;
  logger.warn('Deprecated X-Service-Token used — migrate to Logto M2M OAuth2');
  return true;
}

const validateM2M = async (req, res, next) => {
  // Prefer OAuth2 Bearer token (new path)
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      await verifyLogtoToken(token);
      return next();
    } catch (err) {
      return res.status(401).json({ 
        error: 'Invalid M2M token',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
  }

  // Legacy fallback (migration window)
  if (verifyLegacyToken(req)) return next();

  return res.status(401).json({ error: 'Missing M2M credentials' });
};

module.exports = validateM2M;
