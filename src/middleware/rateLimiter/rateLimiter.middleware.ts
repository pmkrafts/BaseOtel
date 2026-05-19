import { type NextFunction, type Request, type Response } from 'express';
import env from '../../config/env.js';
import { errorLogger } from '../../logging/logger.js';
import { connectRedis, redisClient } from '../../redis/client.js';

const windowSeconds = env.RATE_LIMIT_WINDOW;
const maxRequests = env.RATE_LIMIT_MAX;

const getClientKey = (req: Request): string => {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return req.ip ?? 'unknown';
};

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await connectRedis();

    const clientKey = getClientKey(req);
    const key = `rate_limit:${clientKey}`;

    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    if (count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
      });
      return;
    }

    next();
  } catch (error) {
    errorLogger.error({ err: error }, 'rate_limiter_error');
    next();
  }
};
