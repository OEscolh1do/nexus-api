import { Request, Response, NextFunction } from 'express';

interface ClientState {
  attempts: number;
  violationLevel: number;
  blockExpiresAt: number;
  lastSeen: number;
}

// In-memory storage for rate limiting
// NOTE: In a clustered environment (multiple nodes), this should be replaced by Redis.
const clients = new Map<string, ClientState>();

// Configuration
const MAX_ATTEMPTS = 5;
const PENALTY_LEVELS = [
  30 * 1000,        // Level 1: 30 seconds
  90 * 1000,        // Level 2: 1 minute 30 seconds
  5 * 60 * 1000,    // Level 3: 5 minutes
  15 * 60 * 1000,   // Level 4: 15 minutes
  60 * 60 * 1000,   // Level 5: 1 hour (Cap)
];

// Cleanup interval (evict old IPs to prevent memory leaks)
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const INACTIVE_THRESHOLD = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of clients.entries()) {
    if (now - state.lastSeen > INACTIVE_THRESHOLD) {
      clients.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

export const progressiveAuthLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Use X-Forwarded-For if behind proxy, otherwise fallback to connection remoteAddress
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  
  const now = Date.now();
  
  let state = clients.get(ip);

  if (!state) {
    state = { attempts: 0, violationLevel: 0, blockExpiresAt: 0, lastSeen: now };
    clients.set(ip, state);
  }

  state.lastSeen = now;

  // 1. Check if currently blocked
  if (state.blockExpiresAt > now) {
    const waitSeconds = Math.ceil((state.blockExpiresAt - now) / 1000);
    res.set('Retry-After', String(waitSeconds));
    return res.status(429).json({
      error: `Muitas tentativas. Aguarde ${waitSeconds} segundos.`,
      retryAfter: waitSeconds
    });
  }

  // 2. Increment attempts
  state.attempts++;

  // 3. Check if attempts exceeded limit
  if (state.attempts > MAX_ATTEMPTS) {
    // Determine penalty duration based on violation level
    const penaltyDuration = PENALTY_LEVELS[Math.min(state.violationLevel, PENALTY_LEVELS.length - 1)];
    
    state.blockExpiresAt = now + penaltyDuration;
    state.violationLevel++;
    state.attempts = 0; // Reset attempts for the next cycle (loop logic) 
    
    // Determine wait time for message
    const waitSeconds = Math.ceil(penaltyDuration / 1000);
    
    res.set('Retry-After', String(waitSeconds));
    return res.status(429).json({
      error: `Muitas tentativas. Aguarde ${waitSeconds} segundos.`,
      retryAfter: waitSeconds
    });
  }

  // Reset violation level if user has been well-behaved for a while (e.g. 10 mins without violations)?
  // Optional implementation details. For now, strict progressive.

  next();
};

export const resetClientLimit = (ip: string) => {
    clients.delete(ip);
};
