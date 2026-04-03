import * as Sentry from '@sentry/node';
import { config } from '../../config';

export function initSentry() {
  if (!config.sentry.dsn) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    sampleRate: config.sentry.sampleRate,
    tracesSampleRate: config.sentry.sampleRate,
  });

  console.log('✅ Sentry initialized');
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (config.sentry.dsn) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  console.error('❌ Error:', error.message, context);
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  if (config.sentry.dsn) {
    Sentry.captureMessage(message, {
      extra: context,
    });
  }
}

export { Sentry };