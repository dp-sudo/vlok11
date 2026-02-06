import { MAX_ERROR_HISTORY } from '@/shared/constants';

import { type ErrorCode, ErrorCodes, getErrorMessage } from './ErrorCodes';
import { getEventBus } from './EventBus';

export class ErrorHandler implements ErrorHandlerContract {
  private static instance: ErrorHandler | null = null;
  private fatalCallbacks = new Set<(error: AppError) => void>();
  private history: AppError[] = [];
  private maxHistory = MAX_ERROR_HISTORY;
  private disposed = false;

  static getInstance(): ErrorHandler {
    ErrorHandler.instance ??= new ErrorHandler();

    return ErrorHandler.instance;
  }

  static resetInstance(): void {
    if (ErrorHandler.instance) {
      ErrorHandler.instance.dispose();
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
    if (this.disposed) {
      console.warn('ErrorHandler already disposed');
      return;
    }
    this.history = [];
  }

  createCodedError(code: ErrorCode, context: string, originalError?: Error): AppError {
    const recoveryOptions = this.suggestRecovery(
      originalError ?? new Error(getErrorMessage(code)),
      ErrorSeverity.ERROR
    );

    return this.createError(code, getErrorMessage(code), {
      context,
      ...(originalError ? { originalError } : {}),
      ...(recoveryOptions ? { recoveryOptions } : {}),
    });
  }

  createError(code: string, message: string, options?: Partial<AppError>): AppError {
    if (this.disposed) {
      console.warn('ErrorHandler has been disposed, cannot create new error');
      return {
        code: 'DISPOSED',
        message: 'ErrorHandler has been disposed',
        severity: ErrorSeverity.ERROR,
        context: 'disposed',
        timestamp: Date.now(),
        recoverable: false,
      };
    }

    return {
      code,
      message,
      severity: options?.severity ?? ErrorSeverity.ERROR,
      context: options?.context ?? 'unknown',
      timestamp: Date.now(),
      recoverable: options?.recoverable ?? true,
      ...(options?.recoveryOptions ? { recoveryOptions: options.recoveryOptions } : {}),
      ...(options?.originalError ? { originalError: options.originalError } : {}),
    };
  }

  private emitEvent(error: AppError): void {
    try {
      const eventType = error.severity === ErrorSeverity.FATAL ? 'error:fatal' : 'error:occurred';

      getEventBus().emit(eventType, {
        type: error.code,
        message: error.message,
        context: { severity: error.severity, recoverable: error.recoverable },
      });
    } catch {
      // 避免事件总线错误导致二次崩溃
      console.error('Failed to emit error event:', error);
    }
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

  /** 获取错误历史记录的只读副本 */
  getHistory(): AppError[] {
    return [...this.history];
  }

  handle(error: Error | AppError, context?: { context?: string }): AppError {
    if (this.disposed) {
      console.warn('ErrorHandler has been disposed, error not recorded:', error);
      return this.createError('DISPOSED', 'ErrorHandler disposed', { ...(context?.context ? { context: context.context } : {}) });
    }

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

    const recoveryOptions = this.suggestRecovery(error, severity);

    return {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      severity,
      context: context ?? 'unknown',
      timestamp: Date.now(),
      recoverable: severity !== ErrorSeverity.FATAL,
      ...(recoveryOptions ? { recoveryOptions } : {}),
      originalError: error as Error,
    } as AppError;
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
    if (this.disposed) {
      console.warn('Adding fatal callback to disposed ErrorHandler');
      return () => {};
    }

    this.fatalCallbacks.add(callback);

    return () => this.fatalCallbacks.delete(callback);
  }

  private recordError(error: AppError): void {
    this.history.push(error);
    if (this.history.length > this.maxHistory) {
      // 只保留最近的错误历史
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  private suggestRecovery(error: Error, severity: ErrorSeverity): RecoveryOption[] | undefined {
    const code = this.extractErrorCode(error);
    const message = error.message.toLowerCase();

    // Handle TensorFlow specific errors
    if (message.includes('tensorflow') || message.includes('model load timeout')) {
      return [
        {
          label: '使用云端AI模式',
          action: () => {
            try {
              getEventBus().emit('ai:switch-to-gemini', {});
            } catch {
              console.warn('Failed to switch to Gemini AI mode');
            }
          },
        },
        {
          label: '重试加载',
          action: () => {
            try {
              getEventBus().emit('ai:retry-tensorflow', {});
            } catch {
              console.warn('Failed to retry TensorFlow loading');
            }
          },
        },
      ];
    }

    if (code) {
      switch (code) {
        case ErrorCodes.ASSET_LOAD_FAILED:
        case ErrorCodes.ASSET_INVALID:
          return [
            {
              label: '重试加载',
              action: () => {
                try {
                  getEventBus().emit('asset:retry', {});
                } catch {
                  console.warn('Failed to retry asset loading');
                }
              },
            },
            {
              label: '选择其他文件',
              action: () => {
                try {
                  getEventBus().emit('ui:open-upload', {});
                } catch {
                  console.warn('Failed to open upload dialog');
                }
              },
            },
          ];
        case ErrorCodes.ASSET_TOO_LARGE:
          return [
            {
              label: '选择较小文件',
              action: () => {
                try {
                  getEventBus().emit('ui:open-upload', {});
                } catch {
                  console.warn('Failed to open upload dialog');
                }
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
                try {
                  getEventBus().emit('ai:retry', {});
                } catch {
                  console.warn('Failed to retry AI processing');
                }
              },
            },
            {
              label: '跳过AI处理',
              action: () => {
                try {
                  getEventBus().emit('ai:skip', {});
                } catch {
                  console.warn('Failed to skip AI processing');
                }
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

  /** 释放 ErrorHandler 资源 */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.fatalCallbacks.clear();
    this.history = [];
    ErrorHandler.instance = null;

    console.info('ErrorHandler disposed');
  }

  /** 检查是否已释放 */
  isDisposed(): boolean {
    return this.disposed;
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
export interface ErrorHandlerContract {
  clearHistory(): void;
  createError(code: string, message: string, options?: Partial<AppError>): AppError;
  getHistory(): AppError[];
  handle(error: Error | AppError, context?: { context?: string }): AppError;
  onFatalError(callback: (error: AppError) => void): () => void;
  dispose(): void;
  isDisposed(): boolean;
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

export const getErrorHandler = (): ErrorHandlerContract => ErrorHandler.getInstance();
export const resetErrorHandler = (): void => {
  ErrorHandler.resetInstance();
};
