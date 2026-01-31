import { Component, type ErrorInfo, type ReactNode } from 'react';

import { type AppError, ErrorSeverity, getErrorHandler } from '@/core/ErrorHandler';
import { getEventBus } from '@/core/EventBus';

import { ErrorModal } from './ui/ErrorModal';
import { ErrorToast } from './ui/ErrorToast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, resetError: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  currentError: AppError | null;
  errorHistory: AppError[];
  hasError: boolean;
  showModal: boolean;
  toastError: AppError | null;
}

export class ErrorBoundaryWithRecovery extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler = getErrorHandler();
  private eventBus = getEventBus();
  handleCloseModal = (): void => {
    this.setState({ showModal: false });
  };

  handleCloseToast = (): void => {
    this.setState({ toastError: null });
  };

  handleRecovery = async (action: () => void | Promise<void>): Promise<void> => {
    try {
      await action();
      this.resetError();
    } catch (err) {
      console.error('Recovery failed:', err);
    }
  };

  resetError = (): void => {
    this.setState({
      hasError: false,
      currentError: null,
      showModal: false,
      toastError: null,
    });
  };

  private unsubscribeError?: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      currentError: null,
      errorHistory: [],
      showModal: false,
      toastError: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = this.errorHandler.handle(error, {
      context: `React Error Boundary: ${errorInfo.componentStack ?? 'unknown'}`,
    });

    this.setState((prevState) => ({
      currentError: appError,
      errorHistory: [...prevState.errorHistory, appError],
      showModal:
        appError.severity === ErrorSeverity.FATAL || appError.severity === ErrorSeverity.ERROR,
      toastError:
        appError.severity === ErrorSeverity.WARNING || appError.severity === ErrorSeverity.INFO
          ? appError
          : null,
    }));

    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  override componentDidMount(): void {
    this.unsubscribeError = this.eventBus.on('error:occurred', (payload) => {
      const errorPayload = payload as { context?: { recoverable?: boolean }; message?: string };
      const error = new Error(errorPayload.message ?? 'Unknown error');
      const appError = this.errorHandler.handle(error, {
        context: errorPayload.context?.recoverable ? 'Recoverable error' : 'Error occurred',
      });

      this.setState({
        toastError: appError,
      });
    });
  }

  override componentWillUnmount(): void {
    if (this.unsubscribeError) {
      this.unsubscribeError();
    }
  }

  override render(): ReactNode {
    const { hasError, currentError, showModal, toastError } = this.state;
    const { children, fallback } = this.props;

    if (hasError && currentError) {
      if (fallback) {
        return fallback(currentError, this.resetError);
      }

      return (
        <>
          <div className="flex items-center justify-center h-screen bg-black text-white p-8">
            <div className="max-w-2xl">
              <div className="text-6xl mb-4">⛔</div>
              <h1 className="text-3xl font-bold mb-4">应用遇到错误</h1>
              <p className="text-zinc-400 mb-6">{currentError.message}</p>

              {currentError.recoveryOptions && currentError.recoveryOptions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500 mb-2">请尝试以下恢复选项：</p>
                  {currentError.recoveryOptions.map((option) => (
                    <button
                      className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-left"
                      key={option.label}
                      onClick={() => void this.handleRecovery(option.action)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                className="mt-6 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                onClick={this.resetError}
                type="button"
              >
                尝试恢复
              </button>

              {this.state.errorHistory.length > 1 && (
                <p className="mt-4 text-xs text-zinc-600">
                  共发生 {this.state.errorHistory.length} 个错误
                </p>
              )}
            </div>
          </div>

          {showModal && currentError ? (
            <ErrorModal
              error={currentError}
              isOpen={showModal}
              onClose={this.handleCloseModal}
              onRecovery={(action) => void this.handleRecovery(action)}
            />
          ) : null}
        </>
      );
    }

    return (
      <>
        {children}
        {toastError ? (
          <ErrorToast
            error={toastError}
            onClose={this.handleCloseToast}
            onRecovery={(action) => void this.handleRecovery(action)}
          />
        ) : null}
      </>
    );
  }
}
