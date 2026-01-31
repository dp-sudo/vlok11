import { getSentry } from './SentryConfig';

export async function initializeSentry(): Promise<void> {
  const sentry = getSentry();

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const environment = import.meta.env.MODE;

  await sentry.initialize({
    dsn,
    environment,
    enabled: import.meta.env.PROD && !!dsn,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
  });
}

export function reportError(error: Error, context?: Record<string, unknown>): void {
  const sentry = getSentry();

  if (sentry.isEnabled()) {
    sentry.captureError({
      error,
      context,
      level: 'error',
    });
  }
}

export function reportWarning(message: string): void {
  const sentry = getSentry();

  if (sentry.isEnabled()) {
    sentry.captureMessage(message, 'warning');
  }
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  const sentry = getSentry();

  if (sentry.isEnabled()) {
    sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }
}
