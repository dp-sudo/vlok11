import { memo, useCallback, useState } from 'react';

import { CameraMode } from '@/core/domain/types';
import { createLogger } from '@/core/Logger';
import type { SceneAnalysis, SceneOptimization } from '@/features/ai/services/SmartAssistant';
import { getSmartAssistant } from '@/features/ai/services/SmartAssistant';
import type { SceneConfig } from '@/shared/types';

const logger = createLogger({ module: 'SmartSuggestions' });

interface SmartSuggestionsProps {
  currentConfig: SceneConfig;
  imageData?: ImageData;
  onApplyOptimization: (changes: Partial<SceneConfig>) => void;
}

const PRIORITY_CONFIG = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    label: '高优先级',
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-400',
    label: '中优先级',
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    label: '建议',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  camera: '📷',
  rendering: '🎨',
  performance: '⚡',
  visual: '👁️',
};

const formatValue = (value: string | number | undefined): string => {
  if (value === undefined) return '-';
  if (typeof value === 'number') return value.toFixed(1);

  return String(value);
};

const getScoreColorClass = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';

  return 'bg-red-500';
};

export const SmartSuggestions = memo(
  ({ currentConfig, imageData, onApplyOptimization }: SmartSuggestionsProps) => {
    const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [appliedOptimizations, setAppliedOptimizations] = useState<Set<number>>(new Set());

    const runAnalysis = useCallback(async () => {
      setIsAnalyzing(true);
      setAppliedOptimizations(new Set());

      try {
        const assistant = getSmartAssistant();
        const result = await assistant.analyzeScene(currentConfig, imageData);

        setAnalysis(result);
      } catch (error) {
        logger.error('Scene analysis failed', { error: String(error) });
      } finally {
        setIsAnalyzing(false);
      }
    }, [currentConfig, imageData]);

    const applyOptimization = useCallback(
      (opt: SceneOptimization, index: number) => {
        if (opt.recommendedValue !== undefined) {
          const changes: Partial<SceneConfig> = {};

          // 根据优化类别映射到具体的配置字段
          switch (opt.category) {
            case 'camera':
              if (opt.suggestion.includes('FOV')) {
                changes.fov = Number(opt.recommendedValue);
              }
              if (opt.suggestion.includes('相机')) {
                changes.cameraMode =
                  opt.recommendedValue === 'perspective'
                    ? CameraMode.PERSPECTIVE
                    : CameraMode.ORTHOGRAPHIC;
              }
              break;
            case 'rendering':
              if (opt.suggestion.includes('位移')) {
                changes.displacementScale = Number(opt.recommendedValue);
              }
              if (opt.suggestion.includes('渲染')) {
                changes.renderStyle = opt.recommendedValue as SceneConfig['renderStyle'];
              }
              if (opt.suggestion.includes('投影')) {
                changes.projectionMode = opt.recommendedValue as SceneConfig['projectionMode'];
              }
              break;
            case 'performance':
              if (opt.suggestion.includes('投影')) {
                changes.projectionMode = opt.recommendedValue as SceneConfig['projectionMode'];
              }
              break;
            case 'visual':
              if (opt.suggestion.includes('亮度')) {
                changes.brightness = Number(opt.recommendedValue);
              }
              break;
          }

          onApplyOptimization(changes);
          setAppliedOptimizations((prev) => new Set(prev).add(index));
        }
      },
      [onApplyOptimization]
    );

    const applyAllOptimizations = useCallback(() => {
      if (!analysis) return;

      const allChanges: Partial<SceneConfig> = {};

      analysis.optimizations.forEach((opt) => {
        if (opt.recommendedValue !== undefined && opt.priority === 'high') {
          switch (opt.category) {
            case 'camera':
              if (opt.suggestion.includes('FOV')) {
                allChanges.fov = Number(opt.recommendedValue);
              }
              break;
            case 'rendering':
              if (opt.suggestion.includes('位移')) {
                allChanges.displacementScale = Number(opt.recommendedValue);
              }
              break;
            case 'performance':
              if (opt.suggestion.includes('投影')) {
                allChanges.projectionMode = opt.recommendedValue as SceneConfig['projectionMode'];
              }
              break;
          }
        }
      });

      onApplyOptimization(allChanges);
      setAppliedOptimizations(
        new Set(
          analysis.optimizations
            .map((_, i) => i)
            .filter((i) => analysis.optimizations[i]?.priority === 'high')
        )
      );
    }, [analysis, onApplyOptimization]);

    if (!analysis) {
      return (
        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔮</span>
            智能场景分析
          </h3>

          <button
            disabled={isAnalyzing}
            onClick={() => void runAnalysis()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            type="button"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin">⚡</span>
                分析场景中...
              </>
            ) : (
              <>
                <span>🔍</span>
                开始智能分析
              </>
            )}
          </button>

          <p className="text-xs text-zinc-500 mt-3 text-center">
            AI将分析当前场景配置，提供优化建议
          </p>
        </div>
      );
    }

    const highPriorityCount = analysis.optimizations.filter(
      (opt) => opt.priority === 'high'
    ).length;

    return (
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>🔮</span>
            智能分析结果
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white">
              {analysis.overallScore}
              <span className="text-sm text-zinc-500 font-normal">/100</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${getScoreColorClass(analysis.overallScore)}`} />
          </div>
        </div>

        {/* 总结 */}
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {analysis.strengths.map((strength) => (
              <span
                key={`strength-${strength}`}
                className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded"
              >
                ✓ {strength}
              </span>
            ))}
            {analysis.weaknesses.map((weakness) => (
              <span
                key={`weakness-${weakness}`}
                className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded"
              >
                ⚠ {weakness}
              </span>
            ))}
          </div>
        </div>

        {/* 优化建议列表 */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {analysis.optimizations.map((opt, index) => {
            const config = PRIORITY_CONFIG[opt.priority];
            const isApplied = appliedOptimizations.has(index);
            const uniqueKey = `${opt.category}-${opt.suggestion}-${opt.priority}-${opt.reason.slice(0, 20)}`;

            return (
              <div
                key={uniqueKey}
                className={`p-3 rounded-lg border ${config.bg} ${config.border} ${isApplied ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[opt.category]}</span>
                    <span className="text-sm font-medium text-white">{opt.suggestion}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${config.badgeBg} ${config.badgeText}`}
                  >
                    {config.label}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-2">{opt.reason}</p>
                <p className="text-xs text-zinc-500 mb-3">💡 {opt.impact}</p>

                {opt.recommendedValue !== undefined && !isApplied && (
                  <button
                    onClick={() => applyOptimization(opt, index)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors flex items-center gap-1"
                    type="button"
                  >
                    <span>🎯</span>
                    应用建议
                    <span className="text-zinc-500">
                      ({formatValue(opt.currentValue)} → {formatValue(opt.recommendedValue)})
                    </span>
                  </button>
                )}

                {isApplied && (
                  <span className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded flex items-center gap-1 inline-flex">
                    <span>✓</span>
                    已应用
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-800">
          {highPriorityCount > 0 && (
            <button
              onClick={applyAllOptimizations}
              className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
              type="button"
            >
              一键应用所有高优先级建议 ({highPriorityCount})
            </button>
          )}
          <button
            onClick={() => {
              setAnalysis(null);
              setAppliedOptimizations(new Set());
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            type="button"
          >
            重新分析
          </button>
        </div>
      </div>
    );
  }
);

SmartSuggestions.displayName = 'SmartSuggestions';
