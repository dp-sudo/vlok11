import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { getSettingsService } from '@/core/services/SettingsService';

export const ApiKeySettings = memo(() => {
  const settings = getSettingsService();
  const [apiKey, setApiKey] = useState(settings.getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(settings.store.getState().useLocalAi);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(() => {
    settings.store.getState().setApiKey(apiKey);
    setIsSaved(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => setIsSaved(false), 2000);
  }, [apiKey, settings]);

  const handleToggleLocalMode = useCallback(() => {
    const newValue = !isLocalMode;

    settings.store.getState().toggleLocalAi(newValue);
    setIsLocalMode(newValue);
  }, [isLocalMode, settings]);

  const hasKey = apiKey.length > 0;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl p-4 border border-zinc-700/50 shadow-xl">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
        <span className="text-lg">🔑</span>
        API 配置
      </h3>

      {/* 本地模式开关 */}
      <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-200">强制本地AI模式</div>
            <div className="text-xs text-zinc-500 mt-0.5">禁用云端AI，仅使用本地算法</div>
          </div>
          <button
            onClick={handleToggleLocalMode}
            className={`
              relative w-12 h-7 rounded-full transition-all duration-200
              ${isLocalMode ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-600'}
            `}
            type="button"
          >
            <span
              className={`
                absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md
                transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isLocalMode ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
            <span
              className={`
                absolute top-2 w-1.5 h-1.5 rounded-full transition-all duration-200
                ${isLocalMode ? 'left-2 bg-cyan-200' : 'right-2 bg-zinc-400'}
              `}
            />
          </button>
        </div>
      </div>

      {/* API Key 输入 */}
      <div className={`space-y-3 ${isLocalMode ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <label
            htmlFor="gemini-api-key"
            className="text-xs text-zinc-500 mb-1.5 block flex items-center justify-between"
          >
            <span>Gemini API Key</span>
            {hasKey && (
              <span className="text-xs text-cyan-400 flex items-center gap-1">
                <span>✓</span>
                已配置
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="gemini-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isLocalMode ? '本地模式无需配置' : '输入您的 Gemini API Key'}
              disabled={isLocalMode}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              disabled={!hasKey || isLocalMode}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 disabled:opacity-50 text-sm whitespace-nowrap transition-colors"
              type="button"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            用于云端场景分析，获取地址：
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline ml-1"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {isSaved && <span className="text-cyan-400">✓ 已保存</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={isLocalMode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
            type="button"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
});

ApiKeySettings.displayName = 'ApiKeySettings';
