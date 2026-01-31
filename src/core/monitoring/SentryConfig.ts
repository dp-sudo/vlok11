import * as Sentry from '@sentry/react';

import { createLogger } from '@/core/Logger';

export interface SentryConfig {
  dsn?: string;
  enabled: boolean;
  environment?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
}

export interface ErrorReport {
  context?: Record<string, unknown>;
  error: Error;
  level?: 'fatal' | 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  user?: {
    email?: string;
    id?: string;
    username?: string;
  };
}

class SentryIntegration {
  private static instance: SentryIntegration | null = null;
  private config: SentryConfig = {
    enabled: false,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
  };
  private isInitialized = false;
  private logger = createLogger({ module: 'Sentry' });

  private constructor() {}

  static getInstance(): SentryIntegration {
    SentryIntegration.instance ??= new SentryIntegration();

    return SentryIntegration.instance;
  }

  static resetInstance(): void {
    SentryIntegration.instance = null;
  }

  addBreadcrumb(breadcrumb: {
    category?: string;
    data?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    message: string;
  }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level,
        data: breadcrumb.data,
      });
      this.logger.debug('Breadcrumb added', breadcrumb);
    } catch (error) {
      this.logger.error('Failed to add breadcrumb', { error });
    }
  }

  captureError(report: ErrorReport): string | null {
    if (!this.isInitialized || !this.config.enabled) {
      this.logger.debug('Sentry not initialized, skipping error report');

      return null;
    }

    try {
      Sentry.withScope((scope) => {
        if (report.level) {
          scope.setLevel(report.level);
        }

        if (report.tags) {
          Object.entries(report.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (report.context) {
          scope.setContext('additional', report.context);
        }

        if (report.user) {
          scope.setUser(report.user);
        }
      });

      const eventId = Sentry.captureException(report.error);

      this.logger.info('Error captured', {
        eventId,
        error: report.error.message,
        level: report.level ?? 'error',
      });

      return eventId;
    } catch (error) {
      this.logger.error('Failed to capture error', { error });

      return null;
    }
  }

  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' = 'info'
  ): string | null {
    if (!this.isInitialized || !this.config.enabled) {
      return null;
    }

    try {
      const eventId = Sentry.captureMessage(message, level);

      this.logger.info('Message captured', { eventId, message, level });

      return eventId;
    } catch (error) {
      this.logger.error('Failed to capture message', { error });

      return null;
    }
  }

  getConfig(): SentryConfig {
    return { ...this.config };
  }

  async initialize(config: SentryConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Sentry already initialized');

      return;
    }

    this.config = { ...this.config, ...config };

    if (!this.config.enabled) {
      this.logger.info('Sentry disabled');

      return;
    }

    if (!this.config.dsn) {
      this.logger.warn('Sentry DSN not provided, error tracking disabled');

      return;
    }

    try {
      this.logger.info('Initializing Sentry', {
        environment: this.config.environment,
      });

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });

      this.isInitialized = true;
      this.logger.info('Sentry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', { error });
    }
  }

  isEnabled(): boolean {
    return this.isInitialized && this.config.enabled;
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setContext(name, context);
      this.logger.debug('Context set', { name, context });
    } catch (error) {
      this.logger.error('Failed to set context', { error });
    }
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
      this.logger.debug('Tag set', { key, value });
    } catch (error) {
      this.logger.error('Failed to set tag', { error });
    }
  }

  setUser(user: { email?: string; id?: string; username?: string } | null): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(user);
      this.logger.info('User context set', { userId: user?.id });
    } catch (error) {
      this.logger.error('Failed to set user context', { error });
    }
  }
}

export const getSentry = (): SentryIntegration => SentryIntegration.getInstance();
export const resetSentry = (): void => SentryIntegration.resetInstance();

export const SentryErrorBoundary = Sentry.ErrorBoundary;
