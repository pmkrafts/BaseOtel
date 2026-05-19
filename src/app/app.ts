import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from '../middleware/requestId.middleware.js';
import { requestLoggerMiddleware } from '../middleware/requestLogger.middleware.js';
import { registerRateLimiter } from '../middleware/rateLimiter/index.js';
import healthRouter from '../routes/health.routes.js';
import apiRouter from '../routes/api.routes.js';
import redisRouter from '../routes/redis.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
registerRateLimiter(app);

app.use('/', healthRouter);
app.use('/', apiRouter);
app.use('/', redisRouter);

export default app;
