import {
  AlertCircle,
  Box,
  CheckCircle2,
  Clock,
  Cpu,
  FileImage,
  Loader2,
  RefreshCw,
  Scan,
  Settings,
  XCircle,
} from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

import type { ProcessingState } from '@/shared/types';

interface StatusDisplayProps {
  onCancel?: () => void;
  onRetry: () => void;
  processingState: ProcessingState;
}

interface ProcessingStep {
  description: string;
  icon: React.ReactNode;
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

// 预计处理时间（毫秒）
const ESTIMATED_TIMES: Record<string, number> = {
  analyzing: 2000,
  processing_depth: 5000,
  uploading: 1000,
};

export const StatusDisplay = memo(({ processingState, onRetry, onCancel }: StatusDisplayProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTime = useMemo(() => Date.now(), []);
  const [showDetails, setShowDetails] = useState(false);

  // 计算经过的时间
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, [startTime]);

  // 计算预计剩余时间
  const estimatedRemaining = useMemo(() => {
    const currentEstimate = ESTIMATED_TIMES[processingState.status] ?? 5000;
    const progress = processingState.progress / 100;
    const remaining = Math.max(0, currentEstimate * (1 - progress) - elapsedTime);

    return remaining;
  }, [processingState.status, processingState.progress, elapsedTime]);

  // 格式化时间
  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);

    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}分${remainingSeconds}秒`;
  };

  // 获取处理步骤
  const steps: ProcessingStep[] = useMemo(() => {
    const currentStatus = processingState.status;

    const getStepStatus = (stepId: string): ProcessingStep['status'] => {
      const stepOrder = ['upload', 'analyze', 'depth', 'scene'];
      const currentIndex = stepOrder.indexOf(
        currentStatus === 'uploading'
          ? 'upload'
          : currentStatus === 'analyzing'
            ? 'analyze'
            : currentStatus === 'processing_depth'
              ? 'depth'
              : 'scene'
      );
      const stepIndex = stepOrder.indexOf(stepId);

      if (stepIndex < currentIndex) return 'completed';
      if (stepIndex === currentIndex) return 'active';

      return 'pending';
    };

    return [
      {
        id: 'upload',
        label: '读取文件',
        description: '正在读取上传的文件数据',
        icon: <FileImage className="w-5 h-5" />,
        status: currentStatus === 'uploading' ? 'active' : 'completed',
      },
      {
        id: 'analyze',
        label: '分析媒体',
        description: '分析文件格式和内容',
        icon: <Scan className="w-5 h-5" />,
        status: getStepStatus('analyze'),
      },
      {
        id: 'depth',
        label: '深度估计',
        description: '使用AI生成深度图',
        icon: <Cpu className="w-5 h-5" />,
        status: getStepStatus('depth'),
      },
      {
        id: 'scene',
        label: '构建场景',
        description: '构建3D场景和材质',
        icon: <Box className="w-5 h-5" />,
        status: getStepStatus('scene'),
      },
    ];
  }, [processingState.status]);

  // 获取当前步骤索引
  const currentStepIndex = steps.findIndex((s) => s.status === 'active');

  // 处理中状态
  if (
    processingState.status === 'analyzing' ||
    processingState.status === 'processing_depth' ||
    processingState.status === 'uploading'
  ) {
    return (
      <div className="text-center z-10 w-full max-w-md mx-auto">
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-800 p-8 shadow-2xl">
          {/* 主进度 */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
            <div
              className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-cyan-400">{processingState.progress}%</span>
            </div>
          </div>

          {/* 状态标题 */}
          <h3 className="text-xl font-semibold text-white mb-2">{processingState.message}</h3>
          <p className="text-sm text-zinc-400 mb-6">
            {estimatedRemaining > 0 && `预计剩余 ${formatTime(estimatedRemaining)}`}
          </p>

          {/* 处理步骤 */}
          <div className="space-y-3 mb-6">
            {steps.map((step) => {
              const isActive = step.status === 'active';
              const isCompleted = step.status === 'completed';

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-cyan-950/30 border-cyan-500/30'
                      : isCompleted
                        ? 'bg-zinc-800/50 border-zinc-700/50'
                        : 'bg-zinc-900/50 border-zinc-800/30 opacity-50'
                  }`}
                >
                  <div
                    className={`${
                      isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-zinc-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-cyan-300'
                            : isCompleted
                              ? 'text-zinc-300'
                              : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                      {isActive && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${processingState.progress}%` }}
            />
          </div>

          {/* 统计信息 */}
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>已用时 {formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>
                步骤 {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
          </div>

          {/* 取消按钮 */}
          {onCancel && (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 mx-auto text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-sm"
                onClick={onCancel}
              >
                <XCircle className="w-4 h-4" />
                取消处理
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 错误状态
  if (processingState.status === 'error') {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">处理失败</h3>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{processingState.message}</p>

          {/* 错误详情 */}
          <div className="mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mx-auto"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '收起详情' : '查看详情'}
            </button>

            {showDetails && (
              <div className="mt-3 p-3 bg-zinc-950/50 rounded-lg text-left">
                <div className="space-y-2 text-xs text-zinc-500 font-mono">
                  <p>
                    <span className="text-zinc-600">状态:</span> {processingState.status}
                  </p>
                  <p>
                    <span className="text-zinc-600">时间:</span> {formatTime(elapsedTime)}
                  </p>
                  <p>
                    <span className="text-zinc-600">信息:</span> {processingState.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              onClick={() => {
                const event = new CustomEvent('openSettings');

                window.dispatchEvent(event);
              }}
            >
              <Settings className="w-4 h-4" />
              检查配置
            </button>
          </div>

          {/* 帮助提示 */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 leading-relaxed">
              💡 提示：请确保上传有效的图片或视频文件，检查网络连接，或尝试切换到不同的AI处理模式。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

StatusDisplay.displayName = 'StatusDisplay';
