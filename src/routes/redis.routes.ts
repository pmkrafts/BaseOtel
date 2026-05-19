import { Router } from 'express';
import { getRedisValue, setRedisValue } from '../redis/client.js';

const router = Router();

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

export default router;
