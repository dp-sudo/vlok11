import { memo, useCallback, useEffect, useState } from 'react';

import { useServices } from '@/core/contexts/ServiceContext';

interface CacheStats {
  analysisCacheSize: number;
  depthCacheSize: number;
  totalSize: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

export const CacheManager = memo(() => {
  const { aiService } = useServices();
  const [stats, setStats] = useState<CacheStats>({
    analysisCacheSize: 0,
    depthCacheSize: 0,
    totalSize: 0,
  });
  const [cacheEnabled, setCacheEnabled] = useState(true);

  const refreshStats = useCallback(() => {
    if (!aiService) return;

    const newStats = aiService.getCacheStats();
    const config = aiService.getCacheConfig();

    setStats(newStats);
    setCacheEnabled(config.enabled);
  }, [aiService]);

  const handleClearCache = useCallback(() => {
    if (!aiService) return;

    aiService.clearCache();
    refreshStats();
  }, [aiService, refreshStats]);

  const handleToggleCache = useCallback(() => {
    if (!aiService) return;

    const newEnabled = !cacheEnabled;

    aiService.updateCacheConfig({ enabled: newEnabled });
    setCacheEnabled(newEnabled);
  }, [aiService, cacheEnabled]);

  useEffect(() => {
    refreshStats();

    // 每5秒自动刷新
    const interval = setInterval(refreshStats, 5000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  const totalItems = stats.analysisCacheSize + stats.depthCacheSize;

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-800">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span>💾</span>
        AI 缓存管理
      </h3>

      {/* 缓存开关 */}
      <div className="mb-4 p-3 bg-slate-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">启用AI结果缓存</div>
            <div className="text-xs text-slate-500 mt-0.5">缓存可以加速重复处理，结果缓存30分钟</div>
          </div>
          <button
            onClick={handleToggleCache}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              cacheEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            type="button"
          >
            <span
              className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                cacheEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.analysisCacheSize}</div>
          <div className="text-xs text-slate-500">场景分析</div>
        </div>
        <div className="bg-slate-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{stats.depthCacheSize}</div>
          <div className="text-xs text-slate-500">深度图</div>
        </div>
        <div className="bg-slate-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{formatBytes(stats.totalSize)}</div>
          <div className="text-xs text-slate-500">总大小</div>
        </div>
      </div>

      {/* 缓存详情 */}
      <div className="mb-4 p-3 bg-slate-800/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">缓存条目总数</span>
          <span className="text-slate-800 font-medium">{totalItems} 个</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-slate-400">平均条目大小</span>
          <span className="text-slate-800 font-medium">
            {totalItems > 0 ? formatBytes(stats.totalSize / totalItems) : '-'}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={refreshStats}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-300 text-slate-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
          type="button"
        >
          <span>🔄</span>
          刷新
        </button>
        <button
          onClick={handleClearCache}
          disabled={totalItems === 0}
          className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 border border-red-500/30 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
          type="button"
        >
          <span>🗑️</span>
          清空缓存
        </button>
      </div>

      {!cacheEnabled && (
        <p className="mt-3 text-xs text-yellow-500 text-center">
          ⚠️ 缓存已禁用，AI处理将每次都重新计算
        </p>
      )}
    </div>
  );
});

CacheManager.displayName = 'CacheManager';
