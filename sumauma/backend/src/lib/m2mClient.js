const axios = require('axios');
const { randomUUID } = require('crypto');
const logger = require('./logger');

/**
 * Clientes HTTP M2M para comunicação interna com os serviços irmãos.
 * Usados exclusivamente para operações de ESCRITA (mutações).
 *
 * Auth: OAuth2 Client Credentials (Logto M2M) via Authorization: Bearer.
 * Fallback: X-Service-Token (legado — remover após migração confirmada).
 *
 * Leituras são feitas diretamente via Prisma read-only.
 */

// --- Token manager (OAuth2 Client Credentials) ---

const _tokenCache = { token: null, expiresAt: 0 };

async function fetchM2MToken() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;
  const resource = process.env.LOGTO_M2M_RESOURCE;

  if (!endpoint || !clientId || !clientSecret || !resource) return null;

  const scope = process.env.LOGTO_M2M_SCOPE || 'kurupira:catalog:read kurupira:catalog:write kurupira:catalog:delete';

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    resource,
    scope,
  });

  const res = await fetch(`${endpoint}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`Logto token fetch failed: ${res.status}`);
  const { access_token, expires_in } = await res.json();
  return { token: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
}

async function getM2MToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }
  try {
    const result = await fetchM2MToken();
    if (result) {
      _tokenCache.token = result.token;
      _tokenCache.expiresAt = result.expiresAt;
      return _tokenCache.token;
    }
  } catch (err) {
    logger.error('Falha ao buscar token Logto M2M', { err: err.message });
  }
  // Legacy fallback — will trigger deprecation warning on kurupira side
  return null;
}

// --- Axios interceptors ---

function attachInterceptors(client, serviceName) {
  client.interceptors.request.use(async (config) => {
    // Inject OAuth2 token if available, otherwise fall back to shared secret
    const token = await getM2MToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      delete config.headers['X-Service-Token'];
    } else if (process.env.M2M_SERVICE_TOKEN) {
      config.headers['X-Service-Token'] = process.env.M2M_SERVICE_TOKEN;
    }

    // Propagate or generate X-Correlation-ID
    const correlationId = config.headers['X-Correlation-ID'] || randomUUID();
    config.headers['X-Correlation-ID'] = correlationId;

    logger.info(`M2M → ${serviceName}`, { method: config.method?.toUpperCase(), url: config.url, cid: correlationId });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const cid = response.config.headers?.['X-Correlation-ID'] || '-';
      logger.info(`M2M ← ${serviceName}`, { status: response.status, cid });
      return response;
    },
    (error) => {
      const status = error.response?.status || 'NETWORK_ERROR';
      const message = error.response?.data?.error || error.message;
      const cid = error.config?.headers?.['X-Correlation-ID'] || '-';
      logger.error(`M2M ← ${serviceName} erro`, { status, message, cid });
      return Promise.reject(error);
    }
  );
}

const iacaClient = axios.create({
  baseURL: process.env.IACA_INTERNAL_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const kurupiraClient = axios.create({
  baseURL: process.env.KURUPIRA_INTERNAL_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

attachInterceptors(iacaClient, 'Iaçã');
attachInterceptors(kurupiraClient, 'Kurupira');

module.exports = { iacaClient, kurupiraClient };
