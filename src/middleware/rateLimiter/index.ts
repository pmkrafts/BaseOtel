import type { Express } from 'express';
import { rateLimiterMiddleware } from './rateLimiter.middleware.js';

export const registerRateLimiter = (app: Express): void => {
  app.use(rateLimiterMiddleware);
};
