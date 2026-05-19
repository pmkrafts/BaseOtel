import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import env from '../config/env.js';

const logDir = path.resolve('storage/logs');
fs.mkdirSync(logDir, { recursive: true });

const isProduction = env.NODE_ENV === 'production';

const appTransport = pino.transport({
	targets: [
		{
			level: env.LOG_LEVEL,
			target: 'pino/file',
			options: { destination: path.join(logDir, 'app.log'), mkdir: true },
		},
		...(!isProduction
			? [
					{
						level: env.LOG_LEVEL,
						target: 'pino-pretty',
						options: {
							colorize: true,
							translateTime: 'SYS:standard',
							singleLine: true,
						},
					},
				]
			: []),
	],
});

const errorTransport = pino.transport({
	targets: [
		{
			level: 'error',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'error.log'), mkdir: true },
		},
	],
});

const metricsTransport = pino.transport({
	targets: [
		{
			level: 'info',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'metrics.log'), mkdir: true },
		},
	],
});

const traceTransport = pino.transport({
	targets: [
		{
			level: 'info',
			target: 'pino/file',
			options: { destination: path.join(logDir, 'trace.log'), mkdir: true },
		},
	],
});

export const logger = pino({ level: env.LOG_LEVEL, base: null }, appTransport);
export const errorLogger = pino({ level: 'error', base: null }, errorTransport);
export const metricsLogger = pino({ level: 'info', base: null }, metricsTransport);
export const traceLogger = pino({ level: 'info', base: null }, traceTransport);

