import { Redis } from 'ioredis';
import env from '../config/env.js';
import { errorLogger, logger } from '../logging/logger.js';

const redisClient = new Redis({
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
	lazyConnect: true,
	maxRetriesPerRequest: 3,
	enableReadyCheck: true,
	retryStrategy: (times: number) => {
		const delay = Math.min(times * 200, 2000);
		logger.warn({ attempt: times, delay }, 'redis_retry');
		return delay;
	},
	reconnectOnError: (error: Error) => {
		const msg = error.message.toLowerCase();
		if (msg.includes('read only') || msg.includes('etimedout') || msg.includes('econnreset')) {
			errorLogger.warn({ err: error }, 'redis_reconnect_on_error');
			return true;
		}
		return false;
	},
});

redisClient.on('connect', () => {
	logger.info('redis_connecting');
});

redisClient.on('ready', () => {
	logger.info('redis_ready');
});

redisClient.on('error', (error: unknown) => {
	errorLogger.error({ err: error }, 'redis_error');
});

redisClient.on('close', () => {
	logger.warn('redis_connection_closed');
});

redisClient.on('reconnecting', () => {
	logger.warn('redis_reconnecting');
});

export const connectRedis = async (): Promise<void> => {
	if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
		return;
	}

	await redisClient.connect();
};

export const closeRedis = async (): Promise<void> => {
	if (redisClient.status === 'end') {
		return;
	}

	try {
		await redisClient.quit();
		logger.info('redis_quit_success');
	} catch (error) {
		errorLogger.warn({ err: error }, 'redis_quit_failed_forcing_disconnect');
		redisClient.disconnect();
	}
};

export const setRedisValue = async (key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> => {
	await connectRedis();

	if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
		return redisClient.set(key, value, 'EX', ttlSeconds);
	}

	return redisClient.set(key, value);
};

export const getRedisValue = async (key: string): Promise<string | null> => {
	await connectRedis();
	return redisClient.get(key);
};

export { redisClient };

