const { getCache, setCache, LEAD_TTL } = require('../lib/cache');
const logger = require('../lib/logger');

const IACA_URL = process.env.IACA_INTERNAL_URL || 'http://iaca-backend:3001';
const M2M_TOKEN = process.env.M2M_SERVICE_TOKEN;

// --- Circuit Breaker (simples, sem dependência externa) ---
const CIRCUIT_TIMEOUT = 30_000; // 30s antes de tentar novamente
let _circuitOpen = false;
let _circuitOpenAt = 0;

function isCircuitOpen() {
  if (!_circuitOpen) return false;
  if (Date.now() - _circuitOpenAt > CIRCUIT_TIMEOUT) {
    _circuitOpen = false; // Half-open: permite uma tentativa
    return false;
  }
  return true;
}

function tripCircuit(err) {
  if (!_circuitOpen) {
    logger.warn('Circuit breaker aberto para Iaçã', { err: err.message });
    _circuitOpen = true;
    _circuitOpenAt = Date.now();
  }
}

function resetCircuit() {
  if (_circuitOpen) {
    logger.info('Circuit breaker fechado — Iaçã respondeu');
    _circuitOpen = false;
  }
}

// --- Helpers de request ---

function buildHeaders() {
  return { 'Content-Type': 'application/json', 'X-Service-Token': M2M_TOKEN };
}

async function fetchLeadContext(leadId) {
  const cacheKey = `lead:${leadId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (isCircuitOpen()) {
    logger.warn('Circuit aberto — ignorando fetchLeadContext', { leadId });
    return null;
  }

  try {
    const response = await fetch(`${IACA_URL}/internal/leads/${leadId}`, {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(2000)
    });
    if (!response.ok) return null;
    const { data } = await response.json();
    resetCircuit();
    if (data) setCache(cacheKey, data, LEAD_TTL);
    return data;
  } catch (error) {
    tripCircuit(error);
    logger.warn('fetchLeadContext falhou', { leadId, err: error.message });
    return null;
  }
}

async function fetchLeadsBatch(ids) {
  if (!ids.length) return [];

  // Serve do cache o que tiver; busca apenas os que faltam
  const cached = [];
  const missing = [];
  for (const id of ids) {
    const hit = getCache(`lead:${id}`);
    hit ? cached.push(hit) : missing.push(id);
  }

  if (!missing.length) return cached;

  if (isCircuitOpen()) {
    logger.warn('Circuit aberto — retornando leads do cache', { cached: cached.length, total: ids.length });
    return cached;
  }

  try {
    const response = await fetch(`${IACA_URL}/internal/leads/batch`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ ids: missing }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return cached;
    const { data } = await response.json();
    resetCircuit();
    (data || []).forEach(lead => setCache(`lead:${lead.id}`, lead, LEAD_TTL));
    return [...cached, ...(data || [])];
  } catch (error) {
    tripCircuit(error);
    logger.warn('fetchLeadsBatch falhou', { err: error.message });
    return cached;
  }
}

module.exports = { fetchLeadContext, fetchLeadsBatch };
