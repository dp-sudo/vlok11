import { X } from 'lucide-react';
import { memo } from 'react';

import { useSettingsViewModel } from '@/features/settings/viewmodels/useSettingsViewModel';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = memo(({ onClose }: SettingsModalProps) => {
  const { geminiApiKey, isQualityMode, setApiKey, setPerformanceMode, toggleLocalAi, useLocalAi } =
    useSettingsViewModel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white">设置</h2>
          <button
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">Gemini API Key</label>
            <div className="relative">
              <input
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                type="password"
                value={geminiApiKey}
              />
            </div>
            <p className="text-xs text-zinc-500">
              配置 API Key 以启用云端高精度 AI 生成。
              <a
                className="ml-1 text-indigo-400 hover:text-indigo-300 underline"
                href="https://aistudio.google.com/app/apikey"
                rel="noreferrer"
                target="_blank"
              >
                获取 Key
              </a>
            </p>
          </div>

          <div className="h-px bg-zinc-800" />

          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">处理模式</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isQualityMode
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setPerformanceMode('quality')}
                type="button"
              >
                画质优先 (AI)
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  !isQualityMode
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setPerformanceMode('speed')}
                type="button"
              >
                速度优先 (Local)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-sm font-medium text-zinc-300">强制使用本地模型</span>
              <button
                className={`w-10 h-6 rounded-full p-1 transition-colors border-none cursor-pointer ${useLocalAi ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                onClick={() => toggleLocalAi(!useLocalAi)}
                type="button"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${useLocalAi ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </label>
            <p className="text-xs text-zinc-500">
              即使配置了 API Key，也强制使用浏览器本地计算（适用于无网络环境）。
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
          <button
            className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            onClick={onClose}
            type="button"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
