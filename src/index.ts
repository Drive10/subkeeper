import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './config';
import { logger } from './shared/utils/logger';
import { connectDatabase, disconnectDatabase, prisma } from './shared/utils/database';
import { connectRedis, disconnectRedis, getRedisClient } from './shared/utils/redis';
import { AppError } from './shared/errors';
import { swaggerSpec } from './config/swagger';
import { initSentry, captureException } from './shared/utils/sentry';
import { initEmailService } from './shared/utils/email';
import { requestIdMiddleware, requestLogger } from './shared/middleware/requestLogger';
import { globalLimiter, authLimiter } from './shared/middleware/rateLimit';

import authRoutes from './modules/auth/routes';
import subscriptionRoutes from './modules/subscription/routes';
import reminderRoutes from './modules/reminder/routes';
import billingRoutes from './modules/billing/routes';
import detectionRoutes from './modules/detection/routes';
import analyticsRoutes from './modules/analytics/routes';

initSentry();

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
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

app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', globalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SubSense API Documentation',
  customfavIcon: '/favicon.ico',
}));

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.api.version,
    environment: config.env,
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
    health.services.websocket = io.sockets.sockets.size > 0 ? 'healthy' : 'healthy';
  } catch {
    health.services.websocket = 'unhealthy';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/', (_req, res) => {
  res.redirect('/api-docs');
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/payments', billingRoutes);
app.use('/api/detect', detectionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[${_req.id}] Error:`, err);

  captureException(err, {
    requestId: _req.id,
    path: _req.path,
    method: _req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        requestId: _req.id,
      },
    });
  }

  res.status(500).json({
    error: {
      message: config.isProduction ? 'Internal server error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      requestId: _req.id,
    },
  });
});

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();
    await initEmailService();

    httpServer.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════╗
║  🚀 SubSense Server Running                        ║
║  ───────────────────────────────────────────────  ║
║  Environment: ${config.env.padEnd(30)}║
║  Port: ${config.port.toString().padEnd(30)}║
║  API: http://localhost:${config.port}${config.api.prefix}/${config.api.version}     ║
║  Docs: http://localhost:${config.port}/api-docs              ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    captureException(error as Error, { context: 'startServer' });
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