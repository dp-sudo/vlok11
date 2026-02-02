import { AlertCircle, Info, RefreshCw, Settings } from 'lucide-react';
import { memo, useState } from 'react';

import type { ProcessingState } from '@/shared/types';

interface StatusDisplayProps {
  onRetry: () => void;
  processingState: ProcessingState;
}

export const StatusDisplay = memo(({ processingState, onRetry }: StatusDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);

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
      <div className="text-center max-w-md mx-auto">
        <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl p-6 border border-red-500/30 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

          <h3 className="text-lg font-medium text-white mb-2">处理失败</h3>

          <p className="text-zinc-300 mb-4 text-sm leading-relaxed">{processingState.message}</p>

          {/* 错误详情折叠面板 */}
          <div className="mb-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="w-3 h-3" />
              {showDetails ? '收起技术详情' : '查看技术详情'}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-zinc-950/50 rounded-lg text-left">
                <p className="text-xs text-zinc-500 font-mono break-all">
                  {processingState.message}
                </p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-sm transition-colors"
              onClick={() => {
                // 打开设置页面
                const event = new CustomEvent('openSettings');
                window.dispatchEvent(event);
              }}
            >
              <Settings className="w-4 h-4" />
              检查配置
            </button>
          </div>

          {/* 常见问题提示 */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              💡 提示：请确保上传的是JPG/PNG格式的图片，并检查AI服务配置是否正确。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

StatusDisplay.displayName = 'StatusDisplay';
