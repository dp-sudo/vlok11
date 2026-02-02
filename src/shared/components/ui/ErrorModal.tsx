import { memo } from 'react';

import type { AppError } from '@/core/ErrorHandler';

interface ErrorModalProps {
  error: AppError;
  isOpen: boolean;
  onClose: () => void;
  onRecovery?: (action: () => void | Promise<void>) => void;
}

const getSeverityIcon = (severity: AppError['severity']): string => {
  if (severity === 'fatal') return '⛔';
  if (severity === 'error') return '❌';
  if (severity === 'warning') return '⚠️';

  return 'ℹ️';
};

export const ErrorModal = memo(({ error, isOpen, onClose, onRecovery }: ErrorModalProps) => {
  if (!isOpen) return null;

  const handleRecovery = async (action: () => void | Promise<void>) => {
    try {
      await action();
      onClose();
    } catch (err) {
      console.error('Recovery action failed:', err);
    }
    if (onRecovery) {
      onRecovery(action);
    }
  };

  const severityColors = {
    fatal: 'text-red-500',
    error: 'text-orange-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getSeverityIcon(error.severity)}</span>
              <div>
                <h2 className={`text-lg font-semibold ${severityColors[error.severity]}`}>
                  {error.severity.toUpperCase()}: {error.code}
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              className="text-zinc-400 hover:text-white transition-colors"
              onClick={onClose}
              type="button"
            >
              <svg
                aria-label="关闭"
                className="w-6 h-6"
                fill="none"
                role="img"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>关闭</title>
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">错误信息</h3>
            <p className="text-zinc-100 bg-zinc-800 p-3 rounded border border-zinc-700">
              {error.message}
            </p>
          </div>

          {error.context ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">上下文</h3>
              <p className="text-zinc-400 bg-zinc-800 p-3 rounded border border-zinc-700 text-sm">
                {error.context}
              </p>
            </div>
          ) : null}

          {error.originalError ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">技术详情</h3>
              <div className="bg-zinc-800 p-3 rounded border border-zinc-700 space-y-2">
                <p className="text-zinc-400 text-sm">
                  <span className="font-semibold">错误类型:</span> {error.originalError.name}
                </p>
                {error.originalError.stack ? (
                  <pre className="text-xs text-zinc-500 overflow-x-auto whitespace-pre-wrap break-words">
                    {error.originalError.stack}
                  </pre>
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">状态</h3>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${error.recoverable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {error.recoverable ? '可恢复' : '不可恢复'}
              </span>
            </div>
          </div>
        </div>

        {error.recoveryOptions && error.recoveryOptions.length > 0 ? (
          <div className="p-6 border-t border-zinc-700 bg-zinc-800/50">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">恢复选项</h3>
            <div className="flex flex-wrap gap-2">
              {error.recoveryOptions.map((option) => (
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                  key={option.label}
                  onClick={() => void handleRecovery(option.action)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
              <button
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded transition-colors"
                onClick={onClose}
                type="button"
              >
                关闭
              </button>
            </div>
          </div>
        ) : null}

        {(!error.recoveryOptions || error.recoveryOptions.length === 0) && (
          <div className="p-6 border-t border-zinc-700">
            <button
              className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded transition-colors"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ErrorModal.displayName = 'ErrorModal';
