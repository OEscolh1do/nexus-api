const axios = require('axios');
const logger = require('./logger');

/**
 * Cliente M2M para a Management API do Logto Self-Hosted.
 * Logto usa Client Credentials Grant para M2M.
 * O token é cacheado localmente e renovado antes do vencimento.
 */

let _cachedToken = null;
let _tokenExpiry = 0;

async function getM2MToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const endpoint = process.env.LOGTO_ENDPOINT || 'http://localhost:3301';
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('[Logto] LOGTO_M2M_CLIENT_ID e LOGTO_M2M_CLIENT_SECRET são obrigatórios.');
  }

  const response = await axios.post(
    `${endpoint}/oidc/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'all',
      resource: `${endpoint}/api`,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _cachedToken = response.data.access_token;
  // Expira 60s antes do vencimento real para evitar uso de token expirado
  _tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return _cachedToken;
}

async function logtoRequest(method, path, data) {
  const endpoint = process.env.LOGTO_ENDPOINT || 'http://localhost:3301';
  const token = await getM2MToken();
  return axios({
    method,
    url: `${endpoint}/api${path}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  });
}

/**
 * Cria uma Organização no Logto (equivalente ao Tenant).
 * @param {string} name - Nome da organização
 * @returns {Promise<string>} ID da organização criada
 */
async function createLogtoOrg(name) {
  try {
    const res = await logtoRequest('post', '/organizations', {
      name: name.trim(),
      description: `Organização Ywara: ${name.trim()}`,
    });
    logger.info('Logto org criada', { id: res.data.id, name });
    return res.data.id;
  } catch (error) {
    logger.error('Logto createOrg falhou', { err: error.response?.data || error.message });
    throw new Error('Falha na integração com Logto (createOrg)');
  }
}

/**
 * Cria um usuário no Logto.
 * @param {string} tenantId - ID do tenant (salvo em customData)
 * @param {object} userObj - Dados do usuário
 * @returns {Promise<string>} ID do usuário criado no Logto
 */
async function createLogtoUser(tenantId, userObj) {
  try {
    const res = await logtoRequest('post', '/users', {
      primaryEmail: userObj.email || `${userObj.username}@neonorte.local`,
      username: userObj.username,
      password: userObj.password,
      name: `${userObj.firstName} ${userObj.lastName}`.trim(),
      customData: {
        tenantId,
        role: 'USER',
      },
    });
    logger.info('Logto user criado', { id: res.data.id, username: userObj.username });
    return res.data.id;
  } catch (error) {
    logger.error('Logto createUser falhou', { err: error.response?.data || error.message });
    throw new Error('Falha na integração com Logto (createUser)');
  }
}

/**
 * Exclui uma Organização no Logto.
 * @param {string} orgId - ID da organização no Logto
 */
async function deleteLogtoOrg(orgId) {
  try {
    await logtoRequest('delete', `/organizations/${orgId}`);
    logger.info('Logto org excluída', { orgId });
  } catch (error) {
    logger.error('Logto deleteOrg falhou', { orgId, err: error.response?.data || error.message });
  }
}

/**
 * Exclui um usuário no Logto.
 * @param {string} logtoUserId - ID do usuário no Logto
 */
async function deleteLogtoUser(logtoUserId) {
  try {
    await logtoRequest('delete', `/users/${logtoUserId}`);
    logger.info('Logto user excluído', { logtoUserId });
  } catch (error) {
    logger.error('Logto deleteUser falhou', { logtoUserId, err: error.response?.data || error.message });
  }
}

module.exports = { createLogtoOrg, createLogtoUser, deleteLogtoOrg, deleteLogtoUser };
