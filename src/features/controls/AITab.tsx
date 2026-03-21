import type React from 'react';
import { memo, useCallback } from 'react';

import {
  AIProgressPanel,
  AIProviderPanel,
  ApiKeySettings,
  CacheManager,
  SmartSuggestions,
} from '@/features/ai/components';
import type { SceneConfig } from '@/shared/types';

interface AITabProps {
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  searchQuery?: string;
}

export const AITab: React.FC<AITabProps> = memo(({ config, set, searchQuery = '' }) => {
  const handleApplyOptimization = useCallback(
    (changes: Partial<SceneConfig>) => {
      Object.entries(changes).forEach(([key, value]) => {
        set(key as keyof SceneConfig, value as SceneConfig[keyof SceneConfig]);
      });
    },
    [set]
  );

  // 搜索过滤 - 过滤包含关键词的组件
  const searchLower = searchQuery.toLowerCase();
  const showProgress =
    !searchQuery || 'ai处理进度'.includes(searchLower) || 'progress'.includes(searchLower);
  const showApiKey =
    !searchQuery ||
    'api配置'.includes(searchLower) ||
    'apikey'.includes(searchLower) ||
    'api key'.includes(searchLower);
  const showProvider =
    !searchQuery || 'provider'.includes(searchLower) || '提供商'.includes(searchLower);
  const showCache = !searchQuery || '缓存'.includes(searchLower) || 'cache'.includes(searchLower);
  const showSmart =
    !searchQuery ||
    '智能'.includes(searchLower) ||
    'smart'.includes(searchLower) ||
    'ai'.includes(searchLower);

  return (
    <div className="space-y-4">
      {/* AI处理进度 */}
      {showProgress && <AIProgressPanel />}

      {/* API配置 */}
      {showApiKey && <ApiKeySettings />}

      {/* Provider配置 */}
      {showProvider && <AIProviderPanel />}

      {/* 缓存管理 */}
      {showCache && <CacheManager />}

      {/* 智能场景分析 */}
      {showSmart && (
        <SmartSuggestions currentConfig={config} onApplyOptimization={handleApplyOptimization} />
      )}
    </div>
  );
});

AITab.displayName = 'AITab';
