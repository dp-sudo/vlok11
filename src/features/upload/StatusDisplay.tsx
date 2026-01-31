import { AlertCircle } from 'lucide-react';
import { memo } from 'react';

import type { ProcessingState } from '@/shared/types';

interface StatusDisplayProps {
  onRetry: () => void;
  processingState: ProcessingState;
}

export const StatusDisplay = memo(({ processingState, onRetry }: StatusDisplayProps) => {
  if (
    processingState.status === 'analyzing' ||
    processingState.status === 'processing_depth' ||
    processingState.status === 'uploading'
  ) {
    return (
      <div className="text-center z-10">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <h3 className="text-xl font-medium text-white mb-2">{processingState.message}</h3>

        <div className="w-64 h-2 bg-zinc-800 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${processingState.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (processingState.status === 'error') {
    return (
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">处理失败</h3>
        <p className="text-zinc-400 mb-6 text-sm">{processingState.message}</p>
        <button
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white"
          onClick={onRetry}
        >
          重试
        </button>
      </div>
    );
  }

  return null;
});

StatusDisplay.displayName = 'StatusDisplay';
