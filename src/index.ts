import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { connectDatabase, disconnectDatabase } from './shared/utils/database';
import { connectRedis, disconnectRedis } from './shared/utils/redis';
import { AppError } from './shared/errors';

import authRoutes from './modules/auth/routes';
import subscriptionRoutes from './modules/subscription/routes';
import reminderRoutes from './modules/reminder/routes';
import billingRoutes from './modules/billing/routes';
import detectionRoutes from './modules/detection/routes';
import analyticsRoutes from './modules/analytics/routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/payments', billingRoutes);
app.use('/api/detect', detectionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
});

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully...');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export default app;