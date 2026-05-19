import { type NextFunction, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingRequestId = req.header('x-request-id');
  const requestId = incomingRequestId && incomingRequestId.trim() !== '' ? incomingRequestId : uuidv4();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
