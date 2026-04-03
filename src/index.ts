import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { connectDatabase, disconnectDatabase, prisma } from './shared/utils/database';
import { connectRedis, disconnectRedis, getRedisClient } from './shared/utils/redis';
import { AppError } from './shared/errors';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/routes';
import subscriptionRoutes from './modules/subscription/routes';
import reminderRoutes from './modules/reminder/routes';
import billingRoutes from './modules/billing/routes';
import detectionRoutes from './modules/detection/routes';
import analyticsRoutes from './modules/analytics/routes';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`Socket ${socket.id} subscribed to user:${userId}`);
  });

  socket.on('unsubscribe', (userId: string) => {
    socket.leave(`user:${userId}`);
    logger.info(`Socket ${socket.id} unsubscribed from user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

export function emitNotification(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
  logger.info(`Emitted ${event} to user:${userId}`);
}

export { io };

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SubSense API Documentation',
  customfavIcon: '/favicon.ico',
}));

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      websocket: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    health.services.redis = 'healthy';
  } catch {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    if (io.sockets.sockets.size > 0) {
      health.services.websocket = 'healthy';
    } else {
      health.services.websocket = 'healthy';
    }
  } catch {
    health.services.websocket = 'unhealthy';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/', (_req, res) => {
  res.redirect('/api-docs');
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

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📚 API docs available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully...');
  io.close();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export default app;