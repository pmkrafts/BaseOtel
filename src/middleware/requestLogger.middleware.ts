import { type NextFunction, type Request, type Response } from 'express';
import { logger, metricsLogger, traceLogger } from '../logging/logger.js';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;
    const payload = {
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration: Number(durationMs.toFixed(2)),
      requestId: req.requestId ?? res.getHeader('x-request-id'),
    };

    logger.info(payload, 'http_request');
    metricsLogger.info(payload, 'request_metrics');
    traceLogger.info(payload, 'request_trace');
  });

  next();
};
