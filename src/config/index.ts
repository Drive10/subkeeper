import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
});

export const config = {
  env,
  isProduction: env === 'production',
  isStaging: env === 'staging',
  isDevelopment: env === 'development',
  
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/subscription_manager',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    maxUserRequests: parseInt(process.env.RATE_LIMIT_USER_MAX_REQUESTS || '1000', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@subsense.io',
  },
  
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: env,
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
  },
  
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
  },
};