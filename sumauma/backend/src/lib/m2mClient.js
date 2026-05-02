const axios = require('axios');

/**
 * Clientes HTTP M2M para comunicação interna com os serviços irmãos.
 * Usados exclusivamente para operações de ESCRITA (mutações).
 * 
 * Leituras são feitas diretamente via Prisma read-only.
 */

const iacaClient = axios.create({
  baseURL: process.env.IACA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const kurupiraClient = axios.create({
  baseURL: process.env.KURUPIRA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Maior para operações pesadas (parsing .pan/.ond)
});

// Interceptor de logging para debug
const logRequest = (client, serviceName) => {
  client.interceptors.request.use((config) => {
    console.log(`[M2M → ${serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      console.log(`[M2M ← ${serviceName}] ${response.status} OK`);
      return response;
    },
    (error) => {
      const status = error.response?.status || 'NETWORK_ERROR';
      const message = error.response?.data?.error || error.message;
      console.error(`[M2M ← ${serviceName}] ${status}: ${message}`);
      return Promise.reject(error);
    }
  );
};

logRequest(iacaClient, 'Iaçã');
logRequest(kurupiraClient, 'Kurupira');

module.exports = { iacaClient, kurupiraClient };
