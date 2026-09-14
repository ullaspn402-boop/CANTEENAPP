import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, ClientRecord>();

// Periodic cleanup of expired records (every 2 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 120000);

export let totalRateLimitEvents = 0;

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please slow down.' } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Identify client by authenticated user ID or fallback to IP / forward header
    const userId = (req as any).currentUser?.id;
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-client';

    const key = userId ? `user:${userId}:${req.baseUrl || req.path}` : `ip:${clientIp}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      totalRateLimitEvents += 1;
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
}

// Pre-configured rate limiters with healthy headroom for polling and reverse proxies
const isDev = process.env.NODE_ENV !== 'production';

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDev ? 300 : 100,
  message: 'Too many authentication attempts. Please wait a minute and try again.',
});

export const orderCreationRateLimiter = createRateLimiter({
  windowMs: 30 * 1000, // 30 seconds
  maxRequests: isDev ? 60 : 20,
  message: 'You are placing orders too quickly. Please wait a moment before trying again.',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDev ? 60 : 30,
  message: 'AI request rate limit reached. Please wait before asking another question.',
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDev ? 1200 : 500,
  message: 'System traffic limit reached. Please slow down your requests.',
});

export const orderTrackingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDev ? 120 : 60,
  message: 'Order tracking query limit reached. Please wait a moment before refreshing.',
});
