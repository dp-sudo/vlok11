import React, { memo, useCallback } from 'react';

import {
  AIProviderPanel,
  AIProgressPanel,
  ApiKeySettings,
  CacheManager,
  SmartSuggestions,
} from '@/features/ai/components';
import type { SceneConfig } from '@/shared/types';

interface AITabProps {
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}

export const AITab: React.FC<AITabProps> = memo(({ config, set }) => {
  const handleApplyOptimization = useCallback(
    (changes: Partial<SceneConfig>) => {
      Object.entries(changes).forEach(([key, value]) => {
        set(key as keyof SceneConfig, value as SceneConfig[keyof SceneConfig]);
      });
    },
    [set]
  );

  return (
    <div className="space-y-4">
      {/* AI处理进度 */}
      <AIProgressPanel />

      {/* API配置 */}
      <ApiKeySettings />

      {/* Provider配置 */}
      <AIProviderPanel />

      {/* 缓存管理 */}
      <CacheManager />

      {/* 智能场景分析 */}
      <SmartSuggestions currentConfig={config} onApplyOptimization={handleApplyOptimization} />
    </div>
  );
});

AITab.displayName = 'AITab';
