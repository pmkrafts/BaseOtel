import type { Express } from 'express';
import { rateLimiterMiddleware } from './rateLimiter.middleware.js';
import { slidingWindowMiddleware } from './slidingWindow.middleware.js';

export { rateLimiterMiddleware, slidingWindowMiddleware };

export const registerRateLimiter = (app: Express): void => {
  app.use(slidingWindowMiddleware);
};
