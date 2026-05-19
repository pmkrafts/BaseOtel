import { Router, type Request } from 'express';
import { getRedisValue, setRedisValue, redisClient } from '../redis/client.js';

const router = Router();

const getClientKey = (req: Request): string => {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }
  return req.ip ?? 'unknown';
};

router.get('/redis-flow', async (_req, res) => {
  try {
    const key = `example:flow:${Date.now()}`;
    const value = 'hello-from-redis-flow';
    const ttlSeconds = 60;

    const setResult = await setRedisValue(key, value, ttlSeconds);
    const getResult = await getRedisValue(key);

    res.status(200).json({
      status: 'ok',
      flow: [
        `SET ${key} ${value} EX ${ttlSeconds}`,
        `GET ${key}`,
      ],
      result: {
        set: setResult,
        get: getResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Redis flow example failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
  }
});

router.get('/redis-test', async (_req, res) => {
  try {
    const key = `redis:test:${Date.now()}`;
    const value = 'pong';

    await setRedisValue(key, value, 30);
    const fetched = await getRedisValue(key);

    res.status(200).json({
      status: 'ok',
      operation: {
        set: { key, value, ttlSeconds: 30 },
        get: { key, value: fetched },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Redis SET/GET failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
  }
});

router.get('/rate-limit-debug', async (req, res) => {
  try {
    const clientKey = getClientKey(req);
    const key = `rate_limit:${clientKey}`;
    const now = Date.now();

    const members = await redisClient.zrange(key, 0, -1, 'WITHSCORES');
    const count = await redisClient.zcard(key);
    const ttl = await redisClient.ttl(key);

    res.status(200).json({
      status: 'ok',
      clientKey,
      key,
      now,
      rateLimit: {
        count,
        ttl,
        members: members.reduce((acc: Record<string, number>, val, idx) => {
          if (idx % 2 === 0) acc[val] = parseInt(members[idx + 1] as string);
          return acc;
        }, {}),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Rate limit debug failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    });
  }
});

export default router;
