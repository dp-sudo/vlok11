import { memo, useEffect, useState } from 'react';

import type { AppError } from '@/core/ErrorHandler';

interface ErrorToastProps {
  error: AppError | null;
  onClose: () => void;
  onRecovery?: (action: () => void | Promise<void>) => void;
}

export const ErrorToast = memo(({ error, onClose, onRecovery }: ErrorToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleClose is stable within render
  useEffect(() => {
    if (error) {
      setIsVisible(true);
      if (!error.recoveryOptions) {
        const timer = setTimeout(() => {
          handleClose();
        }, 5000);

        return () => clearTimeout(timer);
      }
    }

    return;
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleRecovery = async (action: () => void | Promise<void>) => {
    try {
      await action();
      handleClose();
    } catch (err) {
      console.error('Recovery action failed:', err);
    }
    if (onRecovery) {
      onRecovery(action);
    }
  };

  if (!error || !isVisible) return null;

  const severityColors = {
    fatal: 'bg-red-600 border-red-700',
    error: 'bg-orange-600 border-orange-700',
    warning: 'bg-yellow-600 border-yellow-700',
    info: 'bg-blue-600 border-blue-700',
  };

  const severityIcons = {
    fatal: '⛔',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`${severityColors[error.severity]} border-2 rounded-lg shadow-2xl max-w-md overflow-hidden`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{severityIcons[error.severity]}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">{error.code}</h3>
              <p className="text-white/90 text-xs mt-1 break-words">{error.message}</p>
              {error.context ? (
                <p className="text-white/70 text-xs mt-1 italic">Context: {error.context}</p>
              ) : null}
            </div>
            <button
              className="text-white/80 hover:text-white transition-colors"
              onClick={handleClose}
              type="button"
            >
              ✕
            </button>
          </div>

          {error.recoveryOptions && error.recoveryOptions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {error.recoveryOptions.map((option) => (
                <button
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors"
                  key={option.label}
                  onClick={() => void handleRecovery(option.action)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white/60 animate-progress"
            style={{ animationDuration: '5s' }}
          />
        </div>
      </div>
    </div>
  );
});

ErrorToast.displayName = 'ErrorToast';
