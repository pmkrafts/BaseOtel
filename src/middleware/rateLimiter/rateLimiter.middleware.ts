import { type NextFunction, type Request, type Response } from 'express';

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, RateLimitBucket>();

const windowSeconds = Number(process.env['RATE_LIMIT_WINDOW'] ?? '10');
const maxRequests = Number(process.env['RATE_LIMIT_MAX'] ?? '5');
const windowMs = windowSeconds * 1000;

const getClientKey = (req: Request): string => {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return req.ip ?? 'unknown';
};

const pruneBuckets = (): void => {
  const now = Date.now();

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > windowMs) {
      buckets.delete(key);
    }
  }
};

setInterval(pruneBuckets, Math.max(windowMs, 1000)).unref();

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = getClientKey(req);

  const currentBucket = buckets.get(key);

  if (!currentBucket || now - currentBucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    next();
    return;
  }

  currentBucket.count += 1;

  if (currentBucket.count > maxRequests) {
    res.status(429).json({
      error: 'Too many requests',
    });
    return;
  }

  next();
};
