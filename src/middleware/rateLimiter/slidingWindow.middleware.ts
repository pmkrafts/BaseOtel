import { type NextFunction, type Request, type Response } from 'express';
import env from '../../config/env.js';
import { errorLogger } from '../../logging/logger.js';
import { connectRedis, redisClient } from '../../redis/client.js';

const windowSeconds = env.RATE_LIMIT_WINDOW;
const windowMs = windowSeconds * 1000;
const maxRequests = env.RATE_LIMIT_MAX;

const getClientKey = (req: Request): string => {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return req.ip ?? 'unknown';
};

export const slidingWindowMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await connectRedis();

    const clientKey = getClientKey(req);
    const key = `rate_limit:${clientKey}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // 1. Remove expired timestamps outside the sliding window
    await redisClient.zremrangebyscore(key, '-inf', windowStart);

    // 2. Count active requests within the current window
    const count = await redisClient.zcount(key, windowStart, '+inf');

    // 3. Allow or block
    if (count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
      });
      return;
    }

    // 4. Insert current timestamp as score and member
    await redisClient.zadd(key, now, `${now}-${Math.random()}`);

    // Expire full key after window so stale keys clean up
    await redisClient.expire(key, windowSeconds * 2);

    next();
  } catch (error) {
    errorLogger.error({ err: error }, 'sliding_window_limiter_error');
    next();
  }
};
