import express from 'express';
import { requestIdMiddleware } from '../middleware/requestId.middleware.js';
import { requestLoggerMiddleware } from '../middleware/requestLogger.middleware.js';
import { registerRateLimiter } from '../middleware/rateLimiter/index.js';
import healthRouter from '../routes/health.routes.js';
import apiRouter from '../routes/api.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
registerRateLimiter(app);

app.use('/', healthRouter);
app.use('/', apiRouter);

export default app;
