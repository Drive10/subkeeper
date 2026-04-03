import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime?: number;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  res.send = function (body) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const log = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    if (res.statusCode >= 500) {
      console.error('❌', JSON.stringify(log));
    } else if (res.statusCode >= 400) {
      console.warn('⚠️', JSON.stringify(log));
    } else {
      console.log('✅', JSON.stringify(log));
    }
    
    return originalSend.call(this, body);
  };
  next();
}