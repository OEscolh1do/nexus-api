const CATALOG_TTL = 5 * 60 * 1000;
const LEAD_TTL = 2 * 60 * 1000;
const MAX_ENTRIES = 500;

const _cache = new Map();

function _evictExpiredOrOldest() {
  const now = Date.now();
  for (const [k, v] of _cache) {
    if (now > v.exp) _cache.delete(k);
  }
  // Se ainda acima do limite, remove a entrada mais antiga (primeira inserida)
  if (_cache.size >= MAX_ENTRIES) {
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
}

function getCache(key) {
  const entry = _cache.get(key);
  if (!entry || Date.now() > entry.exp) { _cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttl = CATALOG_TTL) {
  if (_cache.size >= MAX_ENTRIES) _evictExpiredOrOldest();
  _cache.set(key, { data, exp: Date.now() + ttl });
}

function invalidateCache(prefix) {
  for (const k of _cache.keys()) { if (k.startsWith(prefix)) _cache.delete(k); }
}

module.exports = { getCache, setCache, invalidateCache, CATALOG_TTL, LEAD_TTL };
