import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too many requests, please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit to 5 failed login attempts per hour per IP (strict)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many login attempts, please try again later.',
  },
});
