import 'dotenv/config';
import app from './app.js';
import { errorLogger, logger } from '../logging/logger.js';
import { closeRedis } from '../redis/client.js';

const PORT = process.env['PORT'] ?? '4000';

const server = app.listen(Number(PORT), () => {
  logger.info({ port: Number(PORT) }, `server_started http://localhost:${PORT}`);
});

const shutdown = () => {
  server.close(async () => {
    await closeRedis();
    logger.info('server_stopped');
    process.exit(0);
  });
};

server.on('error', (error) => {
  errorLogger.error({ err: error }, 'server_error');
  process.exit(1);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
