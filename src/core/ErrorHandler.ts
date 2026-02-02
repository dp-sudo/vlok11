import { MAX_ERROR_HISTORY } from '@/shared/constants';

import { type ErrorCode, ErrorCodes, getErrorMessage } from './ErrorCodes';
import { getEventBus } from './EventBus';

export class ErrorHandler implements ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private fatalCallbacks = new Set<(error: AppError) => void>();
  private history: AppError[] = [];
  private maxHistory = MAX_ERROR_HISTORY;

  static getInstance(): ErrorHandler {
    ErrorHandler.instance ??= new ErrorHandler();

    return ErrorHandler.instance;
  }

  static resetInstance(): void {
    if (ErrorHandler.instance) {
      ErrorHandler.instance.history = [];
      ErrorHandler.instance.fatalCallbacks.clear();
    }
    ErrorHandler.instance = null;
  }

  private categorizeSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('fatal') || message.includes('critical')) {
      return ErrorSeverity.FATAL;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.WARNING;
    }
    if (message.includes('info') || message.includes('notice')) {
      return ErrorSeverity.INFO;
    }

    return ErrorSeverity.ERROR;
  }

  clearHistory(): void {
    this.history = [];
  }

  createCodedError(code: ErrorCode, context: string, originalError?: Error): AppError {
    return this.createError(code, getErrorMessage(code), {
      context,
      originalError,
      recoveryOptions: this.suggestRecovery(
        originalError ?? new Error(getErrorMessage(code)),
        ErrorSeverity.ERROR
      ),
    });
  }

  createError(code: string, message: string, options?: Partial<AppError>): AppError {
    return {
      code,
      message,
      severity: options?.severity ?? ErrorSeverity.ERROR,
      context: options?.context ?? 'unknown',
      timestamp: Date.now(),
      recoverable: options?.recoverable ?? true,
      recoveryOptions: options?.recoveryOptions,
      originalError: options?.originalError,
    };
  }

  private emitEvent(error: AppError): void {
    const eventType = error.severity === ErrorSeverity.FATAL ? 'error:fatal' : 'error:occurred';

    getEventBus().emit(eventType, {
      type: error.code,
      message: error.message,
      context: { severity: error.severity, recoverable: error.recoverable },
    });
  }

  private extractErrorCode(error: Error): ErrorCode | null {
    const match = error.message.match(/^(E\d{3})/);

    if (match?.[1]) {
      const code = match[1] as ErrorCode;

      if (Object.values(ErrorCodes).includes(code)) {
        return code;
      }
    }

    return null;
  }

  getHistory(): AppError[] {
    return [...this.history];
  }

  handle(error: Error | AppError, context?: { context?: string }): AppError {
    const appError = this.normalizeError(error, context?.context);

    this.recordError(appError);
    this.emitEvent(appError);

    if (appError.severity === ErrorSeverity.FATAL) {
      this.notifyFatalCallbacks(appError);
    }

    return appError;
  }

  private isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'severity' in error &&
      'timestamp' in error
    );
  }

  private normalizeError(error: Error | AppError, context?: string): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    const severity = this.categorizeSeverity(error);

    return {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      severity,
      context: context ?? 'unknown',
      timestamp: Date.now(),
      recoverable: severity !== ErrorSeverity.FATAL,
      recoveryOptions: this.suggestRecovery(error, severity),
      originalError: error,
    };
  }

  private notifyFatalCallbacks(error: AppError): void {
    for (const callback of this.fatalCallbacks) {
      try {
        callback(error);
      } catch (err) {
        console.error('Fatal callback error:', err);
      }
    }
  }

  onFatalError(callback: (error: AppError) => void): () => void {
    this.fatalCallbacks.add(callback);

    return () => this.fatalCallbacks.delete(callback);
  }

  private recordError(error: AppError): void {
    this.history.push(error);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  private suggestRecovery(error: Error, severity: ErrorSeverity): RecoveryOption[] | undefined {
    const code = this.extractErrorCode(error);

    if (code) {
      switch (code) {
        case ErrorCodes.ASSET_LOAD_FAILED:
        case ErrorCodes.ASSET_INVALID:
          return [
            {
              label: '重试加载',
              action: () => {
                getEventBus().emit('asset:retry', {});
              },
            },
            {
              label: '选择其他文件',
              action: () => {
                getEventBus().emit('ui:open-upload', {});
              },
            },
          ];
        case ErrorCodes.ASSET_TOO_LARGE:
          return [
            {
              label: '选择较小文件',
              action: () => {
                getEventBus().emit('ui:open-upload', {});
              },
            },
          ];
        case ErrorCodes.SERVICE_NOT_READY:
        case ErrorCodes.INIT_FAILED:
          return [
            {
              label: '重新初始化',
              action: () => {
                window.location.reload();
              },
            },
          ];
        case ErrorCodes.AI_MODEL_LOAD_FAILED:
        case ErrorCodes.AI_INFERENCE_FAILED:
          return [
            {
              label: '重试AI处理',
              action: () => {
                getEventBus().emit('ai:retry', {});
              },
            },
            {
              label: '跳过AI处理',
              action: () => {
                getEventBus().emit('ai:skip', {});
              },
            },
          ];
      }
    }

    if (severity === ErrorSeverity.FATAL) {
      return [
        {
          label: '刷新页面',
          action: () => {
            window.location.reload();
          },
        },
      ];
    }
    if (severity === ErrorSeverity.ERROR) {
      return [{ label: '重试', action: () => {} }];
    }

    return undefined;
  }
}

export interface AppError {
  code: string;
  context: string;
  message: string;
  originalError?: Error;
  recoverable: boolean;
  recoveryOptions?: RecoveryOption[];
  severity: ErrorSeverity;
  timestamp: number;
}
export interface ErrorHandler {
  clearHistory(): void;
  createError(code: string, message: string, options?: Partial<AppError>): AppError;
  getHistory(): AppError[];
  handle(error: Error | AppError, context?: { context?: string }): AppError;
  onFatalError(callback: (error: AppError) => void): () => void;
}
export interface RecoveryOption {
  action: () => void | Promise<void>;
  label: string;
}

export enum ErrorSeverity {
  ERROR = 'error',
  FATAL = 'fatal',
  INFO = 'info',
  WARNING = 'warning',
}

export const getErrorHandler = (): ErrorHandler => ErrorHandler.getInstance();
export const resetErrorHandler = (): void => {
  ErrorHandler.resetInstance();
};
