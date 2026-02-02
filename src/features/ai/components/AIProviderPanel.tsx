import { memo, useCallback, useEffect, useState } from 'react';

import { useServices } from '@/core/contexts/ServiceContext';

interface ProviderOption {
  description: string;
  icon: string;
  id: string;
  name: string;
}

const SCENE_PROVIDERS: ProviderOption[] = [
  {
    id: 'gemini',
    name: 'Gemini AI',
    description: '云端大模型，分析精准，需要API Key',
    icon: '🧠',
  },
  {
    id: 'fallback',
    name: '本地分析',
    description: '轻量级本地算法，无需网络',
    icon: '🏠',
  },
];

const DEPTH_PROVIDERS: ProviderOption[] = [
  {
    id: 'tensorflow',
    name: 'TensorFlow.js',
    description: '本地AI模型，MiDaS深度估计算法',
    icon: '🤖',
  },
  {
    id: 'fallback',
    name: 'Canvas算法',
    description: '浏览器原生实现，快速但精度较低',
    icon: '🎨',
  },
];

export const AIProviderPanel = memo(() => {
  const { aiService } = useServices();
  const [activeSceneProvider, setActiveSceneProvider] = useState<string>('fallback');
  const [activeDepthProvider, setActiveDepthProvider] = useState<string>('fallback');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aiService) {
      setActiveSceneProvider(aiService.getActiveProviderId('scene'));
      setActiveDepthProvider(aiService.getActiveProviderId('depth'));
    }
  }, [aiService]);

  const handleProviderChange = useCallback(
    async (type: 'scene' | 'depth', providerId: string) => {
      if (!aiService) return;

      setIsLoading(true);
      setError(null);

      try {
        await aiService.switchProvider(type, providerId);

        if (type === 'scene') {
          setActiveSceneProvider(providerId);
        } else {
          setActiveDepthProvider(providerId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '切换Provider失败');
      } finally {
        setIsLoading(false);
      }
    },
    [aiService]
  );

  const isProviderAvailable = useCallback(
    (providerId: string) => {
      if (!aiService) return false;

      return aiService.isProviderAvailable(providerId);
    },
    [aiService]
  );

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl p-4 border border-zinc-700/50 shadow-xl">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
        <span className="text-lg">⚙️</span>
        AI Provider 配置
      </h3>

      {/* 场景分析 Provider */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-2 block">场景分析引擎</div>
        <div className="space-y-2">
          {SCENE_PROVIDERS.map((provider) => {
            const isAvailable = isProviderAvailable(provider.id);
            const isActive = activeSceneProvider === provider.id;

            return (
              <button
                key={provider.id}
                disabled={!isAvailable || isLoading}
                onClick={() => void handleProviderChange('scene', provider.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'
                } ${!isAvailable || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{provider.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${isActive ? 'text-blue-400' : 'text-zinc-200'}`}
                      >
                        {provider.name}
                      </span>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 深度估计 Provider */}
      <div className="mb-3">
        <div className="text-xs text-zinc-500 mb-2 block">深度估计引擎</div>
        <div className="space-y-2">
          {DEPTH_PROVIDERS.map((provider) => {
            const isAvailable = isProviderAvailable(provider.id);
            const isActive = activeDepthProvider === provider.id;

            return (
              <button
                key={provider.id}
                disabled={!isAvailable || isLoading}
                onClick={() => void handleProviderChange('depth', provider.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'
                } ${!isAvailable || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{provider.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${isActive ? 'text-purple-400' : 'text-zinc-200'}`}
                      >
                        {provider.name}
                      </span>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          ⚠️ {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-3 text-xs text-zinc-500 text-center py-2 bg-zinc-800/30 rounded-lg">
          <span className="inline-block animate-spin mr-2">⟳</span>
          切换中...
        </div>
      )}
    </div>
  );
});

AIProviderPanel.displayName = 'AIProviderPanel';
