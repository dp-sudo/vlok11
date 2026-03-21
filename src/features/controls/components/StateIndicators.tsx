import { AlertCircle, Loader2 } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const LoadingSpinner = memo<LoadingSpinnerProps>(({ className = '', size = 'md' }) => (
  <Loader2
    className={`${sizeClasses[size]} animate-spin text-cyan-500 ${className}`}
    aria-label="加载中"
  />
));

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = memo<LoadingOverlayProps>(({ message = '加载中...' }) => (
  <output
    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
    aria-live="polite"
    aria-label={message}
  >
    <div className="flex flex-col items-center gap-3">
      <LoadingSpinner size="lg" />
      <span className="text-cyan-400 text-sm font-medium">{message}</span>
    </div>
  </output>
));

LoadingOverlay.displayName = 'LoadingOverlay';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = memo<ErrorMessageProps>(({ message, onRetry }) => (
  <div
    className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
    role="alert"
  >
    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
    <div className="flex-1 min-w-0">
      <p className="text-red-400 text-sm font-medium">加载失败</p>
      <p className="text-red-300/70 text-xs mt-0.5 truncate">{message}</p>
    </div>
    {onRetry && (
      <button
        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
        onClick={onRetry}
        type="button"
      >
        重试
      </button>
    )}
  </div>
));

ErrorMessage.displayName = 'ErrorMessage';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo<EmptyStateProps>(({ icon, message, description, action }) => (
  <output
    className="flex flex-col items-center justify-center py-8 px-4 text-center"
    aria-label={message}
  >
    {icon && (
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
        {icon}
      </div>
    )}
    <p className="text-zinc-300 font-medium">{message}</p>
    {description && <p className="text-zinc-500 text-sm mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </output>
));

EmptyState.displayName = 'EmptyState';

interface StateContainerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
}

export const StateContainer = memo<StateContainerProps>(
  ({ children, isLoading, error, onRetry, loadingMessage }) => {
    if (isLoading) {
      return <LoadingOverlay message={loadingMessage ?? '加载中...'} />;
    }

    if (error) {
      return onRetry ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : (
        <ErrorMessage message={error} />
      );
    }

    return children;
  }
);

StateContainer.displayName = 'StateContainer';
