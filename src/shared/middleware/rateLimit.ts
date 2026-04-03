import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { getRedisClient } from '../utils/redis';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api-docs',
});

export const userLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxUserRequests,
  keyGenerator: (req) => (req as any).user?.id || req.ip,
  message: { error: 'Too many requests for this user', code: 'USER_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !(req as any).user,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later', code: 'AUTH_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many sensitive operations', code: 'SENSITIVE_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function checkRateLimit(userId: string, action: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${userId}:${action}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 3600);
    }
    
    return current <= 100;
  } catch {
    return true;
  }
}