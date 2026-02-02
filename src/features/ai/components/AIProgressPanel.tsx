import { memo, useEffect, useRef, useState } from 'react';

import { useServices } from '@/core/contexts/ServiceContext';

interface ProgressState {
  isProcessing: boolean;
  message: string;
  progress: number;
  stage: string;
}

const STAGE_MESSAGES: Record<string, string> = {
  analyzing: 'AI场景分析中',
  depth_estimation: '深度图生成中',
  initializing: '初始化中',
  loading: '模型加载中',
  processing: '处理中',
};

const STAGE_EMOJIS: Record<string, string> = {
  analyzing: '🔍',
  depth_estimation: '📊',
  initializing: '⚙️',
  loading: '📦',
  processing: '⚡',
};

export const AIProgressPanel = memo(() => {
  const { aiService } = useServices();
  const [progress, setProgress] = useState<ProgressState>({
    stage: '',
    progress: 0,
    isProcessing: false,
    message: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aiService) return;

    const unsubscribe = aiService.onProgress((p, stage) => {
      const isProcessing = p < 100 && p > 0;

      setProgress({
        stage,
        progress: p,
        isProcessing,
        message: STAGE_MESSAGES[stage] || stage,
      });

      setIsVisible(isProcessing || p === 100);

      if (p === 100) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        hideTimerRef.current = setTimeout(() => setIsVisible(false), 3000);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [aiService]);

  if (!isVisible) return null;

  const emoji = STAGE_EMOJIS[progress.stage] || '🤖';

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-4 border border-slate-300/50 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl animate-pulse">{emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-800">{progress.message}</span>
            <span className="text-xs text-slate-400">{Math.round(progress.progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            >
              <div className="w-full h-full animate-pulse bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-3">
          <span className={`${progress.progress > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            ● 准备
          </span>
          <span className={`${progress.progress >= 30 ? 'text-purple-400' : 'text-slate-500'}`}>
            ● 处理
          </span>
          <span className={`${progress.progress >= 70 ? 'text-pink-400' : 'text-slate-500'}`}>
            ● 优化
          </span>
          <span className={`${progress.progress === 100 ? 'text-green-400' : 'text-slate-500'}`}>
            ● 完成
          </span>
        </div>

        {progress.progress === 100 && (
          <span className="text-green-400 animate-pulse">✓ 处理完成</span>
        )}
      </div>
    </div>
  );
});

AIProgressPanel.displayName = 'AIProgressPanel';
